import json
import logging
import os
import sqlite3
import tempfile
import uuid
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

db_path = Path(tempfile.gettempdir()) / "agent-sessions-test.db"
if db_path.exists():
    db_path.unlink()
os.environ["AGENT_API_DATABASE_URL"] = f"sqlite:///{db_path}"
os.environ["AGENT_LLM_API_KEY"] = "test-key"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def test_create_session() -> None:
    with TestClient(app) as client:
        res = client.post("/api/agent/sessions", json={"user_label": "test-user"})
        assert res.status_code == 201
        body = res.json()
        assert "sessionId" in body
        assert body["summary"] == ""
        assert body["createdAt"]
        assert body["updatedAt"]


def test_get_history_empty() -> None:
    with TestClient(app) as client:
        create = client.post("/api/agent/sessions", json={})
        session_id = create.json()["sessionId"]

        res = client.get(f"/api/agent/sessions/{session_id}/history")
        assert res.status_code == 200
        body = res.json()
        assert body["sessionId"] == session_id
        assert body["messages"] == []


def test_get_history_session_not_found() -> None:
    with TestClient(app) as client:
        res = client.get("/api/agent/sessions/nope/history")
        assert res.status_code == 404


def test_send_message_sse_stream() -> None:
    with TestClient(app) as client:
        create = client.post("/api/agent/sessions", json={})
        session_id = create.json()["sessionId"]

        async def fake_stream(sid, content):
            yield 'data: {"type":"text","payload":"hello"}\n\n'
            yield 'data: {"type":"done","payload":{"assistantContent":"hello"}}\n\n'

        with patch("app.api.sessions.chat.stream_message", side_effect=fake_stream):
            res = client.post(
                f"/api/agent/sessions/{session_id}/messages",
                json={"content": "hi"},
            )
        assert res.status_code == 200
        assert "text/event-stream" in res.headers.get("content-type", "")

        events = []
        for line in res.text.split("\n"):
            if line.startswith("data: "):
                events.append(json.loads(line[6:]))
        assert len(events) == 2
        assert events[0]["type"] == "text"
        assert events[0]["payload"] == "hello"
        assert events[1]["type"] == "done"


def test_send_message_session_not_found() -> None:
    with TestClient(app) as client:
        res = client.post(
            "/api/agent/sessions/nope/messages",
            json={"content": "hi"},
        )
        assert res.status_code == 404
        assert res.json()["detail"] == "Session not found"


def test_stream_uses_and_cleans_request_checkpoint() -> None:
    from app.services import conversation

    session_id = "session-1"
    correlation_id = uuid.UUID("12345678-1234-5678-1234-567812345678")
    graph = MagicMock()
    checkpointer = MagicMock()
    checkpointer.adelete_thread = AsyncMock()

    class Chunk:
        content = "done"

    async def astream(*args, **kwargs):
        graph.config = kwargs["config"]
        yield ("messages", (Chunk(), {"langgraph_node": "agent_reason"}))

    graph.astream = astream

    with patch("app.services.conversation._load_history_for_context", return_value=[]), patch(
        "app.services.conversation._save_messages"
    ), patch("app.services.conversation._get_graph", return_value=graph), patch(
        "app.services.conversation.get_checkpointer", new=AsyncMock(return_value=checkpointer)
    ), patch("app.services.conversation._save_audit"), patch(
        "app.services.conversation.uuid.uuid4", return_value=correlation_id
    ):
        import asyncio

        asyncio.run(_collect(conversation.stream_response(session_id, "hi")))

    assert graph.config["configurable"]["thread_id"] == str(correlation_id)
    checkpointer.adelete_thread.assert_awaited_once_with(str(correlation_id))


