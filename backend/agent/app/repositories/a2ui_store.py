import json
import sqlite3
from typing import Any, Optional


def upsert_surface(
    conn: sqlite3.Connection,
    *,
    surface_id: str,
    session_id: str,
    message_id: str = "",
    catalog_version: str = "",
    component_json: Optional[dict[str, Any]] = None,
    data_model_json: Optional[dict[str, Any]] = None,
    status: str = "ready",
) -> None:
    conn.execute(
        """
        INSERT INTO agent_surfaces(
            surface_id, session_id, message_id, catalog_version,
            component_json, data_model_json, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(surface_id) DO UPDATE SET
            message_id = excluded.message_id,
            catalog_version = excluded.catalog_version,
            component_json = excluded.component_json,
            data_model_json = excluded.data_model_json,
            status = excluded.status,
            update_time = CURRENT_TIMESTAMP
        """,
        (
            surface_id,
            session_id,
            message_id,
            catalog_version,
            json.dumps(component_json or {}, ensure_ascii=False, separators=(",", ":")),
            json.dumps(data_model_json or {}, ensure_ascii=False, separators=(",", ":")),
            status,
        ),
    )


def list_surfaces(conn: sqlite3.Connection, session_id: str) -> list[dict]:
    rows = conn.execute(
        """
        SELECT * FROM agent_surfaces
        WHERE session_id = ?
        ORDER BY id ASC
        """,
        (session_id,),
    ).fetchall()
    return [dict(row) for row in rows]


def get_action_by_idempotency(
    conn: sqlite3.Connection, idempotency_key: str
) -> Optional[dict]:
    if not idempotency_key:
        return None
    row = conn.execute(
        """
        SELECT * FROM agent_action_logs
        WHERE idempotency_key = ?
        LIMIT 1
        """,
        (idempotency_key,),
    ).fetchone()
    return dict(row) if row else None


def save_action_log(
    conn: sqlite3.Connection,
    *,
    session_id: str,
    surface_id: str,
    action_name: str,
    request_context: dict[str, Any],
    execution_result: dict[str, Any],
    idempotency_key: str = "",
    operator_id: str = "",
) -> None:
    conn.execute(
        """
        INSERT INTO agent_action_logs(
            session_id, surface_id, action_name, request_context,
            execution_result, idempotency_key, operator_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            session_id,
            surface_id,
            action_name,
            json.dumps(request_context, ensure_ascii=False, separators=(",", ":")),
            json.dumps(execution_result, ensure_ascii=False, separators=(",", ":")),
            idempotency_key,
            operator_id,
        ),
    )
