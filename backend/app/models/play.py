"""Modelo de jugada: un diagrama táctico guardado."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:  # pragma: no cover
    from app.models.training_session import SessionBlock
    from app.models.user import User

# Carpetas fijas de primer nivel; dentro de cada una, las que crea el usuario.
KIND_PARTIDO = "partido"
KIND_ENTRENAMIENTO = "entrenamiento"


def new_id() -> str:
    return uuid.uuid4().hex


class Play(TimestampMixin, Base):
    __tablename__ = "plays"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    # Quién la creó: cada entrenador ve sólo las suyas, el administrador todas.
    # Nulo sólo en jugadas huérfanas (el dueño se borró); las ve el administrador.
    owner_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    surface: Mapped[str] = mapped_column(String(16), nullable=False)
    formation_size: Mapped[str] = mapped_column(String(8), nullable=False, default="f11")
    # Preset de formación aplicado a cada equipo; sólo es una etiqueta, las
    # posiciones reales viven en `board`.
    home_formation: Mapped[str] = mapped_column(String(16), nullable=False, default="4-3-3")
    away_formation: Mapped[str] = mapped_column(String(16), nullable=False, default="4-4-2")
    notes: Mapped[str] = mapped_column(String(2000), nullable=False, default="")

    # Carpeta fija (partido / entrenamiento) y carpeta libre dentro de ella.
    kind: Mapped[str] = mapped_column(
        String(16), nullable=False, default=KIND_ENTRENAMIENTO, index=True
    )
    folder: Mapped[str] = mapped_column(String(60), nullable=False, default="", index=True)

    # El estado del tablero (jugadores, trazos, elementos, balón) se guarda como
    # documento JSONB: es un agregado que siempre se lee y escribe entero, y
    # JSONB permite indexarlo si algún día hace falta consultar por dentro.
    board: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)

    # passive_deletes: al borrar la jugada, el ON DELETE SET NULL lo aplica
    # PostgreSQL; el ORM no necesita cargar los bloques para anular la FK.
    owner: Mapped[User | None] = relationship(lazy="selectin")

    blocks: Mapped[list[SessionBlock]] = relationship(back_populates="play", passive_deletes=True)

    @property
    def owner_name(self) -> str:
        """Nombre para mostrar del dueño; el administrador ve de quién es cada jugada."""
        if self.owner is None:
            return ""
        return self.owner.name or self.owner.email