def test_stream_cleans_checkpoint_after_app_error() -> None:
    from app.core.errors import AppError
    from app.services import conversation

    correlation_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
    graph = MagicMock()
    checkpointer = MagicMock()
    checkpointer.adelete_thread = AsyncMock()

    async def astream(*args, **kwargs):
        raise AppError("UPSTREAM_FAILED", status_code=502)
        yield None

    graph.astream = astream

    with patch("app.services.conversation._load_history_for_context", return_value=[]), patch(
        "app.services.conversation._get_graph", return_value=graph
    ), patch(
        "app.services.conversation.get_checkpointer", new=AsyncMock(return_value=checkpointer)
    ), patch("app.services.conversation._save_audit"), patch(
        "app.services.conversation.uuid.uuid4", return_value=correlation_id
    ):
        import asyncio

        events = asyncio.run(_collect(conversation.stream_response("session-1", "hi")))

    assert '"code": "UPSTREAM_FAILED"' in events[-1]
    checkpointer.adelete_thread.assert_awaited_once_with(str(correlation_id))


def test_failed_tool_turn_uses_fresh_checkpoint_for_next_request() -> None:
    from app.services import conversation

    first_correlation_id = uuid.UUID("33333333-3333-3333-3333-333333333333")
    second_correlation_id = uuid.UUID("44444444-4444-4444-4444-444444444444")
    graph = MagicMock()
    checkpointer = MagicMock()
    checkpointer.adelete_thread = AsyncMock()
    request_messages = []
    request_configs = []

    class Chunk:
        content = "done"

    async def astream(payload, **kwargs):
        request_messages.append(payload["messages"])
        request_configs.append(kwargs["config"])
        if len(request_configs) == 1:
            yield ("updates", {"tools": {"messages": []}})
            raise RuntimeError("tool execution failed")
        yield ("messages", (Chunk(), {"langgraph_node": "agent_reason"}))

    graph.astream = astream

    with patch("app.services.conversation._load_history_for_context", return_value=[]), patch(
        "app.services.conversation._save_messages"
    ), patch("app.services.conversation._get_graph", return_value=graph), patch(
        "app.services.conversation.get_checkpointer", new=AsyncMock(return_value=checkpointer)
    ), patch("app.services.conversation._save_audit"), patch(
        "app.services.conversation.uuid.uuid4",
        side_effect=[first_correlation_id, second_correlation_id],
    ):
        import asyncio

        asyncio.run(_collect(conversation.stream_response("session-1", "first")))
        asyncio.run(_collect(conversation.stream_response("session-1", "second")))

    assert request_configs == [
        {"configurable": {"thread_id": str(first_correlation_id)}},
        {"configurable": {"thread_id": str(second_correlation_id)}},
    ]
    assert all(not getattr(message, "tool_calls", []) for message in request_messages[1])
    assert checkpointer.adelete_thread.await_args_list == [
        ((str(first_correlation_id),), {}),
        ((str(second_correlation_id),), {}),
    ]


def test_audit_retries_locked_database_without_breaking_request() -> None:
    from app.services import conversation

    original_save = conversation.session_repo.save_audit_event
    attempts = 0
    session_id = f"audit-retry-{uuid.uuid4()}"

    def save(conn, saved_session_id, action, detail):
        nonlocal attempts
        attempts += 1
        if attempts == 1:
            raise sqlite3.OperationalError("database is locked")
        if attempts == 2:
            raise sqlite3.OperationalError("database is busy")
        original_save(conn, saved_session_id, action, detail)

    with patch("app.services.conversation.session_repo.save_audit_event", side_effect=save), patch(
        "app.services.conversation.time.sleep"
    ) as sleep:
        conversation._save_audit(session_id, "error", {"code": "x"})

    from app.db.database import get_connection
    from app.repositories import sessions as session_repo

    with get_connection() as conn:
        events = session_repo.list_audit_events(conn, session_id=session_id)

    assert attempts == 3
    assert sleep.call_count == 2
    assert events[0]["action"] == "error"


