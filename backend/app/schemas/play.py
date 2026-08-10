"""Esquemas de entrada/salida de jugadas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.board import Board, FormationSize, PlayCategory, Surface

# Etiqueta de formación: dígitos separados por guiones, p. ej. 4-2-3-1.
FORMATION_PATTERN = r"^\d(-\d){1,4}$"


class PlayBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: PlayCategory = PlayCategory.ATAQUE
    surface: Surface = Surface.FULL
    formation_size: FormationSize = FormationSize.F11
    home_formation: str = Field(default="4-3-3", pattern=FORMATION_PATTERN)
    away_formation: str = Field(default="4-4-2", pattern=FORMATION_PATTERN)
    notes: str = Field(default="", max_length=2000)

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("El nombre de la jugada no puede estar vacío")
        return cleaned


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


class PlayRead(PlayBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    board: Board
    created_at: datetime
    updated_at: datetime
