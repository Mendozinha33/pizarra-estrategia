"""Entrada en la aplicación: iniciar sesión, ver quién soy y cambiar mi contraseña."""

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.models import User
from app.schemas.user import LoginRequest, LoginResponse, PasswordChange, UserRead
from app.services import users as service

router = APIRouter(prefix="/auth", tags=["acceso"])


@router.post("/login", response_model=LoginResponse, summary="Iniciar sesión")
def login(payload: LoginRequest, db: DbSession) -> dict:
    try:
        user = service.authenticate(db, payload.email, payload.password)
    except service.UserError as error:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail=str(error)) from error
    return {"token": service.issue_token(user), "user": user}


@router.get("/me", response_model=UserRead, summary="Usuario de la sesión actual")
def me(user: CurrentUser) -> User:
    return user


@router.post(
    "/password",
    response_model=LoginResponse,
    summary="Cambiar mi propia contraseña",
)
def change_password(payload: PasswordChange, user: CurrentUser, db: DbSession) -> dict:
    try:
        updated = service.change_own_password(
            db, user, payload.current_password, payload.new_password
        )
    except service.UserError as error:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    # El cambio invalida la sesión anterior: devolvemos una nueva para no echar fuera
    # a quien acaba de cambiarla.
    return {"token": service.issue_token(updated), "user": updated}
