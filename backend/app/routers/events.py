"""Penerimaan data penelitian anonim: peserta, event, survei."""

from __future__ import annotations

import json
import sqlite3
import time
from collections import defaultdict, deque
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Request

from .. import config
from ..db import connect
from ..schemas import EventBatch, Participant, Survey

router = APIRouter(prefix="/api", tags=["research"])

_hits: dict[str, deque[float]] = defaultdict(deque)


def _rate_limit(request: Request) -> None:
    ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    window = _hits[ip]
    while window and now - window[0] > 60:
        window.popleft()
    if len(window) >= config.RATE_LIMIT_PER_MIN:
        raise HTTPException(status_code=429, detail="Terlalu banyak permintaan")
    window.append(now)


def _now() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


def _ensure_participant(conn: sqlite3.Connection, anon_id: str, class_code: str = "?") -> None:
    conn.execute(
        "INSERT OR IGNORE INTO participants(anon_id, class_code, first_seen) VALUES (?, ?, ?)",
        (anon_id, class_code, _now()),
    )


@router.post("/participants")
def register(p: Participant, request: Request) -> dict:
    _rate_limit(request)
    with connect() as conn:
        conn.execute(
            """INSERT INTO participants(anon_id, class_code, first_seen, app_version) VALUES (?, ?, ?, ?)
               ON CONFLICT(anon_id) DO UPDATE SET class_code = excluded.class_code,
                                                  app_version = excluded.app_version""",
            (p.anon_id, p.class_code, _now(), p.app_version),
        )
    return {"ok": True}


@router.post("/events")
def post_events(batch: EventBatch, request: Request) -> dict:
    _rate_limit(request)
    accepted = duplicates = 0
    now = _now()
    with connect() as conn:
        for ev in batch.events:
            _ensure_participant(conn, ev.anon_id)
            payload = json.dumps(ev.payload, ensure_ascii=False)
            if len(payload) > 4000:
                payload = json.dumps({"truncated": True})
            cur = conn.execute(
                """INSERT OR IGNORE INTO events
                   (client_id, anon_id, type, module_id, item_id, payload, client_ts, server_ts)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (ev.client_id, ev.anon_id, ev.type, ev.module_id, ev.item_id, payload, ev.client_ts, now),
            )
            if cur.rowcount:
                accepted += 1
            else:
                duplicates += 1
    return {"accepted": accepted, "duplicates": duplicates}


@router.post("/surveys")
def post_survey(s: Survey, request: Request) -> dict:
    _rate_limit(request)
    with connect() as conn:
        _ensure_participant(conn, s.anon_id)
        cur = conn.execute(
            """INSERT OR IGNORE INTO surveys
               (client_id, anon_id, kind, module_id, answers, client_ts, server_ts)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (s.client_id, s.anon_id, s.kind, s.module_id, json.dumps(s.answers), s.client_ts, _now()),
        )
    return {"accepted": cur.rowcount, "duplicates": 1 - cur.rowcount}
