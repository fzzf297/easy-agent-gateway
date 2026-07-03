import json
import time
from typing import Any

from fastapi import APIRouter

from app.core.errors import AppError
from app.db.database import get_connection
from app.repositories import sessions as session_repo
from app.schemas.interface_test import InterfaceTestError, InterfaceTestIn, InterfaceTestOut
from app.services import interface_executor

router = APIRouter()


def _preview(value: Any) -> str:
    text = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    return text[:1000]


@router.post("/interfaces/test", response_model=InterfaceTestOut)
async def test_interface(payload: InterfaceTestIn) -> InterfaceTestOut:
    started = time.perf_counter()
    try:
        result = await interface_executor.execute_interface(
            payload.projectCode,
            payload.interfaceCode,
            payload.params,
        )
    except AppError as exc:
        duration_ms = int((time.perf_counter() - started) * 1000)
        with get_connection() as conn:
            session_repo.save_audit_event(
                conn,
                None,
                "interface_test_failed",
                {
                    "projectCode": payload.projectCode,
                    "interfaceCode": payload.interfaceCode,
                    "code": exc.message,
                    "durationMs": duration_ms,
                },
            )
        return InterfaceTestOut(
            ok=False,
            projectCode=payload.projectCode,
            interfaceCode=payload.interfaceCode,
            durationMs=duration_ms,
            data=None,
            preview="",
            error=InterfaceTestError(code=exc.message, statusCode=exc.status_code),
        )

    duration_ms = int((time.perf_counter() - started) * 1000)
    data = result.get("data")
    with get_connection() as conn:
        session_repo.save_audit_event(
            conn,
            None,
            "interface_test_completed",
            {
                "projectCode": payload.projectCode,
                "interfaceCode": payload.interfaceCode,
                "durationMs": duration_ms,
                "authUsed": bool(result.get("authUsed", False)),
            },
        )
    return InterfaceTestOut(
        ok=True,
        projectCode=payload.projectCode,
        interfaceCode=payload.interfaceCode,
        durationMs=duration_ms,
        authUsed=bool(result.get("authUsed", False)),
        data=data,
        preview=_preview(data),
    )
