import json
import re
from typing import Any

from app.a2ui.catalog import (
    A2UI_PROTOCOL_VERSION,
    ALLOWED_TOP_KEYS,
    CATALOG_ID,
    COMPONENT_SCHEMAS,
    COMPONENTS,
    FORBIDDEN_FIELDS,
    MAX_COMPONENTS,
    MAX_DATA_MODEL_BYTES,
    MAX_DEPTH,
    MAX_TABLE_COLUMNS,
    MAX_TABLE_ROWS,
)


class A2UIValidationError(ValueError):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


def validate_a2ui_message(message: dict[str, Any]) -> None:
    if not isinstance(message, dict) or not message:
        raise A2UIValidationError("message must be a non-empty object")
    if message.get("version") != A2UI_PROTOCOL_VERSION:
        raise A2UIValidationError("version must be v0.9")

    operation_keys = [key for key in message if key in ALLOWED_TOP_KEYS]
    if len(operation_keys) != 1:
        raise A2UIValidationError("exactly one A2UI operation key is required")
    if set(message) != {"version", operation_keys[0]}:
        raise A2UIValidationError("unknown top-level keys")

    key = operation_keys[0]
    payload = message[key]
    if not isinstance(payload, dict):
        raise A2UIValidationError(f"{key} payload must be an object")

    if key == "createSurface":
        _validate_create_surface(payload)
    elif key == "updateComponents":
        _validate_update_components(payload)
    elif key == "updateDataModel":
        _validate_update_data_model(payload)
    elif key == "deleteSurface":
        _validate_delete_surface(payload)


def _require_surface_id(payload: dict[str, Any]) -> str:
    surface_id = payload.get("surfaceId")
    if not isinstance(surface_id, str) or not surface_id.strip():
        raise A2UIValidationError("surfaceId is required")
    if len(surface_id) > 128:
        raise A2UIValidationError("surfaceId is too long")
    return surface_id


def _validate_create_surface(payload: dict[str, Any]) -> None:
    _require_surface_id(payload)
    allowed = {"surfaceId", "catalogId", "theme", "sendDataModel"}
    _reject_unknown(payload, allowed, "createSurface")
    if payload.get("catalogId") != CATALOG_ID:
        raise A2UIValidationError("catalogId mismatch")
    if "sendDataModel" in payload and not isinstance(payload["sendDataModel"], bool):
        raise A2UIValidationError("sendDataModel must be a boolean")


def _validate_update_data_model(payload: dict[str, Any]) -> None:
    _require_surface_id(payload)
    _reject_unknown(payload, {"surfaceId", "path", "value"}, "updateDataModel")
    path = payload.get("path", "/")
    _validate_pointer(path, "data model path")
    if "value" in payload:
        try:
            encoded = json.dumps(payload["value"], ensure_ascii=False).encode("utf-8")
        except (TypeError, ValueError) as exc:
            raise A2UIValidationError("data model value must be JSON serializable") from exc
        if len(encoded) > MAX_DATA_MODEL_BYTES:
            raise A2UIValidationError("data model value is too large")


def _validate_delete_surface(payload: dict[str, Any]) -> None:
    _require_surface_id(payload)
    _reject_unknown(payload, {"surfaceId"}, "deleteSurface")


def _validate_update_components(payload: dict[str, Any]) -> None:
    _require_surface_id(payload)
    _reject_unknown(payload, {"surfaceId", "components"}, "updateComponents")
    components = payload.get("components")
    if not isinstance(components, list) or not components:
        raise A2UIValidationError("components must be a non-empty list")
    if len(components) > MAX_COMPONENTS:
        raise A2UIValidationError("too many components")

    by_id: dict[str, dict[str, Any]] = {}
    for item in components:
        if not isinstance(item, dict):
            raise A2UIValidationError("component must be an object")
        component_id = item.get("id")
        if not isinstance(component_id, str) or not component_id.strip():
            raise A2UIValidationError("component id is required")
        if component_id in by_id:
            raise A2UIValidationError(f"duplicate component id: {component_id}")
        name = item.get("component")
        if name not in COMPONENTS:
            raise A2UIValidationError(f"unknown component: {name}")
        forbidden = FORBIDDEN_FIELDS.intersection(item)
        if forbidden:
            raise A2UIValidationError(f"forbidden field: {sorted(forbidden)[0]}")
        _validate_component_properties(name, item)
        by_id[component_id] = item

    for item in by_id.values():
        children = item.get("children") or []
        if not isinstance(children, list):
            raise A2UIValidationError("children must be a list")
        for child_id in children:
            if not isinstance(child_id, str):
                raise A2UIValidationError("child component id must be a string")
            # Incremental component updates may reference an existing component that is
            # not repeated in the same message. Only reject missing refs for full roots.
            if item.get("id") == "root" and child_id not in by_id:
                raise A2UIValidationError(f"missing component ref: {child_id}")

    if "root" in by_id:
        _check_depth("root", by_id, 0, set())


