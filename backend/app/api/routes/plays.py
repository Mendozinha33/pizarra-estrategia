"""Endpoints REST de jugadas."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, DbSession
from app.models import Play, User
from app.schemas.board import PlayCategory
from app.schemas.play import PlayCreate, PlayFolder, PlayKind, PlayRead, PlayUpdate
from app.services import plays as service

router = APIRouter(prefix="/plays", tags=["jugadas"])


def _get_or_404(db: Session, play_id: str, user: User) -> Play:
    """Una jugada de otro no existe para quien pregunta: mismo 404 que si no estuviera."""
    play = service.get_play(db, play_id)
    if play is None or not service.can_access(play, user):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Jugada no encontrada")
    return play


@router.get("", response_model=list[PlayRead], summary="Listar jugadas")
def list_plays(
    db: DbSession,
    user: CurrentUser,
    category: PlayCategory | None = None,
    kind: PlayKind | None = None,
    folder: Annotated[str | None, Query(max_length=60)] = None,
    search: Annotated[str | None, Query(max_length=120)] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[Play]:
    return service.list_plays(
        db,
        owner_id=service.visible_owner(user),
        category=category.value if category else None,
        kind=kind.value if kind else None,
        folder=folder,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.post(
    "", response_model=PlayRead, status_code=status.HTTP_201_CREATED, summary="Crear jugada"
)
def create_play(payload: PlayCreate, db: DbSession, user: CurrentUser) -> Play:
    return service.create_play(db, payload, user)


@router.get("/folders", response_model=list[PlayFolder], summary="Carpetas con jugadas")
def list_folders(db: DbSession, user: CurrentUser) -> list[PlayFolder]:
    return service.list_folders(db, owner_id=service.visible_owner(user))


@router.get("/{play_id}", response_model=PlayRead, summary="Obtener una jugada")
def get_play(play_id: str, db: DbSession, user: CurrentUser) -> Play:
    return _get_or_404(db, play_id, user)


@router.patch("/{play_id}", response_model=PlayRead, summary="Actualizar una jugada")
def update_play(play_id: str, payload: PlayUpdate, db: DbSession, user: CurrentUser) -> Play:
    return service.update_play(db, _get_or_404(db, play_id, user), payload)


@router.delete("/{play_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar una jugada")
def delete_play(play_id: str, db: DbSession, user: CurrentUser) -> None:
    service.delete_play(db, _get_or_404(db, play_id, user))
