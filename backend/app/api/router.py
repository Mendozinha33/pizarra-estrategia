"""Agregador de routers de la API."""

from fastapi import APIRouter, Depends

from app.api.deps import current_user
from app.api.routes import auth, health, plays, training_sessions, users

# Jugadas y sesiones sólo son accesibles con la sesión iniciada; salud y acceso, no.
private = [Depends(current_user)]

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(plays.router, dependencies=private)
api_router.include_router(training_sessions.router, dependencies=private)
