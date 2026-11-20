# ruff: noqa: E501  (string XML xlsx memang panjang)
"""Ekspor data penelitian dari SQLite ke satu file Excel (.xlsx).

Pemakaian:  python scripts/export_excel.py [path/ke/app.db] [path/keluaran.xlsx]
Default:    data/app.db  ->  data/hasil-penelitian.xlsx

Lembar yang dibuat:
- Ringkasan     : satu baris per siswa (tes awal/akhir, N-gain, rata-rata angket)
- Tes           : setiap Tes Awal / Tes Akhir
- Beban Kognitif: angket beban kognitif (IL, EL, GL) per siswa
- Kepraktisan   : angket kepraktisan per siswa
- Usaha Mental  : skor usaha mental setiap modul
- Aktivitas     : semua catatan aktivitas (data mentah)
- Peserta       : daftar ID anonim

Tidak memakai library tambahan: file .xlsx ditulis langsung (zip + XML).
Nama siswa tidak pernah ada di database, hanya ID anonim.
"""

from __future__ import annotations

import json
import sqlite3
import sys
import zipfile
from collections import defaultdict
from pathlib import Path
from statistics import mean
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
SURVEYS = json.loads((ROOT / "content" / "surveys.json").read_text(encoding="utf-8"))

Row = list[object]


# ----------------------------------------------------------------- penulis xlsx
def _col(i: int) -> str:
    s = ""
    i += 1
    while i:
        i, r = divmod(i - 1, 26)
        s = chr(65 + r) + s
    return s


def _cell(ref: str, v: object, style: int = 0) -> str:
    s = f' s="{style}"' if style else ""
    if v is None or v == "":
        return f'<c r="{ref}"{s}/>'
    if isinstance(v, bool):
        v = int(v)
    if isinstance(v, (int, float)):
        return f'<c r="{ref}"{s}><v>{v}</v></c>'
    text = escape(str(v)).replace("\n", "&#10;")
    return f'<c r="{ref}"{s} t="inlineStr"><is><t xml:space="preserve">{text}</t></is></c>'


def _sheet_xml(header: list[str], rows: list[Row]) -> str:
    widths = [len(h) for h in header]
    for r in rows:
        for i, v in enumerate(r):
            widths[i] = max(widths[i], min(len(str(v if v is not None else "")), 60))
    cols = "".join(f'<col min="{i + 1}" max="{i + 1}" width="{w + 3}" customWidth="1"/>' for i, w in enumerate(widths))
    body = ['<row r="1">' + "".join(_cell(f"{_col(i)}1", h, 1) for i, h in enumerate(header)) + "</row>"]
    for n, r in enumerate(rows, start=2):
        body.append(f'<row r="{n}">' + "".join(_cell(f"{_col(i)}{n}", v) for i, v in enumerate(r)) + "</row>")
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
        f"<cols>{cols}</cols><sheetData>{''.join(body)}</sheetData></worksheet>"
    )


def write_xlsx(path: Path, sheets: list[tuple[str, list[str], list[Row]]]) -> None:
    ns = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr(
            "[Content_Types].xml",
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            + "".join(
                f'<Override PartName="/xl/worksheets/sheet{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
                for i in range(1, len(sheets) + 1)
            )
            + "</Types>",
        )
        z.writestr(
            "_rels/.rels",
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            f'<Relationship Id="rId1" Type="{ns}/officeDocument" Target="xl/workbook.xml"/></Relationships>',
        )
        z.writestr(
            "xl/workbook.xml",
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            f'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="{ns}"><sheets>'
            + "".join(
                f'<sheet name="{escape(n)}" sheetId="{i}" r:id="rId{i}"/>' for i, (n, _, _) in enumerate(sheets, 1)
            )
            + "</sheets></workbook>",
        )
        z.writestr(
            "xl/_rels/workbook.xml.rels",
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            + "".join(
                f'<Relationship Id="rId{i}" Type="{ns}/worksheet" Target="worksheets/sheet{i}.xml"/>'
                for i in range(1, len(sheets) + 1)
            )
            + f'<Relationship Id="rId{len(sheets) + 1}" Type="{ns}/styles" Target="styles.xml"/></Relationships>',
        )
        z.writestr(
            "xl/styles.xml",
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'
            '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'
            '<fill><patternFill patternType="solid"><fgColor rgb="FFFFF7CC"/></patternFill></fill></fills>'
            '<borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs>'
            '<cellXfs count="2"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1"/></cellXfs>'
            "</styleSheet>",
        )
        for i, (_, header, rows) in enumerate(sheets, 1):
            z.writestr(f"xl/worksheets/sheet{i}.xml", _sheet_xml(header, rows))


# ----------------------------------------------------------------- olah data
def _avg(values: list[float]) -> float | None:
    return round(mean(values), 2) if values else None


def _time(ts: str | None) -> str:
    return (ts or "").replace("T", " ")[:19]


