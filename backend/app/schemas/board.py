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
    SMALL_GOAL = "small_goal"
    BIG_GOAL = "big_goal"
    LADDER = "ladder"


class PlayerRole(StrEnum):
    FIELD = "field"
    GK = "gk"


# Colores por defecto de las fichas; deben coincidir con `TEAM_COLORS` del frontend.
DEFAULT_COLORS = {
    "home": {"player": "#F4F7F3", "gk": "#FFD447"},
    "away": {"player": "#D6274B", "gk": "#2B6CF6"},
}

HEX_COLOR = r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$"


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
    # Sin valor en las jugadas antiguas: entonces el frontend toma el dorsal 1
    # como portero.
    role: PlayerRole | None = None


class BoardItem(StrictModel):
    id: str = Field(min_length=1, max_length=40)
    kind: ItemKind
    x: Coordinate
    y: Coordinate


class Shape(StrictModel):
    id: str = Field(min_length=1, max_length=40)
    type: ShapeType
    color: str = Field(pattern=HEX_COLOR)
    points: list[Point] = Field(min_length=1, max_length=2000)
    text: str = Field(default="", max_length=80)


class TeamColors(StrictModel):
    """Color de las fichas de un equipo: jugadores de campo y portero."""

    player: str = Field(pattern=HEX_COLOR)
    gk: str = Field(pattern=HEX_COLOR)


class BoardColors(StrictModel):
    home: TeamColors = Field(default_factory=lambda: TeamColors(**DEFAULT_COLORS["home"]))
    away: TeamColors = Field(default_factory=lambda: TeamColors(**DEFAULT_COLORS["away"]))


class Board(StrictModel):
    # Hasta 33 fichas por equipo (30 jugadores + 3 porteros), más margen.
    players: list[Player] = Field(default_factory=list, max_length=80)
    items: list[BoardItem] = Field(default_factory=list, max_length=200)
    shapes: list[Shape] = Field(default_factory=list, max_length=200)
    # Nulo cuando la jugada empieza sin balón. Si no viene el campo (jugadas
    # antiguas o creadas a mano), se coloca en el centro como siempre.
    ball: Point | None = Field(
        default_factory=lambda: Point(x=PITCH_WIDTH / 2, y=PITCH_HEIGHT / 2)
    )
    # Ausente en las jugadas guardadas antes de poder elegir color: se rellena
    # con los colores por defecto al leerlas.
    colors: BoardColors = Field(default_factory=BoardColors)
