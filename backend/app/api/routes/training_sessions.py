"""Endpoints REST de sesiones de entrenamiento y sus bloques."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, DbSession
from app.models import SessionBlock, TrainingSession, User
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


def _get_session_or_404(db: Session, session_id: str, user: User) -> TrainingSession:
    """La sesión de otro no existe para quien pregunta: mismo 404 que si no estuviera."""
    session = service.get_session(db, session_id)
    if session is None or not service.can_access(session, user):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")
    return session


def _get_block_or_404(db: Session, session_id: str, block_id: str, user: User) -> SessionBlock:
    _get_session_or_404(db, session_id, user)
    block = service.get_block(db, session_id, block_id)
    if block is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Bloque no encontrado")
    return block


def _check_play_exists(db: Session, play_id: str | None, user: User) -> None:
    """Sólo se puede montar la sesión con jugadas que uno pueda ver."""
    if not play_id:
        return
    play = plays_service.get_play(db, play_id)
    if play is None or not plays_service.can_access(play, user):
        raise HTTPException(HTTP_422, detail="La jugada asociada no existe")


@router.get("", response_model=list[TrainingSessionRead], summary="Listar sesiones")
def list_sessions(
    db: DbSession,
    user: CurrentUser,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[TrainingSession]:
    return service.list_sessions(
        db, owner_id=service.visible_owner(user), limit=limit, offset=offset
    )


@router.post(
    "",
    response_model=TrainingSessionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear sesión",
)
def create_session(
    payload: TrainingSessionCreate, db: DbSession, user: CurrentUser
) -> TrainingSession:
    return service.create_session(db, payload, user)


@router.get(
    "/current",
    response_model=TrainingSessionRead,
    summary="Sesión activa (crea una si no existe)",
)
def current_session(db: DbSession, user: CurrentUser) -> TrainingSession:
    return service.get_or_create_default_session(db, user)


@router.get("/{session_id}", response_model=TrainingSessionRead, summary="Obtener sesión")
def get_session(session_id: str, db: DbSession, user: CurrentUser) -> TrainingSession:
    return _get_session_or_404(db, session_id, user)


@router.patch("/{session_id}", response_model=TrainingSessionRead, summary="Actualizar sesión")
def update_session(
    session_id: str, payload: TrainingSessionUpdate, db: DbSession, user: CurrentUser
) -> TrainingSession:
    return service.update_session(db, _get_session_or_404(db, session_id, user), payload)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar sesión")
def delete_session(session_id: str, db: DbSession, user: CurrentUser) -> None:
    service.delete_session(db, _get_session_or_404(db, session_id, user))


@router.post(
    "/{session_id}/blocks",
    response_model=SessionBlockRead,
    status_code=status.HTTP_201_CREATED,
    summary="Añadir bloque",
)
def add_block(
    session_id: str, payload: SessionBlockCreate, db: DbSession, user: CurrentUser
) -> SessionBlock:
    session = _get_session_or_404(db, session_id, user)
    _check_play_exists(db, payload.play_id, user)
    return service.add_block(db, session, payload)


@router.patch(
    "/{session_id}/blocks/{block_id}",
    response_model=SessionBlockRead,
    summary="Actualizar bloque",
)
def update_block(
    session_id: str,
    block_id: str,
    payload: SessionBlockUpdate,
    db: DbSession,
    user: CurrentUser,
) -> SessionBlock:
    block = _get_block_or_404(db, session_id, block_id, user)
    if "play_id" in payload.model_fields_set:
        _check_play_exists(db, payload.play_id, user)
    return service.update_block(db, block, payload)


@router.delete(
    "/{session_id}/blocks/{block_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar bloque",
)
def delete_block(session_id: str, block_id: str, db: DbSession, user: CurrentUser) -> None:
    service.delete_block(db, _get_block_or_404(db, session_id, block_id, user))


@router.put(
    "/{session_id}/blocks/order",
    response_model=TrainingSessionRead,
    summary="Reordenar bloques",
)
def reorder_blocks(
    session_id: str, payload: BlockReorder, db: DbSession, user: CurrentUser
) -> TrainingSession:
    session = _get_session_or_404(db, session_id, user)
    try:
        return service.reorder_blocks(db, session, payload.block_ids)
    except ValueError as exc:
        raise HTTPException(HTTP_422, detail=str(exc)) from exc
