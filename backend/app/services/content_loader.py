"""Memuat dan memvalidasi konten JSON di folder ``content/``."""

from __future__ import annotations

import json
import math
import random
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

from pydantic import ValidationError

from ..config import CONTENT_DIR
from ..schemas import Manifest, Misconception, Module, QuestionTemplate, QuizItem, StoryStep
from . import solver

BLANK_RE = re.compile(r"\[\[([^\]]+)\]\]")

# Jenis visual di frontend/js/components/viz.js -> (jumlah argumen minimal, maksimal).
VISUALS: dict[str, tuple[int, int]] = {
    "terms": (1, 12),
    "diff": (2, 12),
    "jumps": (3, 3),
    "tiles": (3, 3),
    "matches": (1, 1),
    "posts": (1, 1),
    "seats": (3, 4),
    "pots": (3, 4),
    "derive": (2, 2),
    "leap": (3, 3),
    "compare": (5, 6),
}
SAMPLES_PER_TEMPLATE = 200


def read_json(rel_path: str, base: Path = CONTENT_DIR) -> Any:
    with (base / rel_path).open(encoding="utf-8") as fh:
        return json.load(fh)


@lru_cache(maxsize=1)
def manifest() -> Manifest:
    return Manifest.model_validate(read_json("manifest.json"))


@lru_cache(maxsize=16)
def module(module_id: str) -> Module:
    entry = next((m for m in manifest().modules if m.id == module_id), None)
    if entry is None:
        raise KeyError(module_id)
    return Module.model_validate(read_json(entry.file))


@lru_cache(maxsize=1)
def templates() -> dict[str, QuestionTemplate]:
    raw = read_json(manifest().templates)
    return {tid: QuestionTemplate.model_validate(t) for tid, t in raw.items()}


@lru_cache(maxsize=1)
def misconceptions() -> dict[str, Misconception]:
    raw = read_json(manifest().misconceptions)
    return {mid: Misconception.model_validate(m) for mid, m in raw.items()}


def clear_cache() -> None:
    for fn in (manifest, module, templates, misconceptions):
        fn.cache_clear()


# ---------------------------------------------------------------- validasi


def check_visual(where: str, spec: str | None, errors: list[str], env: dict[str, float] | None = None) -> None:
    """Periksa spesifikasi "jenis:arg,..." (env: nama variabel template yang boleh dipakai)."""
    if not spec:
        return
    kind, _, arg_str = spec.partition(":")
    if kind not in VISUALS:
        errors.append(f"{where}: visual '{kind}' tidak dikenal")
        return
    args = [a.strip() for a in arg_str.split(",")] if arg_str else []
    lo, hi = VISUALS[kind]
    if not lo <= len(args) <= hi:
        errors.append(f"{where}: visual '{kind}' butuh {lo}-{hi} argumen, ada {len(args)}")
    for arg in args:
        if env is not None and arg in env:
            continue
        try:
            float(arg)
        except ValueError:
            errors.append(f"{where}: argumen visual '{arg}' bukan angka/variabel")


def _check_choice(where: str, options: list[str], answer: float, errors: list[str]) -> None:
    if not (float(answer).is_integer() and 0 <= int(answer) < len(options)):
        errors.append(f"{where}: indeks jawaban {answer} di luar pilihan")


def _check_quiz_item(where: str, item: QuizItem, errors: list[str]) -> None:
    if item.type == "mcq":
        if not item.options:
            errors.append(f"{where}: soal pilihan ganda tanpa opsi")
        else:
            _check_choice(where, item.options, item.answer, errors)


def validate_template(tid: str, tpl: QuestionTemplate, misc: dict[str, Misconception], errors: list[str]) -> None:
    raw = tpl.model_dump()
    rng = random.Random(tid)
    for i in range(SAMPLES_PER_TEMPLATE):
        try:
            env = solver.sample_template(raw, rng)
        except solver.ExprError as exc:
            errors.append(f"{tid}: {exc}")
            return
        try:
            texts = [tpl.prompt, *tpl.hints, *tpl.solution, *(f.label for f in tpl.fields)]
            for text in texts:
                solver.render(text, env)
            if i == 0:
                check_visual(f"{tid}.visual", tpl.visual, errors, env)
            for field in tpl.fields:
                ans = solver.field_answer(field.model_dump(), env)
                if not math.isfinite(ans) or not float(ans).is_integer():
                    errors.append(f"{tid}.{field.key}: jawaban bukan bilangan bulat ({ans}) untuk {env}")
                    return
                if field.type == "choice":
                    _check_choice(f"{tid}.{field.key}", field.options or [], ans, errors)
                for mid in field.misconceptions:
                    if mid not in misc:
                        errors.append(f"{tid}.{field.key}: miskonsepsi {mid} tidak ada")
                        return
                    if misc[mid].expr and i == 0:
                        solver.evaluate(misc[mid].expr, env)
        except solver.ExprError as exc:
            errors.append(f"{tid}: {exc}")
            return


