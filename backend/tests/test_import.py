import importlib.util
import json
import sqlite3
from pathlib import Path

from backend.app.db import SCHEMA

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("import_data", ROOT / "scripts" / "import_data.py")
import_data = importlib.util.module_from_spec(spec)
spec.loader.exec_module(import_data)

A = "abcdef0123456789"


def _file(tmp_path: Path) -> Path:
    items = [
        {"kind": "participant", "body": {"anon_id": A, "class_code": "SISWA", "app_version": "1.1.0"}},
        {
            "kind": "survey",
            "body": {
                "client_id": "survey-0001",
                "anon_id": A,
                "kind": "practicality",
                "module_id": None,
                "answers": {"P1": 4},
                "client_ts": "2026-11-21T08:00:00Z",
            },
        },
        {
            "kind": "event",
            "body": {
                "client_id": "event-0001",
                "anon_id": A,
                "type": "test_done",
                "module_id": None,
                "item_id": "pre",
                "payload": {"score": 5, "total": 10},
                "client_ts": "2026-11-21T08:00:00Z",
            },
        },
        {"kind": "event", "body": {"client_id": "x"}},  # rusak
    ]
    f = tmp_path / "metika-data-abcdef-2026-11-21.json"
    f.write_text(json.dumps({"app": "metika", "format": 1, "items": items}), encoding="utf-8")
    return f


def test_import_is_idempotent(tmp_path: Path) -> None:
    conn = sqlite3.connect(tmp_path / "app.db")
    conn.executescript(SCHEMA)
    f = _file(tmp_path)

    first = import_data.import_file(conn, f)
    assert first == {"baru": 2, "duplikat": 0, "rusak": 1}
    again = import_data.import_file(conn, f)  # file dikirim dua kali
    assert again["baru"] == 0 and again["duplikat"] == 2

    assert conn.execute("SELECT count(*) FROM surveys").fetchone()[0] == 1
    assert conn.execute("SELECT class_code FROM participants").fetchone()[0] == "SISWA"
