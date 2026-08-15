"""Gestión de usuarios. Todas estas rutas son sólo para el administrador."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentAdmin, DbSession
from app.models import User
from app.schemas.user import PasswordReset, UserCreate, UserRead, UserUpdate
from app.services import users as service

router = APIRouter(prefix="/users", tags=["usuarios"])


def _get_or_404(db: Session, user_id: str) -> User:
    user = service.get_user(db, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return user


@router.get("", response_model=list[UserRead], summary="Listar usuarios")
def list_users(db: DbSession, _: CurrentAdmin) -> list[User]:
    return service.list_users(db)


@router.post(
    "",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Dar de alta un usuario",
)
def create_user(payload: UserCreate, db: DbSession, _: CurrentAdmin) -> User:
    try:
        return service.create_user(db, payload)
    except service.UserError as error:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(error)) from error


@router.patch("/{user_id}", response_model=UserRead, summary="Editar o bloquear un usuario")
def update_user(user_id: str, payload: UserUpdate, db: DbSession, admin: CurrentAdmin) -> User:
    user = _get_or_404(db, user_id)
    # Nadie se bloquea ni se quita a sí mismo los permisos por error.
    if user.id == admin.id:
        if payload.blocked is True:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, detail="No puedes bloquear tu propio usuario"
            )
        if payload.role is not None and payload.role.value != user.role:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, detail="No puedes cambiar tu propio permiso"
            )
    try:
        return service.update_user(db, user, payload)
    except service.UserError as error:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(error)) from error


@router.post(
    "/{user_id}/password",
    response_model=UserRead,
    summary="Restablecer la contraseña de un usuario",
)
def reset_password(user_id: str, payload: PasswordReset, db: DbSession, _: CurrentAdmin) -> User:
    return service.reset_password(db, _get_or_404(db, user_id), payload.new_password)