def validate_story(where: str, step: StoryStep, errors: list[str]) -> None:
    m = step.model
    try:
        if step.target == "un":
            value = solver.clean(m["a"] + (m["n"] - 1) * m["b"])
        else:
            value = solver.clean((m["un"] - m["a"]) / m["b"] + 1)
            if not float(value).is_integer():
                errors.append(f"{where}: n tidak bulat ({value})")
    except KeyError as exc:
        errors.append(f"{where}: model kurang variabel {exc}")
        return
    if abs(value - step.expected) > 1e-9:
        errors.append(f"{where}: expected {step.expected} tetapi solver menghitung {value}")
    for name in ("known", "asked", "interpret", "reason"):
        choice = getattr(step, name)
        if choice is not None:
            _check_choice(f"{where}.{name}", choice.options, choice.answer, errors)


def validate_all() -> list[str]:
    """Kembalikan daftar kesalahan konten. Daftar kosong berarti konten valid."""
    clear_cache()
    errors: list[str] = []
    try:
        man = manifest()
        tpls = templates()
        misc = misconceptions()
    except (ValidationError, OSError, json.JSONDecodeError) as exc:
        return [f"manifest/templates/misconceptions: {exc}"]

    for mid, m in misc.items():
        if not m.near and not m.expr:
            errors.append(f"{mid}: miskonsepsi tanpa expr")

    for tid, tpl in tpls.items():
        validate_template(tid, tpl, misc, errors)

    for entry in man.modules:
        try:
            mod = module(entry.id)
        except (ValidationError, OSError, json.JSONDecodeError) as exc:
            errors.append(f"{entry.file}: {exc}")
            continue
        if mod.id != entry.id:
            errors.append(f"{entry.file}: id {mod.id} != {entry.id}")
        kinds = [s.kind for s in mod.steps]
        if kinds[-1] != "quiz":
            errors.append(f"{entry.id}: langkah terakhir harus kuis")
        for idx, step in enumerate(mod.steps):
            where = f"{entry.id}[{idx}:{step.kind}]"
            check_visual(f"{where}.visual", getattr(step, "visual", None), errors)
            disc = getattr(step, "discussion", None)
            if disc is not None:
                check_visual(f"{where}.discussion", disc.visual, errors)
            if step.kind == "practice":
                for tid in step.templates:
                    if tid not in tpls:
                        errors.append(f"{where}: template {tid} tidak ada")
            elif step.kind == "faded":
                blanks = [b for s in step.steps for b in BLANK_RE.findall(s)]
                if not blanks:
                    errors.append(f"{where}: contoh memudar tanpa isian [[...]]")
                for b in blanks:
                    try:
                        float(b)
                    except ValueError:
                        errors.append(f"{where}: isian [[{b}]] bukan angka")
            elif step.kind == "explain":
                if sum(o.correct for o in step.options) != 1:
                    errors.append(f"{where}: harus tepat satu opsi benar")
            elif step.kind == "story":
                validate_story(where, step, errors)
            elif step.kind == "mcq":
                _check_choice(where, step.options, step.answer, errors)
            elif step.kind == "quiz":
                for j, item in enumerate(step.items):
                    _check_quiz_item(f"{where}.{j}", item, errors)

    challenge = read_json(man.challenge)
    ids = [c["id"] for c in challenge["cards"]]
    if len(ids) != len(set(ids)):
        errors.append("challenge: id kartu ganda")
    if challenge["roundSize"] > len(ids):
        errors.append("challenge: roundSize lebih besar dari jumlah kartu")

    tests = read_json(man.tests)
    for form in ("pre", "post"):
        items = tests[form]["items"]
        for j, raw in enumerate(items):
            try:
                _check_quiz_item(f"tests.{form}.{j}", QuizItem.model_validate(raw), errors)
            except ValidationError as exc:
                errors.append(f"tests.{form}.{j}: {exc}")
    if len(tests["pre"]["items"]) != len(tests["post"]["items"]):
        errors.append("tests: jumlah butir pre dan post berbeda")
    return errors