def build_sheets(conn: sqlite3.Connection) -> list[tuple[str, list[str], list[Row]]]:
    conn.row_factory = sqlite3.Row
    participants = conn.execute("SELECT * FROM participants ORDER BY first_seen").fetchall()
    events = conn.execute("SELECT * FROM events ORDER BY client_ts").fetchall()
    surveys = conn.execute("SELECT * FROM surveys ORDER BY client_ts").fetchall()

    # tes: ambil percobaan terakhir per siswa per jenis
    test_rows: list[Row] = []
    tests: dict[str, dict[str, tuple[int, int]]] = defaultdict(dict)
    for e in events:
        if e["type"] != "test_done":
            continue
        p = json.loads(e["payload"] or "{}")
        label = {"pre": "Tes Awal", "post": "Tes Akhir"}.get(e["item_id"], e["item_id"])
        test_rows.append([e["anon_id"], label, p.get("score"), p.get("total"), p.get("seconds"), _time(e["client_ts"])])
        tests[e["anon_id"]][e["item_id"]] = (p.get("score", 0), p.get("total", 0))

    cl_def, pr_def = SURVEYS["cl_questionnaire"], SURVEYS["practicality"]
    cl_ids = [it["id"] for it in cl_def["items"]]
    pr_ids = [it["id"] for it in pr_def["items"]]
    cl_rows: list[Row] = []
    pr_rows: list[Row] = []
    me_rows: list[Row] = []
    cl_by: dict[str, dict[str, float | None]] = {}
    pr_by: dict[str, float | None] = {}
    for s in surveys:
        ans = json.loads(s["answers"] or "{}")
        if s["kind"] == "cl_questionnaire":
            dims = {
                d: _avg([ans[it["id"]] for it in cl_def["items"] if it["dim"] == d and it["id"] in ans])
                for d in ("IL", "EL", "GL")
            }
            cl_by[s["anon_id"]] = dims
            cl_rows.append(
                [s["anon_id"], _time(s["client_ts"]), *[ans.get(i) for i in cl_ids], dims["IL"], dims["EL"], dims["GL"]]
            )
        elif s["kind"] == "practicality":
            avg = _avg([ans[i] for i in pr_ids if i in ans])
            pr_by[s["anon_id"]] = avg
            pr_rows.append([s["anon_id"], _time(s["client_ts"]), *[ans.get(i) for i in pr_ids], avg])
        elif s["kind"] == "mental_effort":
            me_rows.append([s["anon_id"], s["module_id"], ans.get("effort"), _time(s["client_ts"])])

    modules_done: dict[str, set[str]] = defaultdict(set)
    for e in events:
        if e["type"] == "module_done" and e["module_id"]:
            modules_done[e["anon_id"]].add(e["module_id"])

    summary: list[Row] = []
    for p in participants:
        a = p["anon_id"]
        pre, post = tests[a].get("pre"), tests[a].get("post")
        gain = None
        if pre and post and pre[1] - pre[0] > 0:
            gain = round((post[0] - pre[0]) / (pre[1] - pre[0]), 2)
        cl = cl_by.get(a, {})
        summary.append(
            [
                a,
                p["class_code"],
                _time(p["first_seen"]),
                pre[0] if pre else None,
                post[0] if post else None,
                gain,
                len(modules_done[a]),
                cl.get("IL"),
                cl.get("EL"),
                cl.get("GL"),
                pr_by.get(a),
            ]
        )

    activity = [
        [e["anon_id"], e["type"], e["module_id"], e["item_id"], e["payload"], _time(e["client_ts"])] for e in events
    ]
    people = [[p["anon_id"], p["class_code"], _time(p["first_seen"]), p["app_version"]] for p in participants]

    return [
        (
            "Ringkasan",
            [
                "ID anonim",
                "Kelompok",
                "Pertama masuk",
                "Tes Awal",
                "Tes Akhir",
                "N-gain",
                "Modul selesai",
                "Rata IL",
                "Rata EL",
                "Rata GL",
                "Rata kepraktisan",
            ],
            summary,
        ),
        ("Tes", ["ID anonim", "Jenis", "Skor", "Total", "Durasi (detik)", "Waktu"], test_rows),
        ("Beban Kognitif", ["ID anonim", "Waktu", *cl_ids, "Rata IL", "Rata EL", "Rata GL"], cl_rows),
        ("Kepraktisan", ["ID anonim", "Waktu", *pr_ids, "Rata-rata"], pr_rows),
        ("Usaha Mental", ["ID anonim", "Modul", "Skor (1-5)", "Waktu"], me_rows),
        ("Aktivitas", ["ID anonim", "Jenis", "Modul", "Item", "Detail", "Waktu"], activity),
        ("Peserta", ["ID anonim", "Kelompok", "Pertama masuk", "Versi aplikasi"], people),
    ]


def main() -> int:
    db = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data" / "app.db"
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "data" / "hasil-penelitian.xlsx"
    if not db.exists():
        print(f"Database tidak ditemukan: {db}")
        return 1
    with sqlite3.connect(db) as conn:
        sheets = build_sheets(conn)
    try:
        write_xlsx(out, sheets)
    except PermissionError:
        print(f"Tidak bisa menulis {out}. Tutup file itu di Excel dulu, lalu jalankan lagi.")
        return 1
    for name, _, rows in sheets:
        print(f"  {name:<15} {len(rows):>4} baris")
    print(f"[OK] {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
