"""Gabungkan file data kiriman siswa (metika-data-*.json) ke database SQLite.

Dipakai untuk uji coba tanpa server: siswa menekan "Bagikan file data" di Profil,
mengirim file lewat WhatsApp, lalu semua file ditaruh di satu folder.

Pemakaian:  python scripts/import_data.py [folder-kiriman] [path/ke/app.db]
Default:    data/kiriman/  ->  data/app.db

Aman dijalankan berulang kali: data yang sama (client_id sama) hanya disimpan sekali.
"""

from __future__ import annotations

import json
import sqlite3
import sys
from datetime import UTC, datetime
from pathlib import Path

from pydantic import ValidationError

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.app.db import SCHEMA  # noqa: E402
from backend.app.schemas import Event, Participant, Survey  # noqa: E402


def _now() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


def import_file(conn: sqlite3.Connection, path: Path) -> dict[str, int]:
    """Masukkan satu file kiriman. Mengembalikan jumlah baru, duplikat, dan rusak."""
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or data.get("app") != "metika":
        raise ValueError("bukan file data Metika")
    now = _now()
    count = {"baru": 0, "duplikat": 0, "rusak": 0}
    for item in data.get("items", []):
        kind, body = item.get("kind"), item.get("body", {})
        try:
            if kind == "participant":
                p = Participant.model_validate(body)
                conn.execute(
                    """INSERT INTO participants(anon_id, class_code, first_seen, app_version) VALUES (?, ?, ?, ?)
                       ON CONFLICT(anon_id) DO UPDATE SET app_version = excluded.app_version""",
                    (p.anon_id, p.class_code, now, p.app_version),
                )
                continue
            if kind == "event":
                ev = Event.model_validate(body)
                payload = json.dumps(ev.payload, ensure_ascii=False)
                cur = conn.execute(
                    """INSERT OR IGNORE INTO events
                       (client_id, anon_id, type, module_id, item_id, payload, client_ts, server_ts)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (ev.client_id, ev.anon_id, ev.type, ev.module_id, ev.item_id, payload, ev.client_ts, now),
                )
                anon = ev.anon_id
            elif kind == "survey":
                s = Survey.model_validate(body)
                cur = conn.execute(
                    """INSERT OR IGNORE INTO surveys
                       (client_id, anon_id, kind, module_id, answers, client_ts, server_ts)
                       VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    (s.client_id, s.anon_id, s.kind, s.module_id, json.dumps(s.answers), s.client_ts, now),
                )
                anon = s.anon_id
            else:
                count["rusak"] += 1
                continue
        except ValidationError:
            count["rusak"] += 1
            continue
        conn.execute(
            "INSERT OR IGNORE INTO participants(anon_id, class_code, first_seen) VALUES (?, '?', ?)", (anon, now)
        )
        count["baru" if cur.rowcount else "duplikat"] += 1
    return count


def main() -> int:
    folder = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data" / "kiriman"
    db = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "data" / "app.db"
    folder.mkdir(parents=True, exist_ok=True)
    files = sorted(folder.glob("*.json"))
    if not files:
        print(f"Belum ada file .json di {folder}")
        print("Simpan file kiriman siswa (metika-data-....json) ke folder itu, lalu jalankan lagi.")
        return 0
    db.parent.mkdir(parents=True, exist_ok=True)
    total = {"baru": 0, "duplikat": 0, "rusak": 0}
    with sqlite3.connect(db) as conn:
        conn.executescript(SCHEMA)
        for f in files:
            try:
                c = import_file(conn, f)
            except (ValueError, json.JSONDecodeError) as err:
                print(f"  [LEWATI] {f.name}: {err}")
                continue
            for k in total:
                total[k] += c[k]
            print(f"  {f.name}: {c['baru']} baru, {c['duplikat']} sudah ada, {c['rusak']} rusak")
    print(f"[OK] {len(files)} file digabung ke {db}: {total['baru']} data baru.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
