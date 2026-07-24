import asyncio
import json
import os
import uuid
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

os.environ.setdefault("AGENT_LLM_API_KEY", "test-key")
os.environ.setdefault("AGENT_API_DATABASE_URL", f"sqlite:///{Path('/tmp') / 'agent-a2ui-sse.db'}")

from app.services import conversation  # noqa: E402


def _parse_events(chunks: list[str]) -> list[dict]:
    events = []
    for chunk in chunks:
        for line in chunk.split("\n"):
            if line.startswith("data: "):
                events.append(json.loads(line[6:]))
    return events


async def _collect(agen):
    return [chunk async for chunk in agen]


def test_stream_emits_text_and_text_delta_and_a2ui() -> None:
    session_id = "session-a2ui"
    correlation_id = uuid.UUID("12345678-1234-5678-1234-567812345678")
    graph = MagicMock()
    checkpointer = MagicMock()
    checkpointer.adelete_thread = AsyncMock()

    class TextChunk:
        content = "已为你列出项目"

    class ToolMsg:
        content = json.dumps(
            {
                "projectCode": "demo",
                "items": [{"code": "p1", "name": "项目1"}],
                "total": 1,
            },
            ensure_ascii=False,
        )

    async def astream(*args, **kwargs):
        yield ("messages", (TextChunk(), {"langgraph_node": "agent_reason"}))
        yield ("updates", {"tools": {"messages": [ToolMsg()]}})
        yield ("messages", (TextChunk(), {"langgraph_node": "agent_reason"}))

    graph.astream = astream
    saved = {}

    def fake_save(session_id, user_content, assistant_content, assistant_extra=None):
        saved["extra"] = assistant_extra
        saved["content"] = assistant_content

    with patch("app.services.conversation._load_history_for_context", return_value=[]), patch(
        "app.services.conversation._save_messages", side_effect=fake_save
    ), patch("app.services.conversation._get_graph", return_value=graph), patch(
        "app.services.conversation.get_checkpointer", new=AsyncMock(return_value=checkpointer)
    ), patch("app.services.conversation._save_audit"), patch(
        "app.services.conversation.uuid.uuid4", return_value=correlation_id
    ), patch(
        "app.services.conversation.build_context", new=AsyncMock(return_value={})
    ), patch("app.services.conversation.a2ui_store.upsert_surface"):
        chunks = asyncio.run(_collect(conversation.stream_response(session_id, "查看项目列表")))

    events = _parse_events(chunks)
    types = [e["type"] for e in events]
    assert "text" in types
    assert "text-delta" in types
    assert "a2ui-message" in types
    assert types[-1] == "done"
    done = events[-1]["payload"]
    assert done["responseMode"] == "TEXT_WITH_A2UI"
    assert done["surfaceIds"]
    assert saved["extra"]["responseMode"] == "TEXT_WITH_A2UI"


def test_stream_skips_a2ui_when_intent_is_text() -> None:
    session_id = "session-text"
    correlation_id = uuid.UUID("22345678-1234-5678-1234-567812345678")
    graph = MagicMock()
    checkpointer = MagicMock()
    checkpointer.adelete_thread = AsyncMock()

    class TextChunk:
        content = "你好"

    async def astream(*args, **kwargs):
        yield ("messages", (TextChunk(), {"langgraph_node": "agent_reason"}))

    graph.astream = astream

    with patch("app.services.conversation._load_history_for_context", return_value=[]), patch(
        "app.services.conversation._save_messages"
    ) as save_mock, patch("app.services.conversation._get_graph", return_value=graph), patch(
        "app.services.conversation.get_checkpointer", new=AsyncMock(return_value=checkpointer)
    ), patch("app.services.conversation._save_audit"), patch(
        "app.services.conversation.uuid.uuid4", return_value=correlation_id
    ):
        chunks = asyncio.run(_collect(conversation.stream_response(session_id, "你好")))

    events = _parse_events(chunks)
    assert all(e["type"] != "a2ui-message" for e in events)
    assert events[-1]["payload"]["responseMode"] == "TEXT"
    assert save_mock.call_args.kwargs["assistant_extra"]["responseMode"] == "TEXT"
