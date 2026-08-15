"""Fixtures de test.

Los tests corren contra PostgreSQL de verdad, no contra un motor distinto: así se
prueban de verdad JSONB, los `ON DELETE` y los tipos de columna que usa producción.

Arranca la base con:  docker compose -f docker-compose.dev.yml up -d
"""

import os
from collections.abc import Iterator

TEST_DATABASE_URL = os.environ.get(
    "PIZARRA_TEST_DATABASE_URL",
    "postgresql+psycopg://pizarra:pizarra@localhost:5432/pizarra_test",
)
# La app importada por los tests apunta a la BD de test; las rutas usan la sesión
# inyectada por el override de `get_db`, pero el arranque no debe tocar la de dev.
os.environ["PIZARRA_DATABASE_URL"] = TEST_DATABASE_URL

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402
from sqlalchemy.exc import OperationalError  # noqa: E402
from sqlalchemy.orm import Session, sessionmaker  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.main import app  # noqa: E402

# `app_settings` no se vacía: guarda la clave de firma de las sesiones.
TABLES = "session_blocks, training_sessions, plays, users"

ADMIN_EMAIL = "admin@aravacacf.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="session")
def engine():
    engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except OperationalError as exc:  # pragma: no cover - depende del entorno
        pytest.exit(
            "No se puede conectar a PostgreSQL en "
            f"{TEST_DATABASE_URL.rsplit('@', 1)[-1]}.\n"
            "Arráncalo con: docker compose -f docker-compose.dev.yml up -d\n"
            f"Detalle: {exc.orig}",
            returncode=1,
        )

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture
def db_session(engine) -> Iterator[Session]:
    """Sesión por test; al terminar vacía las tablas para dejarlo todo limpio."""
    factory = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = factory()
    try:
        yield session
    finally:
        session.close()
        with engine.begin() as connection:
            connection.execute(text(f"TRUNCATE TABLE {TABLES} RESTART IDENTITY CASCADE"))


@pytest.fixture
def anon_client(db_session: Session) -> Iterator[TestClient]:
    """Cliente sin sesión iniciada. Al arrancar se crea el administrador inicial."""
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def login(test_client: TestClient, email: str, password: str) -> str:
    response = test_client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return response.json()["token"]


@pytest.fixture
def client(anon_client: TestClient) -> TestClient:
    """Cliente ya autenticado como administrador: lo que usa casi todo el resto."""
    token = login(anon_client, ADMIN_EMAIL, ADMIN_PASSWORD)
    anon_client.headers["Authorization"] = f"Bearer {token}"
    return anon_client


@pytest.fixture
def board() -> dict:
    return {
        "players": [
            {"id": "p1", "team": "home", "num": "9", "name": "Nueve", "x": 525.0, "y": 340.0},
            {"id": "p2", "team": "away", "num": "4", "name": "", "x": 700.0, "y": 300.0},
        ],
        "items": [{"id": "i1", "kind": "cone", "x": 200.0, "y": 200.0}],
        "shapes": [
            {
                "id": "s1",
                "type": "pass",
                "color": "#FFD447",
                "points": [{"x": 525.0, "y": 340.0}, {"x": 700.0, "y": 300.0}],
                "text": "",
            }
        ],
        "ball": {"x": 525.0, "y": 340.0},
    }


@pytest.fixture
def play_payload(board: dict) -> dict:
    return {
        "name": "Salida en 3 desde portero",
        "category": "Ataque",
        "surface": "full",
        "formation_size": "f11",
        "notes": "Consignas de ejemplo",
        "board": board,
    }
