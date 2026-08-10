"""Tests de la API de sesiones de entrenamiento."""

from fastapi.testclient import TestClient


def test_current_session_is_created_on_demand(client: TestClient) -> None:
    first = client.get("/api/sessions/current")
    assert first.status_code == 200
    assert first.json()["blocks"] == []

    second = client.get("/api/sessions/current")
    assert second.json()["id"] == first.json()["id"], "no debe crear una sesión por llamada"


def test_blocks_crud_and_total_minutes(client: TestClient, play_payload: dict) -> None:
    session_id = client.get("/api/sessions/current").json()["id"]
    play_id = client.post("/api/plays", json=play_payload).json()["id"]

    warmup = client.post(
        f"/api/sessions/{session_id}/blocks",
        json={"title": "Calentamiento", "minutes": 12},
    )
    assert warmup.status_code == 201
    assert warmup.json()["position"] == 0

    main = client.post(
        f"/api/sessions/{session_id}/blocks",
        json={"title": "Tarea principal", "minutes": 30, "play_id": play_id},
    )
    assert main.json()["position"] == 1
    assert main.json()["play"]["name"] == play_payload["name"]

    session = client.get(f"/api/sessions/{session_id}").json()
    assert session["total_minutes"] == 42
    assert [b["title"] for b in session["blocks"]] == ["Calentamiento", "Tarea principal"]

    updated = client.patch(
        f"/api/sessions/{session_id}/blocks/{warmup.json()['id']}",
        json={"minutes": 20, "notes": "Movilidad articular"},
    )
    assert updated.json()["minutes"] == 20
    assert updated.json()["notes"] == "Movilidad articular"

    assert (
        client.delete(f"/api/sessions/{session_id}/blocks/{main.json()['id']}").status_code == 204
    )
    assert client.get(f"/api/sessions/{session_id}").json()["total_minutes"] == 20


def test_block_play_can_be_detached_with_empty_string(
    client: TestClient, play_payload: dict
) -> None:
    session_id = client.get("/api/sessions/current").json()["id"]
    play_id = client.post("/api/plays", json=play_payload).json()["id"]
    block_id = client.post(f"/api/sessions/{session_id}/blocks", json={"play_id": play_id}).json()[
        "id"
    ]

    detached = client.patch(f"/api/sessions/{session_id}/blocks/{block_id}", json={"play_id": ""})
    assert detached.status_code == 200
    assert detached.json()["play"] is None


def test_block_rejects_unknown_play(client: TestClient) -> None:
    session_id = client.get("/api/sessions/current").json()["id"]
    response = client.post(f"/api/sessions/{session_id}/blocks", json={"play_id": "no-existe"})
    assert response.status_code == 422


def test_deleting_a_play_keeps_the_block(client: TestClient, play_payload: dict) -> None:
    session_id = client.get("/api/sessions/current").json()["id"]
    play_id = client.post("/api/plays", json=play_payload).json()["id"]
    client.post(f"/api/sessions/{session_id}/blocks", json={"title": "Tarea", "play_id": play_id})

    assert client.delete(f"/api/plays/{play_id}").status_code == 204

    blocks = client.get(f"/api/sessions/{session_id}").json()["blocks"]
    assert len(blocks) == 1
    assert blocks[0]["play"] is None


def test_reorder_blocks(client: TestClient) -> None:
    session_id = client.get("/api/sessions/current").json()["id"]
    ids = [
        client.post(f"/api/sessions/{session_id}/blocks", json={"title": title}).json()["id"]
        for title in ("A", "B", "C")
    ]

    response = client.put(
        f"/api/sessions/{session_id}/blocks/order", json={"block_ids": [ids[2], ids[0], ids[1]]}
    )
    assert response.status_code == 200
    assert [b["title"] for b in response.json()["blocks"]] == ["C", "A", "B"]

    invalid = client.put(
        f"/api/sessions/{session_id}/blocks/order", json={"block_ids": ["fantasma"]}
    )
    assert invalid.status_code == 422


def test_deleting_session_cascades_blocks(client: TestClient) -> None:
    session_id = client.get("/api/sessions/current").json()["id"]
    block_id = client.post(f"/api/sessions/{session_id}/blocks", json={}).json()["id"]

    assert client.delete(f"/api/sessions/{session_id}").status_code == 204
    assert client.get(f"/api/sessions/{session_id}").status_code == 404
    assert (
        client.patch(
            f"/api/sessions/{session_id}/blocks/{block_id}", json={"minutes": 5}
        ).status_code
        == 404
    )


def test_block_minutes_are_bounded(client: TestClient) -> None:
    session_id = client.get("/api/sessions/current").json()["id"]
    assert (
        client.post(f"/api/sessions/{session_id}/blocks", json={"minutes": 0}).status_code == 422
    )
