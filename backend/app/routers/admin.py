"""Ekspor data penelitian ke CSV (dilindungi ADMIN_TOKEN)."""

from __future__ import annotations

import csv
import io
import secrets
from typing import Literal

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import Response

from .. import config
from ..db import connect

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _authorize(authorization: str | None) -> None:
    if not config.ADMIN_TOKEN:
        raise HTTPException(status_code=503, detail="Ekspor dinonaktifkan: ADMIN_TOKEN belum diatur")
    expected = f"Bearer {config.ADMIN_TOKEN}"
    if not authorization or not secrets.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="Token salah")


@router.get("/export.csv")
def export_csv(
    table: Literal["participants", "events", "surveys"] = "events",
    authorization: str | None = Header(default=None),
) -> Response:
    _authorize(authorization)
    with connect() as conn:
        rows = conn.execute(f"SELECT * FROM {table} ORDER BY rowid").fetchall()  # noqa: S608 - nama tabel dari Literal
        columns = [d[0] for d in conn.execute(f"SELECT * FROM {table} LIMIT 0").description]  # noqa: S608
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(columns)
    writer.writerows([tuple(r) for r in rows])
    return Response(
        content=buf.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{table}.csv"'},
    )
