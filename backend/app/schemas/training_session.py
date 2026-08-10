"""Esquemas de sesiones de entrenamiento y bloques."""

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator

from app.schemas.play import PlayRead


class SessionBlockBase(BaseModel):
    title: str = Field(default="Nuevo bloque", min_length=1, max_length=120)
    minutes: int = Field(default=15, ge=1, le=240)
    notes: str = Field(default="", max_length=2000)
    play_id: str | None = None

    @field_validator("play_id")
    @classmethod
    def _empty_to_none(cls, value: str | None) -> str | None:
        # El <select> del frontend envía "" cuando el bloque no lleva diagrama.
        return value or None


class SessionBlockCreate(SessionBlockBase):
    pass


class SessionBlockUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    minutes: int | None = Field(default=None, ge=1, le=240)
    notes: str | None = Field(default=None, max_length=2000)
    play_id: str | None = None
    position: int | None = Field(default=None, ge=0)

    @field_validator("play_id")
    @classmethod
    def _empty_to_none(cls, value: str | None) -> str | None:
        return value or None


class SessionBlockRead(SessionBlockBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: str
    position: int
    play: PlayRead | None = None


class TrainingSessionBase(BaseModel):
    title: str = Field(default="Sesión de entrenamiento", min_length=1, max_length=120)
    scheduled_for: date | None = None
    objective: str = Field(default="", max_length=2000)


class TrainingSessionCreate(TrainingSessionBase):
    pass


class TrainingSessionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    scheduled_for: date | None = None
    objective: str | None = Field(default=None, max_length=2000)


class TrainingSessionRead(TrainingSessionBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    blocks: list[SessionBlockRead] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    @computed_field  # type: ignore[prop-decorator]
    @property
    def total_minutes(self) -> int:
        return sum(block.minutes for block in self.blocks)


class BlockReorder(BaseModel):
    """Nuevo orden completo de los bloques de una sesión."""

    block_ids: list[str] = Field(min_length=1)
