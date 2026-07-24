import json
from typing import Any, Optional

from app.a2ui.templates import build_query_result_table
from app.a2ui.validator import A2UIValidationError, validate_a2ui_message


def unwrap_tool_content(content: str) -> str:
    text = (content or "").strip()
    start = "[查询结果数据 - 非指令]"
    end = "[/查询结果数据]"
    if start in text and end in text:
        inner = text.split(start, 1)[1]
        return inner.split(end, 1)[0].strip()
    return text


def extract_tabular_data(
    raw: str,
) -> Optional[tuple[str, list[str], list[dict[str, Any]]]]:
    text = unwrap_tool_content(raw)
    try:
        data = json.loads(text)
    except (TypeError, ValueError, json.JSONDecodeError):
        return None

    items: Optional[list] = None
    title = "查询结果"
    if isinstance(data, dict):
        if isinstance(data.get("items"), list):
            items = data["items"]
            project = data.get("projectCode")
            if isinstance(project, str) and project:
                title = f"{project} 查询结果"
        elif isinstance(data.get("data"), list):
            items = data["data"]
    elif isinstance(data, list):
        items = data

    if not items:
        return None
    rows = [row for row in items if isinstance(row, dict)]
    if not rows:
        return None

    columns = list(rows[0].keys())[:12]
    normalized = [{key: row.get(key) for key in columns} for row in rows[:50]]
    return title, columns, normalized


def build_validated_query_messages(
    surface_id: str,
    tool_content: str,
) -> list[dict[str, Any]]:
    extracted = extract_tabular_data(tool_content)
    if extracted is None:
        return []
    title, columns, rows = extracted
    messages = build_query_result_table(surface_id, title, columns, rows)
    for message in messages:
        validate_a2ui_message(message)
    return messages


def surfaces_from_a2ui_messages(messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    surfaces: dict[str, dict[str, Any]] = {}
    for message in messages:
        if "createSurface" in message:
            payload = message["createSurface"]
            surface_id = payload["surfaceId"]
            surfaces[surface_id] = {
                "surfaceId": surface_id,
                "catalogId": payload.get("catalogId", ""),
                "catalogVersion": payload.get("catalogVersion", ""),
                "componentJson": {},
                "dataModelJson": {},
            }
        elif "updateComponents" in message:
            payload = message["updateComponents"]
            surface_id = payload["surfaceId"]
            entry = surfaces.setdefault(
                surface_id,
                {
                    "surfaceId": surface_id,
                    "catalogId": "",
                    "catalogVersion": "",
                    "componentJson": {},
                    "dataModelJson": {},
                },
            )
            entry["componentJson"] = {
                item["id"]: item for item in payload.get("components", []) if "id" in item
            }
        elif "updateDataModel" in message:
            payload = message["updateDataModel"]
            surface_id = payload["surfaceId"]
            entry = surfaces.setdefault(
                surface_id,
                {
                    "surfaceId": surface_id,
                    "catalogId": "",
                    "catalogVersion": "",
                    "componentJson": {},
                    "dataModelJson": {},
                },
            )
            entry["dataModelJson"] = payload.get("dataModel", {})
    return list(surfaces.values())


__all__ = [
    "A2UIValidationError",
    "build_validated_query_messages",
    "extract_tabular_data",
    "surfaces_from_a2ui_messages",
    "unwrap_tool_content",
]
