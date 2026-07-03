import json
import uuid
from typing import Optional

from fastapi import APIRouter, Header

from app.core.errors import NotFoundError
from app.db.database import get_connection
from app.repositories import sessions as session_repo
from app.schemas.session import (
    CreateSessionIn,
    HistoryOut,
    MessageOut,
    SendMessageIn,
    SessionOut,
    SessionScoreIn,
    SessionScoreOut,
)
from app.services.conversation import stream_response
from app.services.event_buffer import replay_then_stream, store_event

router = APIRouter()


def _to_session_out(row: dict) -> SessionOut:
    return SessionOut(
        sessionId=row["session_id"],
        summary=row["summary"],
        createdAt=row["created_at"],
        updatedAt=row["updated_at"],
    )


def _require_session(session_id: str) -> dict:
    with get_connection() as conn:
        session = session_repo.get_session(conn, session_id)
    if session is None:
        raise NotFoundError("Session not found")
    return session


def _to_score_out(row: dict) -> SessionScoreOut:
    return SessionScoreOut(
        sessionId=row["session_id"],
        userLabel=row["user_label"],
        score=row["score"],
        comment=row["comment"],
        createdAt=row["created_at"],
        updatedAt=row["updated_at"],
    )


@router.post("/sessions", response_model=SessionOut, status_code=201)
def create_session(payload: CreateSessionIn) -> SessionOut:
    session_id = str(uuid.uuid4())
    with get_connection() as conn:
        row = session_repo.create_session(conn, session_id, payload.user_label)
    return _to_session_out(row)


@router.get("/sessions/{session_id}/history", response_model=HistoryOut)
def get_history(session_id: str) -> HistoryOut:
    _require_session(session_id)
    with get_connection() as conn:
        rows = session_repo.list_messages(conn, session_id)
    messages = []
    for row in rows:
        content = json.loads(row["content_json"]).get("content", "")
        messages.append(
            MessageOut(role=row["role"], content=content, createdAt=row["created_at"])
        )
    return HistoryOut(sessionId=session_id, messages=messages)


@router.put("/sessions/{session_id}/score", response_model=SessionScoreOut)
def score_session(session_id: str, payload: SessionScoreIn) -> SessionScoreOut:
    session = _require_session(session_id)
    with get_connection() as conn:
        row = session_repo.upsert_session_score(
            conn,
            session_id,
            session["user_label"],
            payload.score,
            payload.comment,
        )
        session_repo.save_audit_event(
            conn,
            session_id,
            "session_scored",
            {"score": payload.score, "has_comment": bool(payload.comment)},
        )
    return _to_score_out(row)


async def _buffered_stream(session_id: str, content: str):
    async for sse_line in stream_response(session_id, content):
        event_id = ""
        for line in sse_line.split("\n"):
            if line.startswith("id: "):
                event_id = line[4:]
        if event_id:
            store_event(session_id, event_id, sse_line)
        yield sse_line


@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: str,
    payload: SendMessageIn,
    last_event_id: Optional[str] = Header(default=None, alias="Last-Event-ID"),
):
    from fastapi.responses import StreamingResponse

    _require_session(session_id)
    raw_stream = _buffered_stream(session_id, payload.content)
    return StreamingResponse(
        replay_then_stream(session_id, last_event_id, raw_stream),
        media_type="text/event-stream",
    )
