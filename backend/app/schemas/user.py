"""Esquemas de entrada/salida de usuarios y acceso."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, field_validator

# Validación de correo con expresión regular para no añadir dependencias nuevas
# al despliegue (`EmailStr` exige el paquete `email-validator`).
EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$"

PASSWORD_MIN = 8
PASSWORD_MAX = 128


class UserRole(StrEnum):
    ADMIN = "admin"
    COACH = "entrenador"


def _clean_name(value: str) -> str:
    return " ".join(value.split())


class UserCreate(BaseModel):
    email: str = Field(max_length=180, pattern=EMAIL_PATTERN)
    name: str = Field(default="", max_length=120)
    role: UserRole = UserRole.COACH
    password: str = Field(min_length=PASSWORD_MIN, max_length=PASSWORD_MAX)

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str) -> str:
        return _clean_name(value)


class UserUpdate(BaseModel):
    """Actualización parcial: sólo se aplican los campos enviados."""

    email: str | None = Field(default=None, max_length=180, pattern=EMAIL_PATTERN)
    name: str | None = Field(default=None, max_length=120)
    role: UserRole | None = None
    blocked: bool | None = None

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str | None) -> str | None:
        return None if value is None else _clean_name(value)


class PasswordReset(BaseModel):
    """Contraseña nueva puesta por el administrador."""

    new_password: str = Field(min_length=PASSWORD_MIN, max_length=PASSWORD_MAX)


class PasswordChange(BaseModel):
    """Cambio de la propia contraseña: hay que saber la actual."""

    current_password: str = Field(min_length=1, max_length=PASSWORD_MAX)
    new_password: str = Field(min_length=PASSWORD_MIN, max_length=PASSWORD_MAX)


class LoginRequest(BaseModel):
    email: str = Field(max_length=180)
    password: str = Field(min_length=1, max_length=PASSWORD_MAX)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: str
    role: UserRole
    blocked: bool
    must_change_password: bool
    created_at: datetime
    updated_at: datetime


class LoginResponse(BaseModel):
    token: str
    user: UserRead