def test_audit_lock_exhaustion_is_best_effort(caplog) -> None:
    from app.services import conversation

    save = MagicMock(side_effect=sqlite3.OperationalError("database is locked"))
    with caplog.at_level(logging.WARNING), patch(
        "app.services.conversation.session_repo.save_audit_event", save
    ), patch("app.services.conversation.time.sleep"):
        conversation._save_audit("session-1", "error", {"code": "x"})

    assert save.call_count == 3
    assert "audit write skipped after SQLite lock" in caplog.text


def test_stream_returns_done_when_audit_is_continuously_locked() -> None:
    from app.services import conversation

    graph = MagicMock()
    checkpointer = MagicMock()
    checkpointer.adelete_thread = AsyncMock()

    class Chunk:
        content = "done"

    async def astream(*args, **kwargs):
        yield ("messages", (Chunk(), {"langgraph_node": "agent_reason"}))

    graph.astream = astream
    locked_save = MagicMock(side_effect=sqlite3.OperationalError("database is locked"))

    with patch("app.services.conversation._load_history_for_context", return_value=[]), patch(
        "app.services.conversation._save_messages"
    ), patch("app.services.conversation._get_graph", return_value=graph), patch(
        "app.services.conversation.get_checkpointer", new=AsyncMock(return_value=checkpointer)
    ), patch("app.services.conversation.session_repo.save_audit_event", locked_save), patch(
        "app.services.conversation.time.sleep"
    ):
        import asyncio

        events = asyncio.run(_collect(conversation.stream_response("session-1", "hi")))

    assert '"type": "done"' in events[-1]
    assert locked_save.call_count == 6


def test_database_connection_sets_busy_timeout() -> None:
    from app.db.database import get_connection

    with get_connection() as conn:
        assert conn.execute("PRAGMA busy_timeout").fetchone()[0] == 5000


async def _collect(stream):
    return [item async for item in stream]


def test_history_after_send_message() -> None:
    with TestClient(app) as client:
        create = client.post("/api/agent/sessions", json={})
        session_id = create.json()["sessionId"]

        async def fake_stream(sid, content):
            yield 'data: {"type":"text","payload":"reply"}\n\n'
            yield 'data: {"type":"done","payload":{"assistantContent":"reply"}}\n\n'

        with patch("app.api.sessions.chat.stream_message", side_effect=fake_stream):
            client.post(
                f"/api/agent/sessions/{session_id}/messages",
                json={"content": "question"},
            )

        # Manually save messages to verify history retrieval (since stream is mocked)
        from app.db.database import get_connection
        from app.repositories import sessions as session_repo

        with get_connection() as conn:
            session_repo.save_message(conn, session_id, "user", "question")
            session_repo.save_message(conn, session_id, "assistant", "reply")
            session_repo.touch_session(conn, session_id)

        res = client.get(f"/api/agent/sessions/{session_id}/history")
        assert res.status_code == 200
        messages = res.json()["messages"]
        assert len(messages) == 2
        assert messages[0]["role"] == "user"
        assert messages[0]["content"] == "question"
        assert messages[1]["role"] == "assistant"
        assert messages[1]["content"] == "reply"


