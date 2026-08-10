"""Esquemas del tablero táctico.

El tablero es el agregado que dibuja el entrenador. Se valida aquí para que la
base de datos nunca almacene un diagrama que el frontend no sepa pintar.
"""

from enum import StrEnum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

# Sistema de coordenadas del campo, en "unidades de pizarra".
PITCH_WIDTH = 1050
PITCH_HEIGHT = 680

# Margen tolerado fuera del campo (banquillos, saques de banda dibujados fuera).
_MARGIN = 200

Coordinate = Annotated[float, Field(ge=-_MARGIN, le=max(PITCH_WIDTH, PITCH_HEIGHT) + _MARGIN)]


class Team(StrEnum):
    HOME = "home"
    AWAY = "away"


class Surface(StrEnum):
    FULL = "full"
    HALF = "half"
    GRID = "grid"


class FormationSize(StrEnum):
    F11 = "f11"
    F7 = "f7"


class PlayCategory(StrEnum):
    ATAQUE = "Ataque"
    DEFENSA = "Defensa"
    ABP = "ABP"
    ENTRENAMIENTO = "Entrenamiento"


class ShapeType(StrEnum):
    RUN = "run"
    PASS = "pass"
    DRIBBLE = "dribble"
    FREE = "free"
    ZONE = "zone"
    TEXT = "text"


class ItemKind(StrEnum):
    CONE = "cone"
    BALL = "ball"


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Point(StrictModel):
    x: Coordinate
    y: Coordinate


class Player(StrictModel):
    id: str = Field(min_length=1, max_length=40)
    team: Team
    num: str = Field(default="", max_length=3)
    name: str = Field(default="", max_length=40)
    x: Coordinate
    y: Coordinate


class BoardItem(StrictModel):
    id: str = Field(min_length=1, max_length=40)
    kind: ItemKind
    x: Coordinate
    y: Coordinate


class Shape(StrictModel):
    id: str = Field(min_length=1, max_length=40)
    type: ShapeType
    color: str = Field(pattern=r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")
    points: list[Point] = Field(min_length=1, max_length=2000)
    text: str = Field(default="", max_length=80)


class Board(StrictModel):
    players: list[Player] = Field(default_factory=list, max_length=40)
    items: list[BoardItem] = Field(default_factory=list, max_length=200)
    shapes: list[Shape] = Field(default_factory=list, max_length=200)
    ball: Point = Field(default_factory=lambda: Point(x=PITCH_WIDTH / 2, y=PITCH_HEIGHT / 2))
