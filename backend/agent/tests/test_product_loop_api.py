import os
import tempfile
from pathlib import Path
from unittest.mock import patch

db_path = Path(tempfile.gettempdir()) / "agent-product-loop-test.db"
if db_path.exists():
    db_path.unlink()
os.environ["AGENT_API_DATABASE_URL"] = f"sqlite:///{db_path}"
os.environ["AGENT_LLM_API_KEY"] = "test-key"

from fastapi.testclient import TestClient  # noqa: E402

from app.core.errors import AppError  # noqa: E402
from app.main import app  # noqa: E402


def test_interface_test_api_returns_success() -> None:
    with TestClient(app) as client:
        with patch(
            "app.services.interface_executor.execute_interface",
            return_value={"projectCode": "demo", "interfaceCode": "users", "data": [{"id": 1}]},
        ) as execute:
            res = client.post(
                "/api/agent/interfaces/test",
                json={
                    "projectCode": "demo",
                    "interfaceCode": "users",
                    "params": {"pageNum": 1},
                },
            )

    assert res.status_code == 200
    body = res.json()
    assert body["ok"] is True
    assert body["projectCode"] == "demo"
    assert body["interfaceCode"] == "users"
    assert body["data"] == [{"id": 1}]
    assert body["durationMs"] >= 0
    execute.assert_called_once_with("demo", "users", {"pageNum": 1})


def test_interface_test_api_returns_structured_error() -> None:
    with TestClient(app) as client:
        with patch(
            "app.services.interface_executor.execute_interface",
            side_effect=AppError("INTERFACE_PARAM_REQUIRED: pageNum", status_code=400),
        ):
            res = client.post(
                "/api/agent/interfaces/test",
                json={"projectCode": "demo", "interfaceCode": "users", "params": {}},
            )

    assert res.status_code == 200
    body = res.json()
    assert body["ok"] is False
    assert body["error"]["code"] == "INTERFACE_PARAM_REQUIRED: pageNum"
    assert body["error"]["statusCode"] == 400
    assert body["data"] is None


def test_interface_test_api_rejects_write_interface_without_executing_write() -> None:
    with TestClient(app) as client:
        with patch(
            "app.services.interface_executor.execute_interface",
            side_effect=AppError("INTERFACE_WRITE_NOT_ALLOWED", status_code=400),
        ) as execute:
            res = client.post(
                "/api/agent/interfaces/test",
                json={"projectCode": "demo", "interfaceCode": "create_user", "params": {}},
            )

    assert res.status_code == 200
    body = res.json()
    assert body["ok"] is False
    assert body["error"]["code"] == "INTERFACE_WRITE_NOT_ALLOWED"
    execute.assert_called_once_with("demo", "create_user", {})


def test_session_score_create_and_overwrite() -> None:
    with TestClient(app) as client:
        create = client.post("/api/agent/sessions", json={"user_label": "alice"})
        session_id = create.json()["sessionId"]

        first = client.put(
            f"/api/agent/sessions/{session_id}/score",
            json={"score": 5, "comment": "useful"},
        )
        second = client.put(
            f"/api/agent/sessions/{session_id}/score",
            json={"score": 3, "comment": "missing context"},
        )

    assert first.status_code == 200
    assert first.json()["score"] == 5
    assert first.json()["userLabel"] == "alice"
    assert second.status_code == 200
    body = second.json()
    assert body["sessionId"] == session_id
    assert body["score"] == 3
    assert body["comment"] == "missing context"


def test_session_score_validation_and_missing_session() -> None:
    with TestClient(app) as client:
        create = client.post("/api/agent/sessions", json={})
        session_id = create.json()["sessionId"]

        bad_score = client.put(
            f"/api/agent/sessions/{session_id}/score",
            json={"score": 6},
        )
        missing = client.put(
            "/api/agent/sessions/nope/score",
            json={"score": 4},
        )

    assert bad_score.status_code == 422
    assert missing.status_code == 404


def test_audit_api_can_include_session_messages_and_score() -> None:
    with TestClient(app) as client:
        create = client.post("/api/agent/sessions", json={"user_label": "bob"})
        session_id = create.json()["sessionId"]
        client.put(
            f"/api/agent/sessions/{session_id}/score",
            json={"score": 4, "comment": "clear"},
        )

        from app.db.database import get_connection
        from app.repositories import sessions as session_repo

        with get_connection() as conn:
            session_repo.save_message(conn, session_id, "user", "hello")
            session_repo.save_message(conn, session_id, "assistant", "hi")
            session_repo.save_audit_event(
                conn,
                session_id,
                "tool_called",
                {"tool": "execute_interface", "summary": "users"},
            )

        res = client.get(
            f"/api/agent/audit?sessionId={session_id}&includeMessages=true&includeScore=true"
        )

    assert res.status_code == 200
    body = res.json()
    assert body["score"]["score"] == 4
    assert body["score"]["comment"] == "clear"
    assert [m["role"] for m in body["messages"]] == ["user", "assistant"]
    assert body["items"][0]["action"] == "tool_called"
