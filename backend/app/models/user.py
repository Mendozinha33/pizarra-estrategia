"""Modelo de usuario: quién puede entrar en la aplicación."""

from __future__ import annotations

import uuid

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin

ROLE_ADMIN = "admin"
ROLE_COACH = "entrenador"


def new_id() -> str:
    return uuid.uuid4().hex


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    # El correo se guarda siempre en minúsculas para que no haya duplicados.
    email: Mapped[str] = mapped_column(String(180), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    role: Mapped[str] = mapped_column(String(20), nullable=False, default=ROLE_COACH)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    blocked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # Se marca al dar de alta o al restablecer la contraseña: la app pide cambiarla.
    must_change_password: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # Sube al cambiar la contraseña o al bloquear: invalida las sesiones abiertas.
    token_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    @property
    def is_admin(self) -> bool:
        return self.role == ROLE_ADMIN
