import os
import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

db_path = Path(tempfile.gettempdir()) / "agent-a2ui-actions-test.db"
if db_path.exists():
    db_path.unlink()
os.environ["AGENT_API_DATABASE_URL"] = f"sqlite:///{db_path}"
os.environ["AGENT_LLM_API_KEY"] = "test-key"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.services.a2ui_actions import clear_idempotency_cache  # noqa: E402


def test_get_a2ui_catalog() -> None:
    with TestClient(app) as client:
        res = client.get("/api/agent/a2ui/catalog")
        assert res.status_code == 200
        body = res.json()
        assert body["catalogId"] == "ruoyi-agent-a2ui"
        assert "AiTable" in body["components"]
        assert "interface.write.confirm" in body["actions"]


def test_action_requires_existing_session() -> None:
    clear_idempotency_cache()
    with TestClient(app) as client:
        res = client.post(
            "/api/agent/actions",
            json={
                "conversationId": "missing",
                "surfaceId": "s1",
                "idempotencyKey": "idem-key-001",
                "action": {
                    "name": "interface.write.confirm",
                    "context": {
                        "projectCode": "demo",
                        "interfaceCode": "user_create",
                        "params": {"name": "a"},
                    },
                },
            },
        )
        assert res.status_code == 404


def test_action_rejects_unknown_name() -> None:
    clear_idempotency_cache()
    with TestClient(app) as client:
        create = client.post("/api/agent/sessions", json={})
        session_id = create.json()["sessionId"]
        res = client.post(
            "/api/agent/actions",
            json={
                "conversationId": session_id,
                "surfaceId": "s1",
                "idempotencyKey": "idem-key-002",
                "action": {"name": "dataset.delete", "context": {}},
            },
        )
        assert res.status_code == 400
        assert res.json()["detail"] == "UNSUPPORTED_A2UI_ACTION"


def test_write_preview_returns_confirm_card() -> None:
    clear_idempotency_cache()
    config = MagicMock(
        parsedConfig={
            "kind": "api",
            "readOnly": False,
            "request": {"method": "POST", "path": "/user"},
        }
    )
    with TestClient(app) as client:
        create = client.post("/api/agent/sessions", json={})
        session_id = create.json()["sessionId"]
        with patch(
            "app.services.a2ui_actions.admin_client.get_interface_config",
            new=AsyncMock(return_value=config),
        ):
            res = client.post(
                "/api/agent/actions",
                json={
                    "conversationId": session_id,
                    "surfaceId": "write_s1",
                    "idempotencyKey": "idem-key-003",
                    "action": {
                        "name": "interface.write.preview",
                        "context": {
                            "projectCode": "demo",
                            "interfaceCode": "user_create",
                            "params": {"userName": "zhang"},
                        },
                    },
                },
            )
        assert res.status_code == 200
        body = res.json()
        assert body["ok"] is True
        assert body["responseMode"] == "TEXT_WITH_A2UI"
        assert len(body["a2uiMessages"]) == 3


def test_write_confirm_calls_executor_once_for_same_key() -> None:
    clear_idempotency_cache()
    config = MagicMock(
        parsedConfig={
            "kind": "api",
            "readOnly": False,
            "request": {"method": "POST", "path": "/user"},
        }
    )
    with TestClient(app) as client:
        create = client.post("/api/agent/sessions", json={})
        session_id = create.json()["sessionId"]
        payload = {
            "conversationId": session_id,
            "surfaceId": "write_s2",
            "idempotencyKey": "idem-key-004",
            "action": {
                "name": "interface.write.confirm",
                "context": {
                    "projectCode": "demo",
                    "interfaceCode": "user_create",
                    "params": {"userName": "zhang"},
                },
            },
        }
        with patch(
            "app.services.a2ui_actions.admin_client.get_interface_config",
            new=AsyncMock(return_value=config),
        ), patch(
            "app.services.a2ui_actions.interface_executor.execute_interface",
            new=AsyncMock(return_value={"ok": True, "data": {"id": 1}}),
        ) as mocked:
            first = client.post("/api/agent/actions", json=payload)
            second = client.post("/api/agent/actions", json=payload)
        assert first.status_code == 200
        assert second.status_code == 200
        assert first.json()["ok"] is True
        assert second.json()["ok"] is True
        assert mocked.await_count == 1


def test_write_confirm_rejects_readonly_interface() -> None:
    clear_idempotency_cache()
    config = MagicMock(
        parsedConfig={
            "kind": "api",
            "readOnly": True,
            "request": {"method": "GET", "path": "/user"},
        }
    )
    with TestClient(app) as client:
        create = client.post("/api/agent/sessions", json={})
        session_id = create.json()["sessionId"]
        with patch(
            "app.services.a2ui_actions.admin_client.get_interface_config",
            new=AsyncMock(return_value=config),
        ):
            res = client.post(
                "/api/agent/actions",
                json={
                    "conversationId": session_id,
                    "surfaceId": "write_s3",
                    "idempotencyKey": "idem-key-005",
                    "action": {
                        "name": "interface.write.confirm",
                        "context": {
                            "projectCode": "demo",
                            "interfaceCode": "user_list",
                            "params": {},
                        },
                    },
                },
            )
        assert res.status_code == 400
        assert res.json()["detail"] == "WRITE_NOT_ALLOWED"
