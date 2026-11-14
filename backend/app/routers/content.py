"""API konten (versi tervalidasi dari file di content/)."""

from fastapi import APIRouter, HTTPException

from ..services import content_loader as loader

router = APIRouter(prefix="/api/content", tags=["content"])


@router.get("/manifest")
def get_manifest() -> dict:
    return loader.manifest().model_dump()


@router.get("/modules/{module_id}")
def get_module(module_id: str) -> dict:
    try:
        return loader.module(module_id).model_dump(exclude_none=True)
    except KeyError:
        raise HTTPException(status_code=404, detail="Modul tidak ditemukan") from None


@router.get("/templates")
def get_templates() -> dict:
    return {tid: t.model_dump(exclude_none=True) for tid, t in loader.templates().items()}
