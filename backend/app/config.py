"""Konfigurasi dari environment variable."""

import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
CONTENT_DIR = ROOT_DIR / "content"
FRONTEND_DIR = ROOT_DIR / "frontend"

APP_VERSION = "1.1.0"
DATABASE_PATH = Path(os.environ.get("DATABASE_PATH", ROOT_DIR / "data" / "app.db"))
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "")
# Batas permintaan POST per IP per menit (perlindungan sederhana).
RATE_LIMIT_PER_MIN = int(os.environ.get("RATE_LIMIT_PER_MIN", "120"))