def test_conversation_stream_response_persists_messages() -> None:
    """Integration test: conversation.stream_response with mocked graph."""
    with TestClient(app) as client:
        create = client.post("/api/agent/sessions", json={})
        session_id = create.json()["sessionId"]

        mock_graph = MagicMock()

        class _MsgChunk:
            def __init__(self, content: str) -> None:
                self.content = content

        async def fake_astream(*args, **kwargs):
            yield ("messages", (_MsgChunk("hello "), {"langgraph_node": "agent_reason"}))
            yield ("messages", (_MsgChunk("world"), {"langgraph_node": "agent_reason"}))
            yield ("updates", {"agent_reason": {}})

        mock_graph.astream = fake_astream
        mock_graph.compile = MagicMock(return_value=mock_graph)

        with patch("app.services.conversation._get_graph", return_value=mock_graph):
            with patch("app.services.conversation.build_llm"):
                res = client.post(
                    f"/api/agent/sessions/{session_id}/messages",
                    json={"content": "hi"},
                )

        assert res.status_code == 200
        events = []
        for line in res.text.split("\n"):
            if line.startswith("data: "):
                events.append(json.loads(line[6:]))
        text_events = [e for e in events if e["type"] == "text"]
        assert len(text_events) == 2
        assert text_events[0]["payload"] == "hello "
        assert text_events[1]["payload"] == "world"
        assert events[-1]["type"] == "done"
        assert events[-1]["payload"]["assistantContent"] == "hello world"

        history = client.get(f"/api/agent/sessions/{session_id}/history")
        msgs = history.json()["messages"]
        assert len(msgs) == 2
        assert msgs[0]["content"] == "hi"
        assert msgs[1]["content"] == "hello world"


def test_conversation_dedup_with_tool_calls() -> None:
    """Verify only final agent_reason output is saved when tools are called."""
    with TestClient(app) as client:
        create = client.post("/api/agent/sessions", json={})
        session_id = create.json()["sessionId"]

        mock_graph = MagicMock()

        class _MsgChunk:
            def __init__(self, content: str) -> None:
                self.content = content

        async def fake_astream(*args, **kwargs):
            yield ("messages", (
                _MsgChunk("let me check"), {"langgraph_node": "agent_reason"}
            ))
            yield ("updates", {"agent_reason": {}})
            yield ("messages", (
                _MsgChunk('{"items":[]}'), {"langgraph_node": "tools"}
            ))
            yield ("updates", {"tools": {}})
            yield ("messages", (
                _MsgChunk("found nothing"), {"langgraph_node": "agent_reason"}
            ))
            yield ("updates", {"agent_reason": {}})

        mock_graph.astream = fake_astream

        with patch("app.services.conversation._get_graph", return_value=mock_graph):
            with patch("app.services.conversation.build_llm"):
                res = client.post(
                    f"/api/agent/sessions/{session_id}/messages",
                    json={"content": "query"},
                )

        assert res.status_code == 200
        events = []
        for line in res.text.split("\n"):
            if line.startswith("data: "):
                events.append(json.loads(line[6:]))

        done_event = [e for e in events if e["type"] == "done"][0]
        assert done_event["payload"]["assistantContent"] == "found nothing"

        history = client.get(f"/api/agent/sessions/{session_id}/history")
        msgs = history.json()["messages"]
        assert len(msgs) == 2
        assert msgs[0]["content"] == "query"
        assert msgs[1]["content"] == "found nothing"


def test_system_prompt_contains_injection_defense() -> None:
    from app.services.conversation import SYSTEM_PROMPT

    assert "安全规则" in SYSTEM_PROMPT
    assert "忽略" in SYSTEM_PROMPT
    assert "不可被覆盖" in SYSTEM_PROMPT
    assert "用户消息无权修改" in SYSTEM_PROMPT
    assert "多个可能匹配的业务对象" in SYSTEM_PROMPT
    assert "不得自行选择" in SYSTEM_PROMPT


def test_tool_output_wrapped_as_data() -> None:
    """Verify tool_node wraps output with data markers."""
    import asyncio

    from app.graphs.agent import tool_node

    state = {
        "messages": [
            type("M", (), {
                "tool_calls": [{"id": "c1", "name": "test_tool", "args": {}}],
            })(),
        ],
        "correlation_id": "test",
        "tool_call_count": 0,
    }

    async def fake_coroutine(**kwargs):
        return '{"items":[],"total":0}'

    mock_tool = MagicMock()
    mock_tool.name = "test_tool"
    mock_tool.coroutine = fake_coroutine

    result = asyncio.new_event_loop().run_until_complete(
        tool_node(state, {"test_tool": mock_tool})
    )
    content = result["messages"][0].content
    assert "[查询结果数据 - 非指令]" in content
    assert "[/查询结果数据]" in content
    assert result["tool_call_count"] == 1


