"""Tests de acceso: iniciar sesión, proteger rutas y cambiar la contraseña."""

from fastapi.testclient import TestClient

from tests.conftest import ADMIN_EMAIL, ADMIN_PASSWORD, login


def test_administrador_inicial_puede_entrar(anon_client: TestClient) -> None:
    response = anon_client.post(
        "/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["token"]
    assert body["user"]["email"] == ADMIN_EMAIL
    assert body["user"]["role"] == "admin"
    assert "password" not in body["user"]


def test_el_correo_no_distingue_mayusculas(anon_client: TestClient) -> None:
    response = anon_client.post(
        "/api/auth/login", json={"email": ADMIN_EMAIL.upper(), "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 200


def test_contrasena_incorrecta(anon_client: TestClient) -> None:
    response = anon_client.post(
        "/api/auth/login", json={"email": ADMIN_EMAIL, "password": "otra-cosa"}
    )
    assert response.status_code == 401


def test_correo_desconocido_da_el_mismo_error(anon_client: TestClient) -> None:
    response = anon_client.post(
        "/api/auth/login", json={"email": "nadie@aravacacf.com", "password": "loquesea"}
    )
    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()


def test_las_jugadas_exigen_sesion(anon_client: TestClient) -> None:
    assert anon_client.get("/api/plays").status_code == 401
    assert anon_client.get("/api/sessions").status_code == 401


def test_la_salud_sigue_siendo_publica(anon_client: TestClient) -> None:
    assert anon_client.get("/api/health").status_code == 200


def test_credencial_manipulada_no_vale(anon_client: TestClient) -> None:
    token = login(anon_client, ADMIN_EMAIL, ADMIN_PASSWORD)
    payload, _, signature = token.partition(".")
    for falso in (f"{payload}.{signature[:-2]}xx", f"{payload}x.{signature}", "algo-inventado"):
        response = anon_client.get("/api/plays", headers={"Authorization": f"Bearer {falso}"})
        assert response.status_code == 401


def test_me_devuelve_el_usuario_de_la_sesion(client: TestClient) -> None:
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == ADMIN_EMAIL


def test_cambiar_mi_contrasena(client: TestClient) -> None:
    response = client.post(
        "/api/auth/password",
        json={"current_password": ADMIN_PASSWORD, "new_password": "clave-nueva-123"},
    )
    assert response.status_code == 200
    assert response.json()["user"]["must_change_password"] is False

    # La credencial devuelta sigue valiendo, y la contraseña vieja ya no.
    nueva = response.json()["token"]
    assert (
        client.get("/api/auth/me", headers={"Authorization": f"Bearer {nueva}"}).status_code == 200
    )
    fallo = client.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert fallo.status_code == 401


def test_no_puedo_cambiar_la_contrasena_sin_saber_la_actual(client: TestClient) -> None:
    response = client.post(
        "/api/auth/password",
        json={"current_password": "me-la-invento", "new_password": "clave-nueva-123"},
    )
    assert response.status_code == 400


def test_la_contrasena_nueva_tiene_minimo(client: TestClient) -> None:
    response = client.post(
        "/api/auth/password",
        json={"current_password": ADMIN_PASSWORD, "new_password": "corta"},
    )
    assert response.status_code == 422
