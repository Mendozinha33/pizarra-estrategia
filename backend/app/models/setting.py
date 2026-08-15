"""Ajustes internos del servidor (clave/valor).

Hoy sólo guarda la clave con la que se firman las sesiones: así se genera sola la
primera vez y sigue siendo la misma tras cada reinicio, sin escribirla en el código
ni obligar a configurar nada a mano.
"""

from __future__ import annotations

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin

AUTH_SECRET_KEY = "auth_secret"


class Setting(TimestampMixin, Base):
    __tablename__ = "app_settings"

    key: Mapped[str] = mapped_column(String(60), primary_key=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)
