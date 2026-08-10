"""Punto de entrada de la API de Pizarra Táctica."""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

# Importar los modelos registra sus tablas en el metadata de Base.
from app import models  # noqa: F401  isort:skip

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
)
logger = logging.getLogger("pizarra")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    # Para un esquema que evoluciona en producción, sustituir por migraciones Alembic.
    Base.metadata.create_all(bind=engine)
    logger.info("Esquema listo en %s", engine.url.render_as_string(hide_password=True))
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    summary="Backend de la pizarra táctica: jugadas y sesiones de entrenamiento.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_prefix)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Nunca devolvemos trazas al cliente; quedan en el log del servidor."""
    logger.exception("Error no controlado en %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor"},
    )
