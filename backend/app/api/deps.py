"""Dependencias compartidas de la API: quién hace la petición y qué puede hacer."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core import security
from app.db.session import get_db
from app.models import User
from app.services import users as service

DbSession = Annotated[Session, Depends(get_db)]

_UNAUTHORIZED = HTTPException(
    status.HTTP_401_UNAUTHORIZED,
    detail="Hay que iniciar sesión",
    headers={"WWW-Authenticate": "Bearer"},
)


def current_user(
    db: DbSession,
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    """Usuario de la credencial enviada en la cabecera `Authorization: Bearer ...`."""
    if not security.signing_secret_is_set():  # pragma: no cover - sólo si falla el arranque
        service.ensure_signing_secret(db)

    scheme, separator, token = (authorization or "").partition(" ")
    if not separator or scheme.lower() != "bearer":
        raise _UNAUTHORIZED

    payload = security.read_token(token.strip())
    if payload is None:
        raise _UNAUTHORIZED

    user = service.get_user(db, payload["sub"])
    if user is None or user.blocked:
        raise _UNAUTHORIZED
    # La sesión caduca al cambiar la contraseña o al bloquear al usuario.
    if payload.get("ver") != user.token_version:
        raise _UNAUTHORIZED
    return user


CurrentUser = Annotated[User, Depends(current_user)]


def current_admin(user: CurrentUser) -> User:
    if not user.is_admin:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="Sólo el administrador puede hacer esto",
        )
    return user


CurrentAdmin = Annotated[User, Depends(current_admin)]
