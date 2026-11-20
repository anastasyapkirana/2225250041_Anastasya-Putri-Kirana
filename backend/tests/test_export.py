import importlib.util
import json
import sqlite3
import zipfile
from pathlib import Path

from backend.app.db import SCHEMA

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("export_excel", ROOT / "scripts" / "export_excel.py")
export_excel = importlib.util.module_from_spec(spec)
spec.loader.exec_module(export_excel)


def test_export_excel_summary_and_valid_file(tmp_path: Path) -> None:
    db = tmp_path / "app.db"
    conn = sqlite3.connect(db)
    conn.executescript(SCHEMA)
    a = "abcdef0123456789"
    conn.execute("INSERT INTO participants VALUES (?, 'SISWA', '2026-11-21T08:00:00', '1.1.0')", (a,))
    for i, (form, score) in enumerate([("pre", 4), ("post", 7)]):
        conn.execute(
            "INSERT INTO events(client_id, anon_id, type, item_id, payload, client_ts, server_ts)"
            " VALUES (?,?,?,?,?,?,?)",
            (f"e{i}", a, "test_done", form, json.dumps({"score": score, "total": 10}), f"2026-11-2{i}", "x"),
        )
    conn.execute(
        "INSERT INTO surveys(client_id, anon_id, kind, module_id, answers, client_ts, server_ts)"
        " VALUES (?,?,?,?,?,?,?)",
        ("s1", a, "practicality", None, json.dumps({"P1": 4, "P2": 5}), "2026-11-21", "x"),
    )
    conn.commit()

    sheets = {name: rows for name, _, rows in export_excel.build_sheets(conn)}
    conn.close()
    row = sheets["Ringkasan"][0]
    assert row[3:6] == [4, 7, 0.5]  # tes awal, tes akhir, N-gain
    assert row[-1] == 4.5  # rata kepraktisan

    out = tmp_path / "hasil.xlsx"
    export_excel.write_xlsx(out, export_excel.build_sheets(sqlite3.connect(db)))
    with zipfile.ZipFile(out) as z:
        assert "xl/worksheets/sheet7.xml" in z.namelist()
