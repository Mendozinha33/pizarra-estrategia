"""Agregador de routers de la API."""

from fastapi import APIRouter

from app.api.routes import health, plays, training_sessions

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(plays.router)
api_router.include_router(training_sessions.router)
