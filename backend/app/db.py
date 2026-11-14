"""Koneksi SQLite untuk data penelitian (anonim)."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

from . import config

SCHEMA = """
CREATE TABLE IF NOT EXISTS participants (
  anon_id     TEXT PRIMARY KEY,
  class_code  TEXT NOT NULL,
  first_seen  TEXT NOT NULL,
  app_version TEXT
);
CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id   TEXT UNIQUE NOT NULL,
  anon_id     TEXT NOT NULL,
  type        TEXT NOT NULL,
  module_id   TEXT,
  item_id     TEXT,
  payload     TEXT,
  client_ts   TEXT NOT NULL,
  server_ts   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_anon ON events(anon_id);
CREATE TABLE IF NOT EXISTS surveys (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id   TEXT UNIQUE NOT NULL,
  anon_id     TEXT NOT NULL,
  kind        TEXT NOT NULL,
  module_id   TEXT,
  answers     TEXT NOT NULL,
  client_ts   TEXT NOT NULL,
  server_ts   TEXT NOT NULL
);
"""

TABLES = ("participants", "events", "surveys")


def db_path() -> Path:
    return config.DATABASE_PATH


def init_db() -> None:
    path = db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as conn:
        conn.executescript(SCHEMA)


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    conn = sqlite3.connect(db_path())
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
