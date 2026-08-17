"""Lógica de negocio de sesiones de entrenamiento."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import SessionBlock, TrainingSession, User
from app.schemas.training_session import (
    SessionBlockCreate,
    SessionBlockUpdate,
    TrainingSessionCreate,
    TrainingSessionUpdate,
)


def visible_owner(user: User) -> str | None:
    """Dueño por el que filtrar: el administrador lo ve todo, el resto lo suyo."""
    return None if user.is_admin else user.id


def can_access(session: TrainingSession, user: User) -> bool:
    return user.is_admin or session.owner_id == user.id


def list_sessions(
    db: Session, *, owner_id: str | None = None, limit: int = 50, offset: int = 0
) -> list[TrainingSession]:
    stmt = (
        select(TrainingSession)
        .order_by(TrainingSession.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    if owner_id is not None:
        stmt = stmt.where(TrainingSession.owner_id == owner_id)
    return list(db.scalars(stmt))


def get_session(db: Session, session_id: str) -> TrainingSession | None:
    return db.get(TrainingSession, session_id)


def create_session(db: Session, payload: TrainingSessionCreate, owner: User) -> TrainingSession:
    session = TrainingSession(owner_id=owner.id, **payload.model_dump())
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def update_session(
    db: Session, session: TrainingSession, payload: TrainingSessionUpdate
) -> TrainingSession:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(session, field, value)
    db.commit()
    db.refresh(session)
    return session


def delete_session(db: Session, session: TrainingSession) -> None:
    db.delete(session)
    db.commit()


def get_or_create_default_session(db: Session, user: User) -> TrainingSession:
    """Sesión de trabajo por defecto de cada usuario, para tener siempre dónde escribir."""
    stmt = (
        select(TrainingSession)
        .where(TrainingSession.owner_id == user.id)
        .order_by(TrainingSession.created_at.desc())
        .limit(1)
    )
    session = db.scalars(stmt).first()
    if session is not None:
        return session
    return create_session(db, TrainingSessionCreate(title="Sesión de entrenamiento"), user)


def _next_position(db: Session, session_id: str) -> int:
    stmt = select(func.max(SessionBlock.position)).where(SessionBlock.session_id == session_id)
    current_max = db.scalar(stmt)
    return 0 if current_max is None else current_max + 1


def add_block(db: Session, session: TrainingSession, payload: SessionBlockCreate) -> SessionBlock:
    block = SessionBlock(
        session_id=session.id,
        position=_next_position(db, session.id),
        **payload.model_dump(),
    )
    db.add(block)
    db.commit()
    db.refresh(block)
    return block


def get_block(db: Session, session_id: str, block_id: str) -> SessionBlock | None:
    block = db.get(SessionBlock, block_id)
    if block is None or block.session_id != session_id:
        return None
    return block


def update_block(db: Session, block: SessionBlock, payload: SessionBlockUpdate) -> SessionBlock:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(block, field, value)
    db.commit()
    db.refresh(block)
    return block


def delete_block(db: Session, block: SessionBlock) -> None:
    db.delete(block)
    db.commit()


def reorder_blocks(db: Session, session: TrainingSession, block_ids: list[str]) -> TrainingSession:
    """Reasigna posiciones según el orden recibido.

    Devuelve None-safe: los bloques no listados conservan su orden relativo al final.
    """
    by_id = {block.id: block for block in session.blocks}
    unknown = [block_id for block_id in block_ids if block_id not in by_id]
    if unknown:
        raise ValueError(f"Bloques inexistentes en esta sesión: {', '.join(unknown)}")

    position = 0
    for block_id in block_ids:
        by_id[block_id].position = position
        position += 1
    for block in session.blocks:
        if block.id not in set(block_ids):
            block.position = position
            position += 1

    db.commit()
    db.refresh(session)
    return session
