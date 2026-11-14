"""Olah data uji coba dari database SQLite (atau hasil ekspor) untuk tahap Evaluation.

Pemakaian:  python scripts/analyze_results.py [path/ke/app.db]

Menampilkan:
- jumlah peserta
- akurasi & rata-rata level hint per template soal
- miskonsepsi yang paling sering muncul
- rata-rata skor usaha mental per modul (modul dengan skor >= 4 perlu direvisi)
- rata-rata skor IL / EL / GL dari angket beban kognitif
- skor tes awal/akhir dan N-gain per peserta
"""

from __future__ import annotations

import json
import sqlite3
import sys
from collections import Counter, defaultdict
from pathlib import Path
from statistics import mean

ROOT = Path(__file__).resolve().parents[1]


def n_gain(pre: float, post: float, max_score: float) -> float | None:
    if max_score - pre == 0:
        return None
    return (post - pre) / (max_score - pre)


def category(g: float) -> str:
    return "tinggi" if g >= 0.7 else "sedang" if g >= 0.3 else "rendah"


def main() -> int:
    db = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data" / "app.db"
    if not db.exists():
        print(f"Database tidak ditemukan: {db}")
        return 1
    conn = sqlite3.connect(db)
    conn.row_factory = sqlite3.Row

    participants = conn.execute("SELECT COUNT(*) FROM participants WHERE class_code != 'TAMU'").fetchone()[0]
    print(f"Peserta (non-tamu): {participants}\n")

    # ---- latihan per template
    per_tpl: dict[str, list[dict]] = defaultdict(list)
    misc = Counter()
    for row in conn.execute("SELECT item_id, payload FROM events WHERE type = 'answer'"):
        p = json.loads(row["payload"] or "{}")
        if row["item_id"] and row["item_id"].startswith("T-"):
            per_tpl[row["item_id"]].append(p)
        if p.get("misconception"):
            misc[p["misconception"]] += 1
    print("== Latihan per template (percobaan pertama) ==")
    for tid, rows in sorted(per_tpl.items()):
        first = [r for r in rows if r.get("attempt") == 1]
        if not first:
            continue
        acc = mean(1 if r.get("correct") else 0 for r in first)
        hint = mean(r.get("hint", 0) for r in first)
        print(f"  {tid:<12} n={len(first):<4} benar={acc:5.0%}  rata-rata hint={hint:.2f}")

    print("\n== Miskonsepsi tersering ==")
    for mid, count in misc.most_common(8):
        print(f"  {mid:<4} {count}x")

    # ---- survei
    effort: dict[str, list[float]] = defaultdict(list)
    cl: dict[str, list[float]] = defaultdict(list)
    for row in conn.execute("SELECT kind, module_id, answers FROM surveys"):
        ans = json.loads(row["answers"])
        if row["kind"] == "mental_effort":
            effort[row["module_id"] or "-"].append(ans.get("effort", 0))
        elif row["kind"] == "cl_questionnaire":
            for key, val in ans.items():
                cl[key[:2]].append(val)
    print("\n== Usaha mental per modul (1-5) ==")
    for mid, vals in sorted(effort.items()):
        flag = "  <- perlu revisi penyajian" if mean(vals) >= 4 else ""
        print(f"  {mid}: {mean(vals):.2f} (n={len(vals)}){flag}")
    print("\n== Angket beban kognitif (0-10) ==")
    for dim in ("IL", "EL", "GL"):
        if cl[dim]:
            print(f"  {dim}: {mean(cl[dim]):.2f}")

    # ---- tes awal/akhir
    scores: dict[str, dict[str, tuple[int, int]]] = defaultdict(dict)
    for row in conn.execute("SELECT anon_id, item_id, payload FROM events WHERE type = 'test_done' ORDER BY id"):
        p = json.loads(row["payload"])
        scores[row["anon_id"]][row["item_id"]] = (p["score"], p["total"])
    gains = []
    print("\n== Tes awal -> akhir ==")
    for anon, s in scores.items():
        if "pre" in s and "post" in s:
            (pre, total), (post, _) = s["pre"], s["post"]
            g = n_gain(pre, post, total)
            if g is not None:
                gains.append(g)
            g_text = "-" if g is None else f"{g:.2f}"
            print(f"  {anon[:8]}  {pre}/{total} -> {post}/{total}  N-gain={g_text}")
    if gains:
        avg = mean(gains)
        print(f"\nRata-rata N-gain: {avg:.2f} ({category(avg)})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
