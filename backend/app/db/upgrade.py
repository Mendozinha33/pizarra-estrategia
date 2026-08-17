"""Ajustes de esquema sobre tablas que ya existen.

`Base.metadata.create_all` sólo crea tablas nuevas: nunca añade columnas a una
tabla que ya está creada. Como aquí no hay Alembic, las columnas añadidas
después del primer despliegue se aplican en el arranque con sentencias
idempotentes (`IF NOT EXISTS`), seguras de repetir en cada reinicio.

Si el esquema sigue creciendo, sustituir esto por migraciones de verdad.
"""

from __future__ import annotations

import logging

from sqlalchemy import Engine, text

logger = logging.getLogger("pizarra")

# Cada sentencia debe poder ejecutarse muchas veces sin efecto adicional.
STATEMENTS = (
    # Dueño de cada jugada y de cada sesión: sin él no se puede filtrar por usuario.
    """
    ALTER TABLE plays
        ADD COLUMN IF NOT EXISTS owner_id VARCHAR(32)
        REFERENCES users(id) ON DELETE SET NULL
    """,
    "CREATE INDEX IF NOT EXISTS ix_plays_owner_id ON plays (owner_id)",
    """
    ALTER TABLE training_sessions
        ADD COLUMN IF NOT EXISTS owner_id VARCHAR(32)
        REFERENCES users(id) ON DELETE SET NULL
    """,
    "CREATE INDEX IF NOT EXISTS ix_training_sessions_owner_id ON training_sessions (owner_id)",
    # Carpetas: tipo fijo (partido/entrenamiento) y carpeta libre dentro de él.
    """
    ALTER TABLE plays
        ADD COLUMN IF NOT EXISTS kind VARCHAR(16) NOT NULL DEFAULT 'entrenamiento'
    """,
    "ALTER TABLE plays ADD COLUMN IF NOT EXISTS folder VARCHAR(60) NOT NULL DEFAULT ''",
    "CREATE INDEX IF NOT EXISTS ix_plays_kind ON plays (kind)",
    "CREATE INDEX IF NOT EXISTS ix_plays_folder ON plays (folder)",
)

# Lo guardado antes de haber usuarios pasa a ser del administrador más antiguo.
ADOPT_ORPHANS = """
    UPDATE {table} SET owner_id = (
        SELECT id FROM users
        WHERE role = 'admin' AND blocked = false
        ORDER BY created_at ASC
        LIMIT 1
    )
    WHERE owner_id IS NULL
"""


def run(engine: Engine) -> None:
    with engine.begin() as connection:
        for statement in STATEMENTS:
            connection.execute(text(statement))

    with engine.begin() as connection:
        adopted = sum(
            connection.execute(text(ADOPT_ORPHANS.format(table=table))).rowcount
            for table in ("plays", "training_sessions")
        )
    if adopted:
        logger.info("Asignadas al administrador %s filas sin dueño", adopted)
