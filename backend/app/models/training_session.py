"""Modelos de sesión de entrenamiento y sus bloques."""

from __future__ import annotations

from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.play import Play, new_id


class TrainingSession(TimestampMixin, Base):
    __tablename__ = "training_sessions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    # Cada entrenador tiene sus propias sesiones; el administrador las ve todas.
    owner_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    scheduled_for: Mapped[date | None] = mapped_column(Date, nullable=True)
    objective: Mapped[str] = mapped_column(String(2000), nullable=False, default="")

    blocks: Mapped[list[SessionBlock]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
        # El ON DELETE CASCADE lo aplica PostgreSQL en una sola sentencia.
        passive_deletes=True,
        order_by="SessionBlock.position",
        lazy="selectin",
    )

    @property
    def total_minutes(self) -> int:
        return sum(block.minutes for block in self.blocks)


class SessionBlock(TimestampMixin, Base):
    __tablename__ = "session_blocks"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    session_id: Mapped[str] = mapped_column(
        ForeignKey("training_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Si se borra la jugada asociada, el bloque sobrevive sin diagrama.
    play_id: Mapped[str | None] = mapped_column(
        ForeignKey("plays.id", ondelete="SET NULL"), nullable=True
    )

    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    title: Mapped[str] = mapped_column(String(120), nullable=False, default="Nuevo bloque")
    minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=15)
    notes: Mapped[str] = mapped_column(String(2000), nullable=False, default="")

    session: Mapped[TrainingSession] = relationship(back_populates="blocks")
    play: Mapped[Play | None] = relationship(back_populates="blocks", lazy="selectin")
