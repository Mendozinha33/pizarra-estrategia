"""Endpoints REST de jugadas."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Play
from app.schemas.board import PlayCategory
from app.schemas.play import PlayCreate, PlayRead, PlayUpdate
from app.services import plays as service

router = APIRouter(prefix="/plays", tags=["jugadas"])

DbSession = Annotated[Session, Depends(get_db)]


def _get_or_404(db: Session, play_id: str) -> Play:
    play = service.get_play(db, play_id)
    if play is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Jugada no encontrada")
    return play


@router.get("", response_model=list[PlayRead], summary="Listar jugadas")
def list_plays(
    db: DbSession,
    category: PlayCategory | None = None,
    search: Annotated[str | None, Query(max_length=120)] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[Play]:
    return service.list_plays(
        db,
        category=category.value if category else None,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.post(
    "", response_model=PlayRead, status_code=status.HTTP_201_CREATED, summary="Crear jugada"
)
def create_play(payload: PlayCreate, db: DbSession) -> Play:
    return service.create_play(db, payload)


@router.get("/{play_id}", response_model=PlayRead, summary="Obtener una jugada")
def get_play(play_id: str, db: DbSession) -> Play:
    return _get_or_404(db, play_id)


@router.patch("/{play_id}", response_model=PlayRead, summary="Actualizar una jugada")
def update_play(play_id: str, payload: PlayUpdate, db: DbSession) -> Play:
    return service.update_play(db, _get_or_404(db, play_id), payload)


@router.delete("/{play_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar una jugada")
def delete_play(play_id: str, db: DbSession) -> None:
    service.delete_play(db, _get_or_404(db, play_id))
