"""Tests de gestión de usuarios: alta, edición, restablecer contraseña y bloqueo."""

from fastapi.testclient import TestClient

from tests.conftest import ADMIN_EMAIL, login

NUEVO = {
    "email": "entrenador@aravacacf.com",
    "name": "Entrenador Cadete",
    "password": "entrena-2026",
}


def crear(client: TestClient, **extra: object) -> dict:
    response = client.post("/api/users", json={**NUEVO, **extra})
    assert response.status_code == 201, response.text
    return response.json()


def test_alta_de_usuario(client: TestClient) -> None:
    usuario = crear(client)
    assert usuario["email"] == NUEVO["email"]
    assert usuario["role"] == "entrenador"
    assert usuario["blocked"] is False
    # Se pide cambiar la contraseña que puso el administrador.
    assert usuario["must_change_password"] is True


def test_el_usuario_nuevo_puede_entrar(client: TestClient) -> None:
    crear(client)
    token = login(client, NUEVO["email"], NUEVO["password"])
    assert (
        client.get("/api/plays", headers={"Authorization": f"Bearer {token}"}).status_code == 200
    )


def test_no_se_repite_el_correo(client: TestClient) -> None:
    crear(client)
    assert client.post("/api/users", json=NUEVO).status_code == 409
    # Ni cambiando mayúsculas.
    assert (
        client.post("/api/users", json={**NUEVO, "email": NUEVO["email"].upper()}).status_code
        == 409
    )


def test_correo_o_contrasena_no_validos(client: TestClient) -> None:
    assert (
        client.post("/api/users", json={**NUEVO, "email": "esto-no-es-un-correo"}).status_code
        == 422
    )
    assert client.post("/api/users", json={**NUEVO, "password": "corta"}).status_code == 422


def test_listar_usuarios(client: TestClient) -> None:
    crear(client)
    response = client.get("/api/users")
    assert response.status_code == 200
    correos = [item["email"] for item in response.json()]
    assert correos == [ADMIN_EMAIL, NUEVO["email"]]


def test_editar_nombre_y_permiso(client: TestClient) -> None:
    usuario = crear(client)
    response = client.patch(
        f"/api/users/{usuario['id']}", json={"name": "Segundo entrenador", "role": "admin"}
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Segundo entrenador"
    assert response.json()["role"] == "admin"


def test_restablecer_contrasena(client: TestClient) -> None:
    usuario = crear(client)
    antiguo = login(client, NUEVO["email"], NUEVO["password"])

    response = client.post(
        f"/api/users/{usuario['id']}/password", json={"new_password": "contrasena-nueva"}
    )
    assert response.status_code == 200
    assert response.json()["must_change_password"] is True

    # La sesión que tuviera abierta deja de valer y la contraseña vieja tampoco.
    assert (
        client.get("/api/plays", headers={"Authorization": f"Bearer {antiguo}"}).status_code == 401
    )
    assert (
        client.post(
            "/api/auth/login", json={"email": NUEVO["email"], "password": NUEVO["password"]}
        ).status_code
        == 401
    )
    assert login(client, NUEVO["email"], "contrasena-nueva")


def test_bloquear_y_desbloquear(client: TestClient) -> None:
    usuario = crear(client)
    abierto = login(client, NUEVO["email"], NUEVO["password"])

    bloqueo = client.patch(f"/api/users/{usuario['id']}", json={"blocked": True})
    assert bloqueo.status_code == 200
    assert bloqueo.json()["blocked"] is True

    # Ni puede entrar ni le vale la sesión que tenía abierta.
    assert (
        client.get("/api/plays", headers={"Authorization": f"Bearer {abierto}"}).status_code == 401
    )
    negado = client.post(
        "/api/auth/login", json={"email": NUEVO["email"], "password": NUEVO["password"]}
    )
    assert negado.status_code == 401
    assert "bloquead" in negado.json()["detail"].lower()

    assert client.patch(f"/api/users/{usuario['id']}", json={"blocked": False}).status_code == 200
    assert login(client, NUEVO["email"], NUEVO["password"])


def test_un_entrenador_no_gestiona_usuarios(client: TestClient) -> None:
    crear(client)
    token = login(client, NUEVO["email"], NUEVO["password"])
    cabecera = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/users", headers=cabecera).status_code == 403
    assert client.post("/api/users", json=NUEVO, headers=cabecera).status_code == 403


def test_sin_sesion_no_se_ven_los_usuarios(anon_client: TestClient) -> None:
    assert anon_client.get("/api/users").status_code == 401


def test_el_administrador_no_se_bloquea_a_si_mismo(client: TestClient) -> None:
    yo = client.get("/api/auth/me").json()
    assert client.patch(f"/api/users/{yo['id']}", json={"blocked": True}).status_code == 400
    assert client.patch(f"/api/users/{yo['id']}", json={"role": "entrenador"}).status_code == 400


def test_siempre_queda_un_administrador(client: TestClient) -> None:
    otro = crear(client, role="admin")
    yo = client.get("/api/auth/me").json()
    # Con dos administradores sí se puede degradar al otro...
    assert client.patch(f"/api/users/{otro['id']}", json={"role": "entrenador"}).status_code == 200
    # ...pero entonces yo soy el único que queda.
    assert client.patch(f"/api/users/{yo['id']}", json={"blocked": True}).status_code == 400


def test_usuario_inexistente(client: TestClient) -> None:
    assert client.patch("/api/users/nohay", json={"name": "X"}).status_code == 404
    assert (
        client.post("/api/users/nohay/password", json={"new_password": "otra-clave"}).status_code
        == 404
    )
