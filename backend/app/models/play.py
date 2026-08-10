"""Modelo de jugada: un diagrama táctico guardado."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:  # pragma: no cover
    from app.models.training_session import SessionBlock


def new_id() -> str:
    return uuid.uuid4().hex


class Play(TimestampMixin, Base):
    __tablename__ = "plays"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    surface: Mapped[str] = mapped_column(String(16), nullable=False)
    formation_size: Mapped[str] = mapped_column(String(8), nullable=False, default="f11")
    # Preset de formación aplicado a cada equipo; sólo es una etiqueta, las
    # posiciones reales viven en `board`.
    home_formation: Mapped[str] = mapped_column(String(16), nullable=False, default="4-3-3")
    away_formation: Mapped[str] = mapped_column(String(16), nullable=False, default="4-4-2")
    notes: Mapped[str] = mapped_column(String(2000), nullable=False, default="")

    # El estado del tablero (jugadores, trazos, elementos, balón) se guarda como
    # documento JSONB: es un agregado que siempre se lee y escribe entero, y
    # JSONB permite indexarlo si algún día hace falta consultar por dentro.
    board: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)

    # passive_deletes: al borrar la jugada, el ON DELETE SET NULL lo aplica
    # PostgreSQL; el ORM no necesita cargar los bloques para anular la FK.
    blocks: Mapped[list[SessionBlock]] = relationship(back_populates="play", passive_deletes=True)
