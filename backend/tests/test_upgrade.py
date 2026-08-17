"""Tests del ajuste de esquema sobre una base que ya tenía datos.

Es el escenario real de producción: las tablas existen desde antes de que
hubiera dueños ni carpetas, y no se puede perder nada al añadirlas.
"""

from fastapi.testclient import TestClient
from sqlalchemy import Engine, text
from sqlalchemy.orm import Session

from app.db import upgrade


def _drop_new_columns(engine: Engine) -> None:
    """Deja `plays` como estaba antes de esta versión."""
    with engine.begin() as connection:
        for statement in (
            "ALTER TABLE plays DROP COLUMN IF EXISTS owner_id",
            "ALTER TABLE plays DROP COLUMN IF EXISTS kind",
            "ALTER TABLE plays DROP COLUMN IF EXISTS folder",
            "ALTER TABLE training_sessions DROP COLUMN IF EXISTS owner_id",
        ):
            connection.execute(text(statement))


def test_anade_las_columnas_y_adopta_lo_que_ya_habia(
    client: TestClient, engine: Engine, db_session: Session, play_payload: dict
) -> None:
    creada = client.post("/api/plays", json=play_payload).json()
    admin_id = client.get("/api/users").json()[0]["id"]

    # Cambiar columnas necesita la tabla libre: la sesión del test la retiene.
    db_session.close()
    _drop_new_columns(engine)
    upgrade.run(engine)

    with engine.begin() as connection:
        fila = connection.execute(
            text("SELECT owner_id, kind, folder, name FROM plays WHERE id = :id"),
            {"id": creada["id"]},
        ).one()

    assert fila.name == creada["name"], "la jugada no se pierde"
    assert fila.owner_id == admin_id, "pasa a ser del administrador"
    assert fila.kind == "entrenamiento"
    assert fila.folder == ""


def test_repetirlo_no_rompe_nada(
    client: TestClient, engine: Engine, db_session: Session, play_payload: dict
) -> None:
    """El ajuste corre en cada arranque del servidor: debe ser inofensivo."""
    creada = client.post("/api/plays", json=play_payload).json()

    db_session.close()
    upgrade.run(engine)
    upgrade.run(engine)

    assert client.get(f"/api/plays/{creada['id']}").status_code == 200