def _validate_component_properties(name: str, item: dict[str, Any]) -> None:
    schema = COMPONENT_SCHEMAS[name]
    properties = schema["properties"]
    allowed = {"id", "component", *properties.keys()}
    unknown = set(item) - allowed
    if unknown:
        raise A2UIValidationError(f"unknown {name} field: {sorted(unknown)[0]}")
    for required in schema["required"]:
        if required not in item:
            raise A2UIValidationError(f"{name}.{required} is required")
    for prop, kind in properties.items():
        if prop in item:
            _validate_property(kind, item[prop], f"{name}.{prop}")


def _validate_property(kind: str, value: Any, field: str) -> None:
    if kind == "dynamicString":
        if not isinstance(value, str) and not _is_binding(value):
            raise A2UIValidationError(f"{field} must be a string or path binding")
        return
    if kind == "dynamicBoolean":
        if not isinstance(value, bool) and not _is_binding(value):
            raise A2UIValidationError(f"{field} must be a boolean or path binding")
        return
    if kind == "boolean":
        if not isinstance(value, bool):
            raise A2UIValidationError(f"{field} must be a boolean")
        return
    if kind == "children":
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            raise A2UIValidationError(f"{field} must be a component id list")
        return
    if kind == "textVariant":
        if value not in {"h1", "h2", "h3", "body", "caption"}:
            raise A2UIValidationError(f"{field} has an invalid variant")
        return
    if kind == "alertTone":
        if value not in {"info", "success", "warning", "error"}:
            raise A2UIValidationError(f"{field} has an invalid tone")
        return
    if kind == "inputType":
        if value not in {"text", "number", "password", "textarea"}:
            raise A2UIValidationError(f"{field} has an invalid input type")
        return
    if kind in {"previewAction", "confirmAction"}:
        expected = (
            {"interface.write.preview"}
            if kind == "previewAction"
            else {"interface.write.confirm"}
        )
        _validate_action(value, expected, field)
        return
    if kind == "options":
        if _is_binding(value):
            return
        if not isinstance(value, list):
            raise A2UIValidationError(f"{field} must be an option list or path binding")
        for option in value:
            if not isinstance(option, dict) or set(option) != {"label", "value"}:
                raise A2UIValidationError(f"{field} contains an invalid option")
            if not all(isinstance(option[key], str) for key in ("label", "value")):
                raise A2UIValidationError(f"{field} option values must be strings")
        return
    if kind == "columns":
        if _is_binding(value):
            return
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            raise A2UIValidationError(f"{field} must be a string list or path binding")
        if len(value) > MAX_TABLE_COLUMNS:
            raise A2UIValidationError("too many table columns")
        return
    if kind == "rows":
        if _is_binding(value):
            return
        if not isinstance(value, list) or not all(isinstance(item, dict) for item in value):
            raise A2UIValidationError(f"{field} must be an object list or path binding")
        if len(value) > MAX_TABLE_ROWS:
            raise A2UIValidationError("too many table rows")


def _validate_action(value: Any, expected_names: set[str], field: str) -> None:
    if not isinstance(value, dict) or set(value) != {"event"}:
        raise A2UIValidationError(f"{field} must contain one event")
    event = value["event"]
    if not isinstance(event, dict) or not set(event).issubset({"name", "context"}):
        raise A2UIValidationError(f"{field}.event is invalid")
    if event.get("name") not in expected_names:
        raise A2UIValidationError(f"{field}.event name is not allowed")
    context = event.get("context", {})
    if not isinstance(context, dict):
        raise A2UIValidationError(f"{field}.event context must be an object")
    for context_value in context.values():
        if not isinstance(context_value, (str, int, float, bool, list)) and not _is_binding(
            context_value
        ):
            raise A2UIValidationError(f"{field}.event context contains an invalid value")


def _is_binding(value: Any) -> bool:
    if not isinstance(value, dict) or set(value) != {"path"}:
        return False
    try:
        _validate_pointer(value.get("path"), "binding path")
    except A2UIValidationError:
        return False
    return True


def _validate_pointer(value: Any, field: str) -> None:
    if not isinstance(value, str) or not value.startswith("/") or len(value) > 512:
        raise A2UIValidationError(f"{field} must be a JSON Pointer")
    if re.search(r"~(?![01])", value):
        raise A2UIValidationError(f"{field} contains an invalid escape")


def _reject_unknown(payload: dict[str, Any], allowed: set[str], operation: str) -> None:
    unknown = set(payload) - allowed
    if unknown:
        raise A2UIValidationError(f"unknown {operation} field: {sorted(unknown)[0]}")


def _check_depth(
    component_id: str,
    by_id: dict[str, dict[str, Any]],
    depth: int,
    stack: set[str],
) -> None:
    if depth > MAX_DEPTH:
        raise A2UIValidationError("component tree too deep")
    if component_id in stack:
        raise A2UIValidationError("component cycle detected")
    stack.add(component_id)
    children = by_id[component_id].get("children") or []
    for child_id in children:
        if child_id in by_id:
            _check_depth(child_id, by_id, depth + 1, stack)
    stack.remove(component_id)
