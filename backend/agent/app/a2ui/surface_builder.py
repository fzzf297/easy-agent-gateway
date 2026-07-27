import json
from copy import deepcopy
from typing import Any, Optional

from app.a2ui.catalog import A2UI_PROTOCOL_VERSION, CATALOG_ID, CATALOG_VERSION
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
                "catalogVersion": CATALOG_VERSION,
                "componentJson": {},
                "dataModelJson": {},
                "status": "ready",
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
            component_json = entry.setdefault("componentJson", {})
            for item in payload.get("components", []):
                if "id" in item:
                    component_json[item["id"]] = item
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
            entry["dataModelJson"] = apply_data_model_update(
                entry.get("dataModelJson") or {},
                payload.get("path", "/"),
                payload.get("value"),
                has_value="value" in payload,
            )
        elif "deleteSurface" in message:
            payload = message["deleteSurface"]
            surface_id = payload["surfaceId"]
            entry = surfaces.setdefault(
                surface_id,
                {
                    "surfaceId": surface_id,
                    "catalogId": CATALOG_ID,
                    "catalogVersion": CATALOG_VERSION,
                    "componentJson": {},
                    "dataModelJson": {},
                },
            )
            entry["status"] = "deleted"
    return list(surfaces.values())


def apply_data_model_update(
    current: Any,
    path: str,
    value: Any,
    *,
    has_value: bool = True,
) -> Any:
    if path in {"", "/"}:
        return value if has_value else {}
    if not isinstance(current, (dict, list)):
        current = {}
    result = deepcopy(current)
    segments = [_decode_pointer_segment(item) for item in path.split("/")[1:]]
    if not segments:
        return value if has_value else {}
    target = result
    for index, segment in enumerate(segments[:-1]):
        next_segment = segments[index + 1]
        if isinstance(target, list):
            list_index = _require_list_index(segment, len(target))
            child = target[list_index]
            if not isinstance(child, (dict, list)):
                child = [] if next_segment.isdigit() else {}
                target[list_index] = child
        else:
            child = target.get(segment)
            if not isinstance(child, (dict, list)):
                child = [] if next_segment.isdigit() else {}
                target[segment] = child
        target = child
    last_segment = segments[-1]
    if isinstance(target, list):
        list_index = _require_list_index(last_segment, len(target))
        target[list_index] = value if has_value else None
        return result
    if has_value:
        target[last_segment] = value
    else:
        target.pop(last_segment, None)
    return result


def messages_from_surface_snapshot(surface: dict[str, Any]) -> list[dict[str, Any]]:
    if surface.get("status") == "deleted":
        return []
    surface_id = str(surface.get("surfaceId") or surface.get("surface_id") or "")
    if not surface_id:
        return []
    components = surface.get("componentJson")
    if components is None:
        components = surface.get("component_json")
    data_model = surface.get("dataModelJson")
    if data_model is None:
        data_model = surface.get("data_model_json")
    if isinstance(components, str):
        components = json.loads(components or "{}")
    if isinstance(data_model, str):
        data_model = json.loads(data_model or "{}")
    component_list = list((components or {}).values())
    if not any(item.get("id") == "root" for item in component_list if isinstance(item, dict)):
        return []
    return [
        {
            "version": A2UI_PROTOCOL_VERSION,
            "createSurface": {"surfaceId": surface_id, "catalogId": CATALOG_ID},
        },
        {
            "version": A2UI_PROTOCOL_VERSION,
            "updateComponents": {
                "surfaceId": surface_id,
                "components": component_list,
            },
        },
        {
            "version": A2UI_PROTOCOL_VERSION,
            "updateDataModel": {
                "surfaceId": surface_id,
                "path": "/",
                "value": data_model or {},
            },
        },
    ]


def _decode_pointer_segment(value: str) -> str:
    return value.replace("~1", "/").replace("~0", "~")


def _require_list_index(value: str, length: int) -> int:
    if not value.isdigit():
        raise A2UIValidationError("array data model path must use a numeric index")
    index = int(value)
    if index < 0 or index >= length:
        raise A2UIValidationError("array data model path index is out of range")
    return index


__all__ = [
    "A2UIValidationError",
    "build_validated_query_messages",
    "extract_tabular_data",
    "apply_data_model_update",
    "messages_from_surface_snapshot",
    "surfaces_from_a2ui_messages",
    "unwrap_tool_content",
]
