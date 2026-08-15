"""Configuración de la aplicación, leída del entorno (12-factor)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="PIZARRA_",
        extra="ignore",
    )

    app_name: str = "Pizarra Táctica API"
    version: str = "1.0.0"
    debug: bool = False

    # PostgreSQL en todos los entornos: desarrollo, tests y producción usan el
    # mismo motor, así nada se rompe sólo al desplegar.
    database_url: str = "postgresql+psycopg://pizarra:pizarra@localhost:5432/pizarra"

    # Pool de conexiones (uvicorn sirve las rutas sync en un threadpool).
    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_pool_recycle_seconds: int = 1800

    api_prefix: str = "/api"

    # Acceso de usuarios. La clave de firma se genera sola y se guarda en la base
    # de datos si no se define aquí; así nunca está escrita en el repositorio.
    auth_secret: str = ""
    session_days: int = 30

    # Sólo se usan la primera vez, para crear el administrador inicial. Si ya hay
    # usuarios dados de alta, estos valores se ignoran.
    admin_email: str = "admin@aravacacf.com"
    admin_password: str = "admin123"
    admin_name: str = "Administrador"

    # Cadena separada por comas y no una lista: pydantic-settings exigiría JSON
    # para un list[str], y `PIZARRA_CORS_ORIGINS=a,b` es lo natural en un .env.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
