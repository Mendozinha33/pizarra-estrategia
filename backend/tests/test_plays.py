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
