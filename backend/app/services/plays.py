"""Lógica de negocio de jugadas, aislada de FastAPI."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Play
from app.schemas.play import PlayCreate, PlayUpdate


def list_plays(
    db: Session,
    *,
    category: str | None = None,
    search: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[Play]:
    stmt = select(Play).order_by(Play.created_at.desc())
    if category:
        stmt = stmt.where(Play.category == category)
    if search:
        stmt = stmt.where(Play.name.ilike(f"%{search}%"))
    stmt = stmt.offset(offset).limit(limit)
    return list(db.scalars(stmt))


def get_play(db: Session, play_id: str) -> Play | None:
    return db.get(Play, play_id)


def create_play(db: Session, payload: PlayCreate) -> Play:
    play = Play(
        name=payload.name,
        category=payload.category.value,
        surface=payload.surface.value,
        formation_size=payload.formation_size.value,
        home_formation=payload.home_formation,
        away_formation=payload.away_formation,
        notes=payload.notes,
        board=payload.board.model_dump(mode="json"),
    )
    db.add(play)
    db.commit()
    db.refresh(play)
    return play


def update_play(db: Session, play: Play, payload: PlayUpdate) -> Play:
    data = payload.model_dump(exclude_unset=True)
    if "board" in data and payload.board is not None:
        data["board"] = payload.board.model_dump(mode="json")
    for field, value in data.items():
        setattr(play, field, value.value if hasattr(value, "value") else value)
    db.commit()
    db.refresh(play)
    return play


def delete_play(db: Session, play: Play) -> None:
    db.delete(play)
    db.commit()
