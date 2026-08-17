"""Lógica de negocio de jugadas, aislada de FastAPI."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Play, User
from app.schemas.play import PlayCreate, PlayFolder, PlayUpdate


def visible_owner(user: User) -> str | None:
    """Dueño por el que filtrar: el administrador lo ve todo, el resto lo suyo."""
    return None if user.is_admin else user.id


def can_access(play: Play, user: User) -> bool:
    return user.is_admin or play.owner_id == user.id


def list_plays(
    db: Session,
    *,
    owner_id: str | None = None,
    category: str | None = None,
    kind: str | None = None,
    folder: str | None = None,
    search: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[Play]:
    stmt = select(Play).order_by(Play.created_at.desc())
    if owner_id is not None:
        stmt = stmt.where(Play.owner_id == owner_id)
    if category:
        stmt = stmt.where(Play.category == category)
    if kind:
        stmt = stmt.where(Play.kind == kind)
    # La cadena vacía es un filtro válido: las jugadas sueltas, sin carpeta.
    if folder is not None:
        stmt = stmt.where(Play.folder == folder)
    if search:
        stmt = stmt.where(Play.name.ilike(f"%{search}%"))
    stmt = stmt.offset(offset).limit(limit)
    return list(db.scalars(stmt))


def list_folders(db: Session, *, owner_id: str | None = None) -> list[PlayFolder]:
    """Carpetas con jugadas dentro, para pintar el árbol de la biblioteca."""
    stmt = (
        select(Play.kind, Play.folder, func.count())
        .group_by(Play.kind, Play.folder)
        .order_by(Play.kind, Play.folder)
    )
    if owner_id is not None:
        stmt = stmt.where(Play.owner_id == owner_id)
    return [
        PlayFolder(kind=kind, folder=folder, count=count)
        for kind, folder, count in db.execute(stmt)
    ]


def get_play(db: Session, play_id: str) -> Play | None:
    return db.get(Play, play_id)


def create_play(db: Session, payload: PlayCreate, owner: User) -> Play:
    play = Play(
        owner_id=owner.id,
        name=payload.name,
        category=payload.category.value,
        surface=payload.surface.value,
        formation_size=payload.formation_size.value,
        home_formation=payload.home_formation,
        away_formation=payload.away_formation,
        notes=payload.notes,
        kind=payload.kind.value,
        folder=payload.folder,
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
