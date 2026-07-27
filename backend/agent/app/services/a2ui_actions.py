import asyncio
import json
import threading
from collections import OrderedDict
from concurrent.futures import Future
from typing import Any, Callable, Optional

from app.a2ui.catalog import ACTIONS
from app.a2ui.templates import build_write_confirm_card, build_write_success_update
from app.core.errors import AppError, NotFoundError
from app.db.database import get_connection
from app.repositories import a2ui_store
from app.repositories import sessions as session_repo
from app.schemas.a2ui import A2UIActionIn, A2UIActionOut
from app.services import interface_executor
from app.services.admin_client import admin_client

_IDEMPOTENCY_MAX = 512
_idempotency_lock = threading.Lock()
_idempotency_cache: OrderedDict[str, tuple[str, A2UIActionOut]] = OrderedDict()
_inflight_actions: dict[str, tuple[str, Future[A2UIActionOut]]] = {}


def _cache_get(key: str, fingerprint: str) -> Optional[A2UIActionOut]:
    with _idempotency_lock:
        entry = _idempotency_cache.get(key)
        if entry is not None:
            cached_fingerprint, value = entry
            if cached_fingerprint != fingerprint:
                raise AppError("IDEMPOTENCY_KEY_REUSED", status_code=409)
            _idempotency_cache.move_to_end(key)
            return value
        return None


def _cache_set(key: str, fingerprint: str, value: A2UIActionOut) -> None:
    with _idempotency_lock:
        _idempotency_cache[key] = (fingerprint, value)
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


def _request_fingerprint(payload: A2UIActionIn) -> str:
    return json.dumps(
        {
            "conversationId": payload.conversationId,
            "messageId": payload.messageId,
            "surfaceId": payload.surfaceId,
            "action": payload.action,
        },
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )


def _load_cached_action(payload: A2UIActionIn, fingerprint: str) -> Optional[A2UIActionOut]:
    cached = _cache_get(payload.idempotencyKey, fingerprint)
    if cached is not None:
        return cached
    with get_connection() as conn:
        row = a2ui_store.get_action_by_idempotency(conn, payload.idempotencyKey)
    if row is None:
        return None
    stored_context = json.loads(row["request_context"] or "{}")
    if (
        row["session_id"] != payload.conversationId
        or row["surface_id"] != payload.surfaceId
        or row["action_name"] != payload.action.get("name")
        or stored_context != _context(payload)
    ):
        raise AppError("IDEMPOTENCY_KEY_REUSED", status_code=409)
    result_payload = json.loads(row["execution_result"] or "{}")
    out = A2UIActionOut.model_validate(result_payload) if result_payload else A2UIActionOut(ok=True)
    _cache_set(payload.idempotencyKey, fingerprint, out)
    return out


def _get_session_surface(payload: A2UIActionIn) -> Optional[dict]:
    with get_connection() as conn:
        surface = a2ui_store.get_surface(conn, payload.surfaceId)
    if surface and surface.get("session_id") != payload.conversationId:
        raise AppError("A2UI_SURFACE_NOT_FOUND", status_code=404)
    return surface


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
    existing_surface = _get_session_surface(payload)
    messages = build_write_confirm_card(
        surface_id=payload.surfaceId or f"write_{project_code}_{interface_code}",
        project_code=project_code,
        interface_code=interface_code,
        params_summary=params,
        include_create=existing_surface is None,
    )
    out = A2UIActionOut(
        ok=True,
        message="请确认后执行写操作",
        responseMode="TEXT_WITH_A2UI",
        text="请确认后执行写操作",
        a2uiMessages=messages,
    )
    with get_connection() as conn:
        a2ui_store.apply_messages(
            conn,
            session_id=payload.conversationId,
            messages=messages,
            message_id=payload.messageId,
        )
        a2ui_store.save_action_log(
            conn,
            session_id=payload.conversationId,
            surface_id=payload.surfaceId,
            action_name="interface.write.preview",
            request_context=context,
            execution_result=out.model_dump(),
            idempotency_key=payload.idempotencyKey,
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
    existing_surface = _get_session_surface(payload)
    result = await interface_executor.execute_interface(
        project_code=project_code,
        interface_code=interface_code,
        params=params,
        allow_write=True,
    )
    messages = build_write_success_update(payload.surfaceId) if existing_surface else []
    out = A2UIActionOut(
        ok=True,
        message="写操作已执行",
        responseMode="TEXT_WITH_A2UI" if messages else "TEXT",
        text="写操作已执行",
        a2uiMessages=messages,
    )
    with get_connection() as conn:
        if messages:
            a2ui_store.apply_messages(
                conn,
                session_id=payload.conversationId,
                messages=messages,
                message_id=payload.messageId,
            )
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
    fingerprint = _request_fingerprint(payload)
    cached = _load_cached_action(payload, fingerprint)
    if cached is not None:
        return cached

    with _idempotency_lock:
        inflight = _inflight_actions.get(payload.idempotencyKey)
        leader = inflight is None
        if inflight is None:
            future = Future()
            _inflight_actions[payload.idempotencyKey] = (fingerprint, future)
        else:
            inflight_fingerprint, future = inflight
            if inflight_fingerprint != fingerprint:
                raise AppError("IDEMPOTENCY_KEY_REUSED", status_code=409)
    if not leader:
        return await asyncio.shield(asyncio.wrap_future(future))

    try:
        name = _action_name(payload)
        handler = HANDLERS.get(name)
        if handler is None:
            raise AppError("UNSUPPORTED_A2UI_ACTION", status_code=400)
        result = await handler(payload)
        _cache_set(payload.idempotencyKey, fingerprint, result)
        future.set_result(result)
        return result
    except BaseException as exc:
        future.set_exception(exc)
        raise
    finally:
        with _idempotency_lock:
            inflight = _inflight_actions.get(payload.idempotencyKey)
            if inflight and inflight[1] is future:
                _inflight_actions.pop(payload.idempotencyKey, None)


def clear_idempotency_cache() -> None:
    with _idempotency_lock:
        _idempotency_cache.clear()
