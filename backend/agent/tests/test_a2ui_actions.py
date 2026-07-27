import asyncio
import json
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

from app.a2ui.catalog import (  # noqa: E402
    A2UI_PROTOCOL_VERSION,
    CATALOG_ID,
    CATALOG_VERSION,
    COMPONENT_SCHEMAS,
)
from app.db.database import get_connection  # noqa: E402
from app.main import app  # noqa: E402
from app.repositories import a2ui_store  # noqa: E402
from app.schemas.a2ui import A2UIActionIn  # noqa: E402
from app.services.a2ui_actions import (  # noqa: E402
    clear_idempotency_cache,
    dispatch_action,
)


def test_get_a2ui_catalog() -> None:
    with TestClient(app) as client:
        res = client.get("/api/agent/a2ui/catalog")
        assert res.status_code == 200
        body = res.json()
        assert body["catalogId"] == CATALOG_ID
        assert body["version"] == CATALOG_VERSION
        assert body["protocolVersion"] == A2UI_PROTOCOL_VERSION
        assert body["componentSchemas"] == COMPONENT_SCHEMAS
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
            reused = client.post(
                "/api/agent/actions",
                json={
                    **payload,
                    "action": {
                        **payload["action"],
                        "context": {
                            **payload["action"]["context"],
                            "params": {"userName": "different"},
                        },
                    },
                },
            )
        assert first.status_code == 200
        assert second.status_code == 200
        assert first.json()["ok"] is True
        assert second.json()["ok"] is True
        assert reused.status_code == 409
        assert reused.json()["detail"] == "IDEMPOTENCY_KEY_REUSED"
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


def test_preview_updates_existing_surface_and_confirm_merges_success_state() -> None:
    clear_idempotency_cache()
    config = MagicMock(
        parsedConfig={
            "kind": "api",
            "readOnly": False,
            "request": {"method": "POST", "path": "/user"},
        }
    )
    with TestClient(app) as client:
        session_id = client.post("/api/agent/sessions", json={}).json()["sessionId"]
        base = {
            "conversationId": session_id,
            "surfaceId": "write_merge_surface",
            "action": {
                "name": "interface.write.preview",
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
            new=AsyncMock(return_value={"ok": True}),
        ):
            first = client.post(
                "/api/agent/actions", json={**base, "idempotencyKey": "idem-merge-001"}
            )
            second = client.post(
                "/api/agent/actions", json={**base, "idempotencyKey": "idem-merge-002"}
            )
            confirm = client.post(
                "/api/agent/actions",
                json={
                    **base,
                    "idempotencyKey": "idem-merge-003",
                    "action": {**base["action"], "name": "interface.write.confirm"},
                },
            )

    assert len(first.json()["a2uiMessages"]) == 3
    assert len(second.json()["a2uiMessages"]) == 2
    assert "createSurface" not in second.json()["a2uiMessages"][0]
    success = confirm.json()["a2uiMessages"][0]["updateComponents"]["components"][0]
    assert success == {
        "id": "confirm",
        "component": "AiAlert",
        "text": "写操作已执行",
        "tone": "success",
    }
    with get_connection() as conn:
        stored = a2ui_store.get_surface(conn, "write_merge_surface")
    components = json.loads(stored["component_json"])
    assert components["root"]["component"] == "AiCard"
    assert components["confirm"] == success


def test_concurrent_confirm_with_same_key_executes_once() -> None:
    clear_idempotency_cache()
    config = MagicMock(
        parsedConfig={
            "kind": "api",
            "readOnly": False,
            "request": {"method": "POST", "path": "/user"},
        }
    )
    with TestClient(app) as client:
        session_id = client.post("/api/agent/sessions", json={}).json()["sessionId"]
    payload = A2UIActionIn(
        conversationId=session_id,
        surfaceId="concurrent-surface",
        idempotencyKey="idem-concurrent-001",
        action={
            "name": "interface.write.confirm",
            "context": {
                "projectCode": "demo",
                "interfaceCode": "user_create",
                "params": {"name": "A"},
            },
        },
    )

    async def run() -> tuple:
        async def delayed_execute(**_: object) -> dict:
            await asyncio.sleep(0.02)
            return {"ok": True}

        executor = AsyncMock(side_effect=delayed_execute)
        with patch(
            "app.services.a2ui_actions.admin_client.get_interface_config",
            new=AsyncMock(return_value=config),
        ), patch(
            "app.services.a2ui_actions.interface_executor.execute_interface",
            new=executor,
        ):
            results = await asyncio.gather(dispatch_action(payload), dispatch_action(payload))
        return results, executor

    results, executor = asyncio.run(run())
    assert results[0] == results[1]
    assert executor.await_count == 1


def test_action_cannot_update_a_surface_from_another_session() -> None:
    clear_idempotency_cache()
    config = MagicMock(
        parsedConfig={
            "kind": "api",
            "readOnly": False,
            "request": {"method": "POST", "path": "/user"},
        }
    )
    with TestClient(app) as client:
        owner = client.post("/api/agent/sessions", json={}).json()["sessionId"]
        attacker = client.post("/api/agent/sessions", json={}).json()["sessionId"]
        with get_connection() as conn:
            a2ui_store.upsert_surface(
                conn,
                surface_id="owned-surface",
                session_id=owner,
                component_json={"root": {"id": "root", "component": "AiCard", "children": []}},
            )
        with patch(
            "app.services.a2ui_actions.admin_client.get_interface_config",
            new=AsyncMock(return_value=config),
        ):
            response = client.post(
                "/api/agent/actions",
                json={
                    "conversationId": attacker,
                    "surfaceId": "owned-surface",
                    "idempotencyKey": "idem-cross-session-001",
                    "action": {
                        "name": "interface.write.preview",
                        "context": {
                            "projectCode": "demo",
                            "interfaceCode": "user_create",
                            "params": {},
                        },
                    },
                },
            )
    assert response.status_code == 404
    assert response.json()["detail"] == "A2UI_SURFACE_NOT_FOUND"
