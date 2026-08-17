"""Esquemas de entrada/salida de jugadas."""

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.board import Board, FormationSize, PlayCategory, Surface

# Etiqueta de formación: dígitos separados por guiones, p. ej. 4-2-3-1.
FORMATION_PATTERN = r"^\d(-\d){1,4}$"

FOLDER_MAX = 60


class PlayKind(StrEnum):
    """Carpeta fija de primer nivel."""

    PARTIDO = "partido"
    ENTRENAMIENTO = "entrenamiento"


def _clean_folder(value: str) -> str:
    """Nombre de carpeta sin espacios de más. Vacío significa 'sin carpeta'."""
    return " ".join(value.split())


class PlayBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: PlayCategory = PlayCategory.ATAQUE
    surface: Surface = Surface.FULL
    formation_size: FormationSize = FormationSize.F11
    home_formation: str = Field(default="4-3-3", pattern=FORMATION_PATTERN)
    away_formation: str = Field(default="4-4-2", pattern=FORMATION_PATTERN)
    notes: str = Field(default="", max_length=2000)
    kind: PlayKind = PlayKind.ENTRENAMIENTO
    folder: str = Field(default="", max_length=FOLDER_MAX)

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("El nombre de la jugada no puede estar vacío")
        return cleaned

    @field_validator("folder")
    @classmethod
    def _strip_folder(cls, value: str) -> str:
        return _clean_folder(value)


class PlayCreate(PlayBase):
    board: Board


class PlayUpdate(BaseModel):
    """Actualización parcial: sólo se aplican los campos enviados."""

    name: str | None = Field(default=None, min_length=1, max_length=120)
    category: PlayCategory | None = None
    surface: Surface | None = None
    formation_size: FormationSize | None = None
    home_formation: str | None = Field(default=None, pattern=FORMATION_PATTERN)
    away_formation: str | None = Field(default=None, pattern=FORMATION_PATTERN)
    notes: str | None = Field(default=None, max_length=2000)
    kind: PlayKind | None = None
    folder: str | None = Field(default=None, max_length=FOLDER_MAX)
    board: Board | None = None

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("El nombre de la jugada no puede estar vacío")
        return cleaned

    @field_validator("folder")
    @classmethod
    def _strip_folder(cls, value: str | None) -> str | None:
        return None if value is None else _clean_folder(value)


class PlayRead(PlayBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    board: Board
    owner_id: str | None = None
    # Para que el administrador vea de quién es cada jugada.
    owner_name: str = ""
    created_at: datetime
    updated_at: datetime


class PlayFolder(BaseModel):
    """Una carpeta del usuario y cuántas jugadas tiene dentro."""

    kind: PlayKind
    folder: str
    count: int
