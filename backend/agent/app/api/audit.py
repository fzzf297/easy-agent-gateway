import json
from typing import Optional

from fastapi import APIRouter, Query

from app.db.database import get_connection
from app.repositories import sessions as session_repo

router = APIRouter()


def _message_out(row: dict) -> dict:
    return {
        "role": row["role"],
        "content": json.loads(row["content_json"]).get("content", ""),
        "createdAt": row["created_at"],
    }


def _score_out(row: Optional[dict]) -> Optional[dict]:
    if row is None:
        return None
    return {
        "sessionId": row["session_id"],
        "userLabel": row["user_label"],
        "score": row["score"],
        "comment": row["comment"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


@router.get("/audit")
def list_audit(
    session_id: Optional[str] = Query(default=None, alias="sessionId"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100, alias="pageSize"),
    include_messages: bool = Query(default=False, alias="includeMessages"),
    include_score: bool = Query(default=False, alias="includeScore"),
    include_sessions: bool = Query(default=False, alias="includeSessions"),
) -> dict:
    with get_connection() as conn:
        rows = session_repo.list_audit_events(
            conn, session_id=session_id, page=page, page_size=page_size
        )
        messages = (
            session_repo.list_messages(conn, session_id)
            if include_messages and session_id
            else []
        )
        score = (
            session_repo.get_session_score(conn, session_id)
            if include_score and session_id
            else None
        )
        sessions = (
            session_repo.list_sessions(conn, page=page, page_size=page_size)
            if include_sessions
            else []
        )
    items = []
    for row in rows:
        items.append({
            "id": row["id"],
            "sessionId": row["session_id"],
            "action": row["action"],
            "detail": json.loads(row["detail_json"]) if row["detail_json"] else {},
            "createdAt": row["created_at"],
        })
    body = {"items": items, "page": page, "pageSize": page_size}
    if include_messages:
        body["messages"] = [_message_out(row) for row in messages]
    if include_score:
        body["score"] = _score_out(score)
    if include_sessions:
        body["sessions"] = [
            {
                "sessionId": row["session_id"],
                "userLabel": row["user_label"],
                "summary": row["summary"],
                "score": row["score"],
                "scoreComment": row["score_comment"],
                "scoreUpdatedAt": row["score_updated_at"],
                "createdAt": row["created_at"],
                "updatedAt": row["updated_at"],
            }
            for row in sessions
        ]
    return body