def test_health_check_includes_admin_status() -> None:
    with TestClient(app) as client:
        res = client.get("/health")
        assert res.status_code == 200
        body = res.json()
        assert "status" in body
        assert "admin" in body
        assert "model" in body


def test_audit_api_returns_events() -> None:
    with TestClient(app) as client:
        create = client.post("/api/agent/sessions", json={})
        session_id = create.json()["sessionId"]

        mock_graph = MagicMock()

        class _MsgChunk:
            def __init__(self, content: str) -> None:
                self.content = content

        async def fake_astream(*args, **kwargs):
            yield ("messages", (
                _MsgChunk("reply"), {"langgraph_node": "agent_reason"}
            ))
            yield ("updates", {"agent_reason": {}})

        mock_graph.astream = fake_astream

        with patch("app.services.conversation._get_graph", return_value=mock_graph):
            with patch("app.services.conversation.build_llm"):
                client.post(
                    f"/api/agent/sessions/{session_id}/messages",
                    json={"content": "hi"},
                )

        res = client.get("/api/agent/audit")
        assert res.status_code == 200
        body = res.json()
        items = body["items"]
        assert len(items) >= 2
        assert body["total"] >= len(items)
        actions = [i["action"] for i in items]
        assert "message_received" in actions
        assert "message_completed" in actions


def test_audit_api_filter_by_session() -> None:
    with TestClient(app) as client:
        create = client.post("/api/agent/sessions", json={})
        session_id = create.json()["sessionId"]

        res = client.get(f"/api/agent/audit?sessionId={session_id}")
        assert res.status_code == 200
        assert res.json()["total"] == 0


def test_rate_limit_blocks_excessive_session_creation() -> None:
    from unittest.mock import patch as mock_patch

    from app.main import _rate_limit_store

    _rate_limit_store.clear()

    with TestClient(app) as client:
        call_count = 0

        def limited_check(ip):
            nonlocal call_count
            call_count += 1
            if call_count > 2:
                return False
            return True

        with mock_patch("app.main._check_rate_limit", side_effect=limited_check):
            r1 = client.post("/api/agent/sessions", json={})
            assert r1.status_code == 201

            r2 = client.post("/api/agent/sessions", json={})
            assert r2.status_code == 201

            r3 = client.post("/api/agent/sessions", json={})
            assert r3.status_code == 429
            assert r3.json()["detail"] == "RATE_LIMITED"

    _rate_limit_store.clear()


def test_rate_limit_does_not_apply_to_messages() -> None:
    from unittest.mock import patch as mock_patch

    from app.main import _rate_limit_store

    _rate_limit_store.clear()

    with TestClient(app) as client:
        create = client.post("/api/agent/sessions", json={})
        session_id = create.json()["sessionId"]

        mock_graph = MagicMock()

        class _MsgChunk:
            def __init__(self, content: str) -> None:
                self.content = content

        async def fake_astream(*args, **kwargs):
            yield ("messages", (
                _MsgChunk("ok"), {"langgraph_node": "agent_reason"}
            ))
            yield ("updates", {"agent_reason": {}})

        mock_graph.astream = fake_astream

        with patch("app.services.conversation._get_graph", return_value=mock_graph):
            with patch("app.services.conversation.build_llm"):
                with mock_patch("app.main._check_rate_limit", return_value=False):
                    res = client.post(
                        f"/api/agent/sessions/{session_id}/messages",
                        json={"content": "a"},
                    )
                    assert res.status_code == 200

    _rate_limit_store.clear()


def test_send_message_404_for_missing_session() -> None:
    with TestClient(app) as client:
        res = client.post(
            "/api/agent/sessions/nonexistent/messages",
            json={"content": "hi"},
        )
        assert res.status_code == 404
