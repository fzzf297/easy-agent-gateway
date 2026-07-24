from typing import Any

from app.a2ui.catalog import (
    ACTION_COMPONENTS,
    ACTIONS,
    ALLOWED_TOP_KEYS,
    CATALOG_ID,
    CATALOG_VERSION,
    COMPONENTS,
    FORBIDDEN_FIELDS,
    MAX_COMPONENTS,
    MAX_DEPTH,
)


class A2UIValidationError(ValueError):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


def validate_a2ui_message(message: dict[str, Any]) -> None:
    if not isinstance(message, dict) or not message:
        raise A2UIValidationError("message must be a non-empty object")

    keys = [k for k in message.keys() if k in ALLOWED_TOP_KEYS]
    if len(keys) != 1:
        raise A2UIValidationError("exactly one A2UI operation key is required")
    if set(message.keys()) - ALLOWED_TOP_KEYS:
        raise A2UIValidationError("unknown top-level keys")

    key = keys[0]
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
    return surface_id


def _validate_create_surface(payload: dict[str, Any]) -> None:
    _require_surface_id(payload)
    if payload.get("catalogId") != CATALOG_ID:
        raise A2UIValidationError("catalogId mismatch")
    if payload.get("catalogVersion") != CATALOG_VERSION:
        raise A2UIValidationError("catalogVersion mismatch")
    root_id = payload.get("rootId")
    if not isinstance(root_id, str) or not root_id.strip():
        raise A2UIValidationError("rootId is required")


def _validate_update_data_model(payload: dict[str, Any]) -> None:
    _require_surface_id(payload)
    data_model = payload.get("dataModel")
    if not isinstance(data_model, dict):
        raise A2UIValidationError("dataModel must be an object")


def _validate_delete_surface(payload: dict[str, Any]) -> None:
    _require_surface_id(payload)


def _validate_update_components(payload: dict[str, Any]) -> None:
    _require_surface_id(payload)
    components = payload.get("components")
    if not isinstance(components, list):
        raise A2UIValidationError("components must be a list")
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
        forbidden = FORBIDDEN_FIELDS.intersection(item.keys())
        if forbidden:
            raise A2UIValidationError(f"forbidden field: {sorted(forbidden)[0]}")
        if name in ACTION_COMPONENTS:
            action = item.get("action")
            if not isinstance(action, dict):
                raise A2UIValidationError("action object is required")
            action_name = action.get("name")
            if action_name not in ACTIONS:
                raise A2UIValidationError(f"unknown action: {action_name}")
        by_id[component_id] = item

    for item in by_id.values():
        children = item.get("children") or []
        if not isinstance(children, list):
            raise A2UIValidationError("children must be a list")
        for child_id in children:
            if child_id not in by_id:
                raise A2UIValidationError(f"missing component ref: {child_id}")

    for component_id in by_id:
        _check_depth(component_id, by_id, 0, set())


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
        _check_depth(child_id, by_id, depth + 1, stack)
    stack.remove(component_id)
