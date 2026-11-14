"""Titik masuk FastAPI: API + file statis frontend dan konten."""

from __future__ import annotations

import mimetypes
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles

from . import config
from .db import init_db
from .routers import admin, content, events

mimetypes.add_type("application/manifest+json", ".webmanifest")
mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("text/javascript", ".js")

CSP = (
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; "
    "script-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'; "
    "base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    init_db()
    yield


app = FastAPI(title="Metika", version=config.APP_VERSION, lifespan=lifespan)


@app.middleware("http")
async def security_headers(request: Request, call_next):  # type: ignore[no-untyped-def]
    response = await call_next(request)
    response.headers.setdefault("Content-Security-Policy", CSP)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    path = request.url.path
    if path.endswith(("sw.js", ".webmanifest", "index.html")) or path == "/":
        # Service worker dan manifest harus selalu segar agar pembaruan cepat sampai.
        response.headers["Cache-Control"] = "no-cache"
    return response


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "version": config.APP_VERSION}


app.include_router(content.router)
app.include_router(events.router)
app.include_router(admin.router)

app.mount("/content", StaticFiles(directory=config.CONTENT_DIR), name="content")
app.mount("/", StaticFiles(directory=config.FRONTEND_DIR, html=True), name="frontend")
