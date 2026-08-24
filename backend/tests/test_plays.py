"""Tests de la API de jugadas."""

from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    assert client.get("/api/health").json()["status"] == "ok"
    assert client.get("/api/health/ready").json()["status"] == "ready"


def test_create_and_read_play(client: TestClient, play_payload: dict) -> None:
    response = client.post("/api/plays", json=play_payload)
    assert response.status_code == 201, response.text
    created = response.json()

    assert created["name"] == play_payload["name"]
    assert created["board"]["players"][0]["num"] == "9"
    assert created["id"]

    fetched = client.get(f"/api/plays/{created['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["board"] == created["board"]


def test_list_filters_by_category_and_search(client: TestClient, play_payload: dict) -> None:
    client.post("/api/plays", json=play_payload)
    client.post("/api/plays", json={**play_payload, "name": "Repliegue", "category": "Defensa"})

    assert len(client.get("/api/plays").json()) == 2
    assert len(client.get("/api/plays", params={"category": "Defensa"}).json()) == 1
    assert (
        client.get("/api/plays", params={"search": "salida"}).json()[0]["name"]
        == (play_payload["name"])
    )


def test_update_play_is_partial(client: TestClient, play_payload: dict) -> None:
    play_id = client.post("/api/plays", json=play_payload).json()["id"]

    response = client.patch(f"/api/plays/{play_id}", json={"name": "  Nuevo nombre  "})
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Nuevo nombre"
    assert body["category"] == play_payload["category"]
    assert body["board"]["players"], "el tablero no debe perderse en un update parcial"


def test_delete_play(client: TestClient, play_payload: dict) -> None:
    play_id = client.post("/api/plays", json=play_payload).json()["id"]

    assert client.delete(f"/api/plays/{play_id}").status_code == 204
    assert client.get(f"/api/plays/{play_id}").status_code == 404


def test_unknown_play_returns_404(client: TestClient) -> None:
    assert client.get("/api/plays/no-existe").status_code == 404
    assert client.patch("/api/plays/no-existe", json={"name": "x"}).status_code == 404
    assert client.delete("/api/plays/no-existe").status_code == 404


def test_rejects_empty_name(client: TestClient, play_payload: dict) -> None:
    response = client.post("/api/plays", json={**play_payload, "name": "   "})
    assert response.status_code == 422


def test_rejects_invalid_board(client: TestClient, play_payload: dict) -> None:
    broken = {**play_payload, "board": {**play_payload["board"], "ball": {"x": 99999, "y": 0}}}
    assert client.post("/api/plays", json=broken).status_code == 422

    bad_color = {
        **play_payload,
        "board": {
            **play_payload["board"],
            "shapes": [{**play_payload["board"]["shapes"][0], "color": "amarillo"}],
        },
    }
    assert client.post("/api/plays", json=bad_color).status_code == 422


def test_formation_labels_round_trip(client: TestClient, play_payload: dict) -> None:
    created = client.post(
        "/api/plays",
        json={
            **play_payload,
            "formation_size": "f7",
            "home_formation": "2-3-1",
            "away_formation": "3-2-1",
        },
    ).json()

    assert created["home_formation"] == "2-3-1"
    assert created["away_formation"] == "3-2-1"
    assert client.get(f"/api/plays/{created['id']}").json()["formation_size"] == "f7"


def test_defaults_formations_when_absent(client: TestClient, play_payload: dict) -> None:
    created = client.post("/api/plays", json=play_payload).json()
    assert created["home_formation"] == "4-3-3"
    assert created["away_formation"] == "4-4-2"


def test_rejects_malformed_formation(client: TestClient, play_payload: dict) -> None:
    response = client.post("/api/plays", json={**play_payload, "home_formation": "rombo"})
    assert response.status_code == 422


def test_rejects_unknown_category(client: TestClient, play_payload: dict) -> None:
    assert client.post("/api/plays", json={**play_payload, "category": "Otra"}).status_code == 422


def test_board_colors_default_when_absent(client: TestClient, play_payload: dict) -> None:
    """Las jugadas guardadas antes de poder elegir color se leen con los de siempre."""
    created = client.post("/api/plays", json=play_payload).json()

    assert created["board"]["colors"]["home"] == {"player": "#F4F7F3", "gk": "#FFD447"}
    assert created["board"]["colors"]["away"] == {"player": "#D6274B", "gk": "#2B6CF6"}
    assert created["board"]["players"][0]["role"] is None


def test_board_colors_and_goalkeeper_round_trip(
    client: TestClient, play_payload: dict, board: dict
) -> None:
    board = {
        **board,
        "players": [{**board["players"][0], "role": "gk"}, board["players"][1]],
        "colors": {
            "home": {"player": "#1B7F3B", "gk": "#FFFFFF"},
            "away": {"player": "#000", "gk": "#FF8A3D"},
        },
    }
    created = client.post("/api/plays", json={**play_payload, "board": board}).json()

    stored = client.get(f"/api/plays/{created['id']}").json()["board"]
    assert stored["colors"]["home"]["player"] == "#1B7F3B"
    assert stored["colors"]["away"]["gk"] == "#FF8A3D"
    assert stored["players"][0]["role"] == "gk"
    assert stored["players"][1]["role"] is None


def test_rejects_invalid_color_or_role(
    client: TestClient, play_payload: dict, board: dict
) -> None:
    bad_color = {**board, "colors": {"home": {"player": "verde", "gk": "#FFF"}}}
    assert client.post("/api/plays", json={**play_payload, "board": bad_color}).status_code == 422

    bad_role = {**board, "players": [{**board["players"][0], "role": "delantero"}]}
    assert client.post("/api/plays", json={**play_payload, "board": bad_role}).status_code == 422


# --------------------------------------------------------------------------- #
# Cada uno ve lo suyo; el administrador, todo
# --------------------------------------------------------------------------- #


def test_el_entrenador_solo_ve_lo_suyo(
    client: TestClient, coach: dict, play_payload: dict
) -> None:
    client.post("/api/plays", json={**play_payload, "name": "Del administrador"})
    client.post(
        "/api/plays", json={**play_payload, "name": "Del entrenador"}, headers=coach["headers"]
    )

    suyas = client.get("/api/plays", headers=coach["headers"]).json()
    assert [play["name"] for play in suyas] == ["Del entrenador"]

    # El administrador ve las dos y sabe de quién es cada una.
    todas = client.get("/api/plays").json()
    assert {play["name"] for play in todas} == {"Del administrador", "Del entrenador"}
    del_entrenador = next(play for play in todas if play["name"] == "Del entrenador")
    assert del_entrenador["owner_name"] == coach["user"]["name"]


def test_no_se_puede_abrir_ni_borrar_la_jugada_de_otro(
    client: TestClient, coach: dict, play_payload: dict
) -> None:
    ajena = client.post("/api/plays", json=play_payload).json()["id"]

    assert client.get(f"/api/plays/{ajena}", headers=coach["headers"]).status_code == 404
    assert (
        client.patch(
            f"/api/plays/{ajena}", json={"name": "Mía ahora"}, headers=coach["headers"]
        ).status_code
        == 404
    )
    assert client.delete(f"/api/plays/{ajena}", headers=coach["headers"]).status_code == 404
    # Y sigue intacta para su dueño.
    assert client.get(f"/api/plays/{ajena}").status_code == 200


def test_el_administrador_si_puede_abrir_la_del_entrenador(
    client: TestClient, coach: dict, play_payload: dict
) -> None:
    ajena = client.post("/api/plays", json=play_payload, headers=coach["headers"]).json()["id"]
    assert client.get(f"/api/plays/{ajena}").status_code == 200


def test_hay_que_iniciar_sesion(anon_client: TestClient, play_payload: dict) -> None:
    assert anon_client.get("/api/plays").status_code == 401
    assert anon_client.post("/api/plays", json=play_payload).status_code == 401


# --------------------------------------------------------------------------- #
# Carpetas
# --------------------------------------------------------------------------- #


def test_tipo_y_carpeta_por_defecto(client: TestClient, play_payload: dict) -> None:
    creada = client.post("/api/plays", json=play_payload).json()
    assert creada["kind"] == "entrenamiento"
    assert creada["folder"] == ""


def test_filtrar_por_tipo_y_carpeta(client: TestClient, play_payload: dict) -> None:
    client.post(
        "/api/plays",
        json={**play_payload, "name": "Córner rival", "kind": "partido", "folder": "Jornada 3"},
    )
    client.post(
        "/api/plays",
        json={**play_payload, "name": "Rondo", "kind": "entrenamiento", "folder": "Martes"},
    )
    client.post("/api/plays", json={**play_payload, "name": "Suelta"})

    partidos = client.get("/api/plays", params={"kind": "partido"}).json()
    assert [play["name"] for play in partidos] == ["Córner rival"]

    en_martes = client.get("/api/plays", params={"folder": "Martes"}).json()
    assert [play["name"] for play in en_martes] == ["Rondo"]

    # La carpeta vacía es un filtro válido: las jugadas sueltas.
    sueltas = client.get("/api/plays", params={"folder": ""}).json()
    assert [play["name"] for play in sueltas] == ["Suelta"]


def test_el_nombre_de_carpeta_se_limpia(client: TestClient, play_payload: dict) -> None:
    creada = client.post("/api/plays", json={**play_payload, "folder": "  Semana  1  "}).json()
    assert creada["folder"] == "Semana 1"


def test_listado_de_carpetas_por_usuario(
    client: TestClient, coach: dict, play_payload: dict
) -> None:
    client.post("/api/plays", json={**play_payload, "kind": "partido", "folder": "Jornada 3"})
    client.post("/api/plays", json={**play_payload, "kind": "partido", "folder": "Jornada 3"})
    client.post(
        "/api/plays",
        json={**play_payload, "folder": "Del entrenador"},
        headers=coach["headers"],
    )

    del_admin = client.get("/api/plays/folders").json()
    assert {"kind": "partido", "folder": "Jornada 3", "count": 2} in del_admin

    del_coach = client.get("/api/plays/folders", headers=coach["headers"]).json()
    assert del_coach == [{"kind": "entrenamiento", "folder": "Del entrenador", "count": 1}]


def test_mover_una_jugada_de_carpeta(client: TestClient, play_payload: dict) -> None:
    play_id = client.post("/api/plays", json=play_payload).json()["id"]

    movida = client.patch(
        f"/api/plays/{play_id}", json={"kind": "partido", "folder": "Jornada 4"}
    ).json()
    assert movida["kind"] == "partido"
    assert movida["folder"] == "Jornada 4"


def test_rechaza_un_tipo_desconocido(client: TestClient, play_payload: dict) -> None:
    assert client.post("/api/plays", json={**play_payload, "kind": "amistoso"}).status_code == 422


# --------------------------------------------------------------------------- #
# El balón es opcional
# --------------------------------------------------------------------------- #


def test_se_puede_guardar_una_jugada_sin_balon(
    client: TestClient, play_payload: dict, board: dict
) -> None:
    sin_balon = client.post(
        "/api/plays", json={**play_payload, "board": {**board, "ball": None}}
    ).json()

    assert sin_balon["board"]["ball"] is None
    assert client.get(f"/api/plays/{sin_balon['id']}").json()["board"]["ball"] is None


def test_el_balon_va_donde_lo_pongas(client: TestClient, play_payload: dict, board: dict) -> None:
    colocado = {**board, "ball": {"x": 180.0, "y": 90.0}}
    creada = client.post("/api/plays", json={**play_payload, "board": colocado}).json()

    assert creada["board"]["ball"] == {"x": 180.0, "y": 90.0}


def test_sin_indicar_balon_se_pone_en_el_centro(
    client: TestClient, play_payload: dict, board: dict
) -> None:
    """Las jugadas guardadas antes de poder quitarlo siguen teniéndolo."""
    sin_campo = {key: value for key, value in board.items() if key != "ball"}
    creada = client.post("/api/plays", json={**play_payload, "board": sin_campo}).json()

    assert creada["board"]["ball"] == {"x": 525.0, "y": 340.0}


# --------------------------------------------------------------------------- #
# Material del campo y plantillas grandes
# --------------------------------------------------------------------------- #


def test_se_pueden_guardar_porterias_y_escaleras(
    client: TestClient, play_payload: dict, board: dict
) -> None:
    material = [
        {"id": "i1", "kind": "cone", "x": 200.0, "y": 200.0},
        {"id": "i2", "kind": "small_goal", "x": 300.0, "y": 120.0},
        {"id": "i3", "kind": "big_goal", "x": 1000.0, "y": 340.0},
        {"id": "i4", "kind": "ladder", "x": 420.0, "y": 560.0},
    ]
    creada = client.post(
        "/api/plays", json={**play_payload, "board": {**board, "items": material}}
    ).json()

    assert [item["kind"] for item in creada["board"]["items"]] == [
        "cone",
        "small_goal",
        "big_goal",
        "ladder",
    ]


def test_material_desconocido_se_rechaza(
    client: TestClient, play_payload: dict, board: dict
) -> None:
    inventado = {**board, "items": [{"id": "i1", "kind": "trampolin", "x": 10.0, "y": 10.0}]}
    assert client.post("/api/plays", json={**play_payload, "board": inventado}).status_code == 422


def test_caben_treinta_jugadores_y_tres_porteros_por_equipo(
    client: TestClient, play_payload: dict, board: dict
) -> None:
    plantilla = [
        {
            "id": f"{team}-{index}",
            "team": team,
            "num": str(index + 1),
            "name": "",
            "role": "gk" if index < 3 else "field",
            "x": 100.0 + index * 10,
            "y": 100.0,
        }
        for team in ("home", "away")
        for index in range(33)
    ]
    creada = client.post(
        "/api/plays", json={**play_payload, "board": {**board, "players": plantilla}}
    )

    assert creada.status_code == 201, creada.text
    assert len(creada.json()["board"]["players"]) == 66
