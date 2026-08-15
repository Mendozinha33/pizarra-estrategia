"""Lógica de usuarios y de acceso, aislada de FastAPI."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.models import Setting, User
from app.models.setting import AUTH_SECRET_KEY
from app.models.user import ROLE_ADMIN
from app.schemas.user import UserCreate, UserUpdate


class UserError(Exception):
    """Error de negocio con mensaje ya redactado para el usuario final."""


def normalize_email(email: str) -> str:
    return email.strip().lower()


# --------------------------------------------------------------------------- #
# Clave de firma y usuario inicial
# --------------------------------------------------------------------------- #


def ensure_signing_secret(db: Session) -> str:
    """Carga la clave con la que se firman las sesiones; la crea la primera vez.

    Vive en la base de datos (no en el código) para que no aparezca en el
    repositorio y siga siendo la misma tras cada reinicio del servidor.
    """
    if settings.auth_secret:
        security.set_signing_secret(settings.auth_secret)
        return settings.auth_secret

    row = db.get(Setting, AUTH_SECRET_KEY)
    if row is None:
        row = Setting(key=AUTH_SECRET_KEY, value=security.generate_secret())
        db.add(row)
        db.commit()
        db.refresh(row)
    security.set_signing_secret(row.value)
    return row.value


def ensure_initial_admin(db: Session) -> User | None:
    """Crea el administrador la primera vez. Si ya hay usuarios, no toca nada."""
    if db.scalar(select(func.count()).select_from(User)):
        return None
    admin = User(
        email=normalize_email(settings.admin_email),
        name=settings.admin_name,
        role=ROLE_ADMIN,
        password_hash=security.hash_password(settings.admin_password),
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


# --------------------------------------------------------------------------- #
# Consultas
# --------------------------------------------------------------------------- #


def list_users(db: Session) -> list[User]:
    return list(db.scalars(select(User).order_by(User.created_at.asc())))


def get_user(db: Session, user_id: str) -> User | None:
    return db.get(User, user_id)


def get_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == normalize_email(email)))


def count_active_admins(db: Session, *, excluding: str | None = None) -> int:
    stmt = (
        select(func.count())
        .select_from(User)
        .where(User.role == ROLE_ADMIN, User.blocked.is_(False))
    )
    if excluding:
        stmt = stmt.where(User.id != excluding)
    return db.scalar(stmt) or 0


# --------------------------------------------------------------------------- #
# Altas y cambios
# --------------------------------------------------------------------------- #


def create_user(db: Session, payload: UserCreate) -> User:
    email = normalize_email(payload.email)
    if get_by_email(db, email) is not None:
        raise UserError("Ya existe un usuario con ese correo")
    user = User(
        email=email,
        name=payload.name,
        role=payload.role.value,
        password_hash=security.hash_password(payload.password),
        must_change_password=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: User, payload: UserUpdate) -> User:
    data = payload.model_dump(exclude_unset=True)

    if "email" in data and data["email"] is not None:
        email = normalize_email(data["email"])
        existing = get_by_email(db, email)
        if existing is not None and existing.id != user.id:
            raise UserError("Ya existe un usuario con ese correo")
        data["email"] = email

    # Nunca dejar la aplicación sin ningún administrador activo.
    leaves_admin = (data.get("role") is not None and data["role"].value != ROLE_ADMIN) or data.get(
        "blocked"
    ) is True
    if (
        user.role == ROLE_ADMIN
        and not user.blocked
        and leaves_admin
        and count_active_admins(db, excluding=user.id) == 0
    ):
        raise UserError("Debe quedar al menos un administrador activo")

    for field, value in data.items():
        setattr(user, field, value.value if hasattr(value, "value") else value)

    # Bloquear cierra la sesión que tuviera abierta.
    if data.get("blocked") is True:
        user.token_version += 1

    db.commit()
    db.refresh(user)
    return user


def reset_password(db: Session, user: User, new_password: str) -> User:
    """El administrador pone una contraseña nueva; el usuario deberá cambiarla."""
    user.password_hash = security.hash_password(new_password)
    user.must_change_password = True
    user.token_version += 1
    db.commit()
    db.refresh(user)
    return user


def change_own_password(db: Session, user: User, current: str, new_password: str) -> User:
    if not security.verify_password(current, user.password_hash):
        raise UserError("La contraseña actual no es correcta")
    user.password_hash = security.hash_password(new_password)
    user.must_change_password = False
    user.token_version += 1
    db.commit()
    db.refresh(user)
    return user


# --------------------------------------------------------------------------- #
# Entrada en la aplicación
# --------------------------------------------------------------------------- #


def authenticate(db: Session, email: str, password: str) -> User:
    user = get_by_email(db, email)
    # Mensaje único: no revelamos si el correo existe o no.
    invalid = UserError("Correo o contraseña incorrectos")
    if user is None or not security.verify_password(password, user.password_hash):
        raise invalid
    if user.blocked:
        raise UserError("Este usuario está bloqueado. Habla con el administrador.")
    return user


def issue_token(user: User) -> str:
    return security.create_token(
        user_id=user.id,
        token_version=user.token_version,
        expires_in_days=settings.session_days,
    )
