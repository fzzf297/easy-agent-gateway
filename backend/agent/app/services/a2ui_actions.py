import json
import threading
from collections import OrderedDict
from typing import Any, Callable, Optional

from app.a2ui.catalog import ACTIONS
from app.a2ui.templates import build_write_confirm_card
from app.core.errors import AppError, NotFoundError
from app.db.database import get_connection
from app.repositories import a2ui_store
from app.repositories import sessions as session_repo
from app.schemas.a2ui import A2UIActionIn, A2UIActionOut
from app.services import interface_executor
from app.services.admin_client import admin_client

_IDEMPOTENCY_MAX = 512
_idempotency_lock = threading.Lock()
_idempotency_cache: OrderedDict[str, A2UIActionOut] = OrderedDict()


def _cache_get(key: str) -> Optional[A2UIActionOut]:
    with _idempotency_lock:
        value = _idempotency_cache.get(key)
        if value is not None:
            _idempotency_cache.move_to_end(key)
        return value


def _cache_set(key: str, value: A2UIActionOut) -> None:
    with _idempotency_lock:
        _idempotency_cache[key] = value
        _idempotency_cache.move_to_end(key)
        while len(_idempotency_cache) > _IDEMPOTENCY_MAX:
            _idempotency_cache.popitem(last=False)


def _require_session(session_id: str) -> None:
    with get_connection() as conn:
        session = session_repo.get_session(conn, session_id)
    if session is None:
        raise NotFoundError("Session not found")


def _action_name(payload: A2UIActionIn) -> str:
    action = payload.action or {}
    name = action.get("name")
    if not isinstance(name, str) or name not in ACTIONS:
        raise AppError("UNSUPPORTED_A2UI_ACTION", status_code=400)
    return name


def _context(payload: A2UIActionIn) -> dict[str, Any]:
    action = payload.action or {}
    context = action.get("context") or {}
    if not isinstance(context, dict):
        raise AppError("INVALID_ACTION_CONTEXT", status_code=400)
    return context


def _load_cached_action(idempotency_key: str) -> Optional[A2UIActionOut]:
    cached = _cache_get(idempotency_key)
    if cached is not None:
        return cached
    with get_connection() as conn:
        row = a2ui_store.get_action_by_idempotency(conn, idempotency_key)
    if row is None:
        return None
    result_payload = json.loads(row["execution_result"] or "{}")
    out = A2UIActionOut.model_validate(result_payload) if result_payload else A2UIActionOut(ok=True)
    _cache_set(idempotency_key, out)
    return out


async def _assert_write_interface_allowed(project_code: str, interface_code: str) -> dict[str, Any]:
    try:
        config_out = await admin_client.get_interface_config(project_code, interface_code)
    except NotFoundError as exc:
        raise AppError("INTERFACE_NOT_FOUND", status_code=404) from exc
    config = config_out.parsedConfig or {}
    if config.get("kind") != "api":
        raise AppError("WRITE_NOT_ALLOWED", status_code=400)
    if config.get("readOnly") is not False:
        raise AppError("WRITE_NOT_ALLOWED", status_code=400)
    request = config.get("request") or {}
    method = request.get("method")
    if method not in {"GET", "POST"}:
        raise AppError("WRITE_NOT_ALLOWED", status_code=400)
    return config


async def handle_write_preview(payload: A2UIActionIn) -> A2UIActionOut:
    context = _context(payload)
    project_code = context.get("projectCode")
    interface_code = context.get("interfaceCode")
    params = context.get("params") or {}
    if not isinstance(project_code, str) or not project_code:
        raise AppError("PROJECT_CODE_REQUIRED", status_code=400)
    if not isinstance(interface_code, str) or not interface_code:
        raise AppError("INTERFACE_CODE_REQUIRED", status_code=400)
    if not isinstance(params, dict):
        raise AppError("INVALID_ACTION_PARAMS", status_code=400)

    await _assert_write_interface_allowed(project_code, interface_code)
    messages = build_write_confirm_card(
        surface_id=payload.surfaceId or f"write_{project_code}_{interface_code}",
        project_code=project_code,
        interface_code=interface_code,
        params_summary=params,
    )
    out = A2UIActionOut(
        ok=True,
        message="请确认后执行写操作",
        responseMode="TEXT_WITH_A2UI",
        text="请确认后执行写操作",
        a2uiMessages=messages,
    )
    with get_connection() as conn:
        a2ui_store.save_action_log(
            conn,
            session_id=payload.conversationId,
            surface_id=payload.surfaceId,
            action_name="interface.write.preview",
            request_context=context,
            execution_result=out.model_dump(),
            idempotency_key="",
        )
    return out


async def handle_write_confirm(payload: A2UIActionIn) -> A2UIActionOut:
    context = _context(payload)
    project_code = context.get("projectCode")
    interface_code = context.get("interfaceCode")
    params = context.get("params") or {}
    if not isinstance(project_code, str) or not project_code:
        raise AppError("PROJECT_CODE_REQUIRED", status_code=400)
    if not isinstance(interface_code, str) or not interface_code:
        raise AppError("INTERFACE_CODE_REQUIRED", status_code=400)
    if not isinstance(params, dict):
        raise AppError("INVALID_ACTION_PARAMS", status_code=400)

    await _assert_write_interface_allowed(project_code, interface_code)
    result = await interface_executor.execute_interface(
        project_code=project_code,
        interface_code=interface_code,
        params=params,
        allow_write=True,
    )
    out = A2UIActionOut(
        ok=True,
        message="写操作已执行",
        responseMode="TEXT",
        text="写操作已执行",
        a2uiMessages=[],
    )
    with get_connection() as conn:
        session_repo.save_audit_event(
            conn,
            payload.conversationId,
            "a2ui_action_executed",
            {
                "action": "interface.write.confirm",
                "surfaceId": payload.surfaceId,
                "projectCode": project_code,
                "interfaceCode": interface_code,
                "idempotencyKey": payload.idempotencyKey,
                "resultPreview": json.dumps(result, ensure_ascii=False)[:500],
            },
        )
        a2ui_store.save_action_log(
            conn,
            session_id=payload.conversationId,
            surface_id=payload.surfaceId,
            action_name="interface.write.confirm",
            request_context=context,
            execution_result=out.model_dump(),
            idempotency_key=payload.idempotencyKey,
        )
    return out


HANDLERS: dict[str, Callable[[A2UIActionIn], Any]] = {
    "interface.write.preview": handle_write_preview,
    "interface.write.confirm": handle_write_confirm,
}


async def dispatch_action(payload: A2UIActionIn) -> A2UIActionOut:
    _require_session(payload.conversationId)
    cached = _load_cached_action(payload.idempotencyKey)
    if cached is not None:
        return cached

    name = _action_name(payload)
    handler = HANDLERS.get(name)
    if handler is None:
        raise AppError("UNSUPPORTED_A2UI_ACTION", status_code=400)

    result = await handler(payload)
    _cache_set(payload.idempotencyKey, result)
    return result


def clear_idempotency_cache() -> None:
    with _idempotency_lock:
        _idempotency_cache.clear()
