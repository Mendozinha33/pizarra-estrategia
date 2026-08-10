"""Sondas de salud para despliegue y monitorización."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db

router = APIRouter(tags=["salud"])


@router.get("/health", summary="Liveness")
def health() -> dict[str, str]:
    return {"status": "ok", "version": settings.version}


@router.get("/health/ready", summary="Readiness (comprueba la base de datos)")
def readiness(db: Annotated[Session, Depends(get_db)]) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {"status": "ready"}
