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
            message_id = CASE
                WHEN excluded.message_id != '' THEN excluded.message_id
                ELSE agent_surfaces.message_id
            END,
            catalog_version = CASE
                WHEN excluded.catalog_version != '' THEN excluded.catalog_version
                ELSE agent_surfaces.catalog_version
            END,
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


def get_surface(
    conn: sqlite3.Connection, surface_id: str, session_id: str = ""
) -> Optional[dict]:
    if session_id:
        row = conn.execute(
            "SELECT * FROM agent_surfaces WHERE surface_id = ? AND session_id = ? LIMIT 1",
            (surface_id, session_id),
        ).fetchone()
    else:
        row = conn.execute(
            "SELECT * FROM agent_surfaces WHERE surface_id = ? LIMIT 1",
            (surface_id,),
        ).fetchone()
    return dict(row) if row else None


def apply_messages(
    conn: sqlite3.Connection,
    *,
    session_id: str,
    messages: list[dict[str, Any]],
    message_id: str = "",
) -> None:
    from app.a2ui.catalog import CATALOG_VERSION
    from app.a2ui.surface_builder import apply_data_model_update

    for message in messages:
        operation = next(
            (
                key
                for key in (
                    "createSurface",
                    "updateComponents",
                    "updateDataModel",
                    "deleteSurface",
                )
                if key in message
            ),
            None,
        )
        if operation is None:
            continue
        payload = message[operation]
        surface_id = payload.get("surfaceId", "")
        if not surface_id:
            continue
        existing = get_surface(conn, surface_id)
        if existing and existing.get("session_id") != session_id:
            raise ValueError("surfaceId belongs to another session")
        component_json = _read_json(existing, "component_json")
        data_model_json = _read_json(existing, "data_model_json")
        status = existing.get("status", "ready") if existing else "ready"

        if operation == "createSurface":
            status = "ready"
        elif operation == "updateComponents":
            for component in payload.get("components", []):
                component_id = component.get("id")
                if component_id:
                    component_json[component_id] = component
            status = "ready"
        elif operation == "updateDataModel":
            data_model_json = apply_data_model_update(
                data_model_json,
                payload.get("path", "/"),
                payload.get("value"),
                has_value="value" in payload,
            )
            status = "ready"
        elif operation == "deleteSurface":
            status = "deleted"

        upsert_surface(
            conn,
            surface_id=surface_id,
            session_id=session_id,
            message_id=message_id,
            catalog_version=CATALOG_VERSION,
            component_json=component_json,
            data_model_json=data_model_json,
            status=status,
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


def _read_json(row: Optional[dict], key: str) -> dict[str, Any]:
    if not row:
        return {}
    raw = row.get(key) or "{}"
    if isinstance(raw, dict):
        return dict(raw)
    parsed = json.loads(raw)
    return parsed if isinstance(parsed, dict) else {}


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
