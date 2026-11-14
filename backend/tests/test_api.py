import pytest
from fastapi.testclient import TestClient

from backend.app import config


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "DATABASE_PATH", tmp_path / "test.db")
    monkeypatch.setattr(config, "ADMIN_TOKEN", "rahasia")
    from backend.app.main import app

    with TestClient(app) as c:
        yield c


ANON = "a1b2c3d4e5f60718"


def _event(cid: str, **kw):
    base = {"client_id": cid, "anon_id": ANON, "type": "answer", "client_ts": "2026-11-12T10:00:00Z"}
    return {**base, **kw}


def test_health(client):
    assert client.get("/api/health").json()["status"] == "ok"


def test_static_frontend_and_content(client):
    assert client.get("/").status_code == 200
    assert "Content-Security-Policy" in client.get("/").headers
    assert client.get("/content/manifest.json").json()["modules"][0]["id"] == "m1"
    assert client.get("/manifest.webmanifest").status_code == 200


def test_content_api(client):
    assert client.get("/api/content/manifest").status_code == 200
    assert client.get("/api/content/modules/m4").json()["id"] == "m4"
    assert client.get("/api/content/modules/zzz").status_code == 404
    assert "T-un" in client.get("/api/content/templates").json()


def test_events_are_deduplicated(client):
    batch = {"events": [_event("ev-00000001", payload={"correct": True}), _event("ev-00000002")]}
    assert client.post("/api/events", json=batch).json() == {"accepted": 2, "duplicates": 0}
    assert client.post("/api/events", json=batch).json() == {"accepted": 0, "duplicates": 2}


def test_rejects_invalid_event(client):
    bad = {"events": [_event("ev-00000003", type="hack")]}
    assert client.post("/api/events", json=bad).status_code == 422
    bad_id = {"events": [_event("ev-00000004", anon_id="Nama Siswa")]}
    assert client.post("/api/events", json=bad_id).status_code == 422


def test_participant_and_survey(client):
    r = client.post("/api/participants", json={"anon_id": ANON, "class_code": "8A", "app_version": "1.0.0"})
    assert r.json() == {"ok": True}
    survey = {
        "client_id": "sv-00000001",
        "anon_id": ANON,
        "kind": "mental_effort",
        "module_id": "m1",
        "answers": {"effort": 2},
        "client_ts": "2026-11-12T10:00:00Z",
    }
    assert client.post("/api/surveys", json=survey).json()["accepted"] == 1


def test_admin_export_requires_token(client):
    client.post("/api/events", json={"events": [_event("ev-00000009")]})
    assert client.get("/api/admin/export.csv").status_code == 401
    bad = client.get("/api/admin/export.csv", headers={"Authorization": "Bearer salah"})
    assert bad.status_code == 401
    ok = client.get("/api/admin/export.csv?table=events", headers={"Authorization": "Bearer rahasia"})
    assert ok.status_code == 200
    assert "ev-00000009" in ok.text
