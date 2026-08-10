"""Endpoints REST de sesiones de entrenamiento y sus bloques."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import SessionBlock, TrainingSession
from app.schemas.training_session import (
    BlockReorder,
    SessionBlockCreate,
    SessionBlockRead,
    SessionBlockUpdate,
    TrainingSessionCreate,
    TrainingSessionRead,
    TrainingSessionUpdate,
)
from app.services import plays as plays_service
from app.services import training_sessions as service

router = APIRouter(prefix="/sessions", tags=["sesiones"])

# Literal en vez de la constante de Starlette: su nombre cambió entre versiones.
HTTP_422 = 422

DbSession = Annotated[Session, Depends(get_db)]


def _get_session_or_404(db: Session, session_id: str) -> TrainingSession:
    session = service.get_session(db, session_id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")
    return session


def _get_block_or_404(db: Session, session_id: str, block_id: str) -> SessionBlock:
    block = service.get_block(db, session_id, block_id)
    if block is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Bloque no encontrado")
    return block


def _check_play_exists(db: Session, play_id: str | None) -> None:
    if play_id and plays_service.get_play(db, play_id) is None:
        raise HTTPException(HTTP_422, detail="La jugada asociada no existe")


@router.get("", response_model=list[TrainingSessionRead], summary="Listar sesiones")
def list_sessions(
    db: DbSession,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[TrainingSession]:
    return service.list_sessions(db, limit=limit, offset=offset)


@router.post(
    "",
    response_model=TrainingSessionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear sesión",
)
def create_session(payload: TrainingSessionCreate, db: DbSession) -> TrainingSession:
    return service.create_session(db, payload)


@router.get(
    "/current",
    response_model=TrainingSessionRead,
    summary="Sesión activa (crea una si no existe)",
)
def current_session(db: DbSession) -> TrainingSession:
    return service.get_or_create_default_session(db)


@router.get("/{session_id}", response_model=TrainingSessionRead, summary="Obtener sesión")
def get_session(session_id: str, db: DbSession) -> TrainingSession:
    return _get_session_or_404(db, session_id)


@router.patch("/{session_id}", response_model=TrainingSessionRead, summary="Actualizar sesión")
def update_session(
    session_id: str, payload: TrainingSessionUpdate, db: DbSession
) -> TrainingSession:
    return service.update_session(db, _get_session_or_404(db, session_id), payload)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar sesión")
def delete_session(session_id: str, db: DbSession) -> None:
    service.delete_session(db, _get_session_or_404(db, session_id))


@router.post(
    "/{session_id}/blocks",
    response_model=SessionBlockRead,
    status_code=status.HTTP_201_CREATED,
    summary="Añadir bloque",
)
def add_block(session_id: str, payload: SessionBlockCreate, db: DbSession) -> SessionBlock:
    session = _get_session_or_404(db, session_id)
    _check_play_exists(db, payload.play_id)
    return service.add_block(db, session, payload)


@router.patch(
    "/{session_id}/blocks/{block_id}",
    response_model=SessionBlockRead,
    summary="Actualizar bloque",
)
def update_block(
    session_id: str, block_id: str, payload: SessionBlockUpdate, db: DbSession
) -> SessionBlock:
    block = _get_block_or_404(db, session_id, block_id)
    if "play_id" in payload.model_fields_set:
        _check_play_exists(db, payload.play_id)
    return service.update_block(db, block, payload)


@router.delete(
    "/{session_id}/blocks/{block_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar bloque",
)
def delete_block(session_id: str, block_id: str, db: DbSession) -> None:
    service.delete_block(db, _get_block_or_404(db, session_id, block_id))


@router.put(
    "/{session_id}/blocks/order",
    response_model=TrainingSessionRead,
    summary="Reordenar bloques",
)
def reorder_blocks(session_id: str, payload: BlockReorder, db: DbSession) -> TrainingSession:
    session = _get_session_or_404(db, session_id)
    try:
        return service.reorder_blocks(db, session, payload.block_ids)
    except ValueError as exc:
        raise HTTPException(HTTP_422, detail=str(exc)) from exc
