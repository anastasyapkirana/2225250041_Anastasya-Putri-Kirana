"""Solver referensi: evaluator ekspresi aman + pembangkit soal dari template.

Ekspresi yang sama dievaluasi di frontend oleh ``frontend/js/engine/expr.js``.
Kedua implementasi diuji dengan fixture yang sama
(``backend/tests/fixtures/expr_cases.json``).
"""

from __future__ import annotations

import ast
import math
import operator
import random
import re
from collections.abc import Mapping
from typing import Any

Number = float | int

_BIN_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Mod: operator.mod,
}
_CMP_OPS = {
    ast.Lt: operator.lt,
    ast.LtE: operator.le,
    ast.Gt: operator.gt,
    ast.GtE: operator.ge,
    ast.Eq: operator.eq,
    ast.NotEq: operator.ne,
}
_FUNCS = {"abs": abs, "floor": math.floor}

DEFAULT_SEQ = "a + (k - 1) * b"
PLACEHOLDER_RE = re.compile(r"\{([^{}|]+)(\|p)?\}")
SEQ_TERMS = 8


class ExprError(ValueError):
    """Ekspresi tidak valid atau memakai sintaks yang tidak diizinkan."""


def _normalize(expr: str) -> str:
    # Izinkan tanda minus Unicode di konten.
    return expr.replace("−", "-").strip()


def evaluate(expr: str, variables: Mapping[str, Number]) -> Number:
    """Evaluasi ekspresi aritmetika sederhana tanpa ``eval``."""
    try:
        tree = ast.parse(_normalize(expr), mode="eval")
    except SyntaxError as exc:  # pragma: no cover - pesan saja
        raise ExprError(f"Sintaks salah: {expr!r}") from exc
    return _eval(tree.body, variables, expr)


def _eval(node: ast.AST, env: Mapping[str, Number], src: str) -> Any:
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)) and not isinstance(node.value, bool):
        return node.value
    if isinstance(node, ast.Name):
        if node.id not in env:
            raise ExprError(f"Variabel tidak dikenal {node.id!r} di {src!r}")
        return env[node.id]
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.USub, ast.UAdd)):
        val = _eval(node.operand, env, src)
        return -val if isinstance(node.op, ast.USub) else +val
    if isinstance(node, ast.BinOp) and type(node.op) in _BIN_OPS:
        left = _eval(node.left, env, src)
        right = _eval(node.right, env, src)
        if isinstance(node.op, (ast.Div, ast.Mod)) and right == 0:
            raise ExprError(f"Pembagian dengan nol di {src!r}")
        return _BIN_OPS[type(node.op)](left, right)
    if isinstance(node, ast.Compare) and len(node.ops) == 1 and type(node.ops[0]) in _CMP_OPS:
        left = _eval(node.left, env, src)
        right = _eval(node.comparators[0], env, src)
        return _CMP_OPS[type(node.ops[0])](left, right)
    if (
        isinstance(node, ast.Call)
        and isinstance(node.func, ast.Name)
        and node.func.id in _FUNCS
        and len(node.args) == 1
        and not node.keywords
    ):
        return _FUNCS[node.func.id](_eval(node.args[0], env, src))
    raise ExprError(f"Sintaks tidak diizinkan ({type(node).__name__}) di {src!r}")


def clean(value: Number) -> Number:
    """Bulatkan galat floating point dan ubah ke int bila bulat."""
    value = round(float(value), 9)
    return int(value) if value.is_integer() else value


def format_id(value: Number, paren_negative: bool = False) -> str:
    """Format angka gaya Indonesia: ribuan titik, desimal koma, minus Unicode."""
    value = clean(value)
    if isinstance(value, int):
        text = f"{abs(value):,}".replace(",", ".")
    else:
        whole, frac = f"{abs(value):.6f}".rstrip("0").split(".")
        text = f"{int(whole):,}".replace(",", ".") + "," + frac
    if value < 0:
        text = "−" + text
        if paren_negative:
            text = f"({text})"
    return text


def render(template: str, env: Mapping[str, Number]) -> str:
    """Ganti ``{ekspresi}`` / ``{ekspresi|p}`` dengan nilainya."""

    def repl(match: re.Match[str]) -> str:
        return format_id(evaluate(match.group(1), env), paren_negative=bool(match.group(2)))

    return PLACEHOLDER_RE.sub(repl, template)


def compute_vars(template: Mapping[str, Any], params: Mapping[str, Number]) -> dict[str, Number]:
    """Hitung variabel turunan: u1..u8 dari ``seq`` lalu ``derived`` berurutan."""
    env: dict[str, Number] = dict(params)
    seq = template.get("seq") or DEFAULT_SEQ
    for k in range(1, SEQ_TERMS + 1):
        env[f"u{k}"] = clean(evaluate(seq, {**env, "k": k}))
    for key, expr in (template.get("derived") or {}).items():
        env[key] = clean(evaluate(expr, env))
    return env


def sample_template(template: Mapping[str, Any], rng: random.Random, max_tries: int = 500) -> dict[str, Number]:
    """Ambil parameter acak yang memenuhi ``exclude`` dan ``constraints``."""
    exclude = template.get("exclude") or {}
    constraints = template.get("constraints") or []
    for _ in range(max_tries):
        params = {name: rng.randint(lo, hi) for name, (lo, hi) in template["params"].items()}
        if any(params[name] in banned for name, banned in exclude.items()):
            continue
        env = compute_vars(template, params)
        if all(evaluate(c, env) for c in constraints):
            return env
    raise ExprError("Tidak menemukan parameter yang memenuhi batasan")


def field_answer(field: Mapping[str, Any], env: Mapping[str, Number]) -> Number:
    return clean(evaluate(field["answer"], env))
