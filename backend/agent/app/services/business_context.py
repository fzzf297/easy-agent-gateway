import logging
from typing import Any

from app.services.admin_client import admin_client

logger = logging.getLogger(__name__)


async def build_context(intent: str, user_text: str) -> dict[str, Any]:
    """Prefetch read-only business context for A2UI generation.

    Failures must not block the main chat flow.
    """
    try:
        if intent == "GENERAL_QA":
            return {}
        if intent == "INTERFACE_QUERY":
            return await _project_summary_context()
        if intent in {"INTERFACE_WRITE", "INTERFACE_WRITE_FORM"}:
            return await _write_interface_context()
        return {}
    except Exception as exc:
        logger.warning("business context failed: intent=%s err=%s", intent, exc)
        return {"error": "CONTEXT_UNAVAILABLE", "detail": str(exc)}


async def _project_summary_context() -> dict[str, Any]:
    result = await admin_client.list_projects(page=1, page_size=5)
    items = [
        {
            "code": item.code,
            "name": item.name,
            "status": getattr(item, "status", None),
        }
        for item in result.items
    ]
    return {
        "projects": {
            "items": items,
            "total": result.total,
            "page": result.page,
            "pageSize": result.pageSize,
        }
    }


async def _write_interface_context() -> dict[str, Any]:
    projects = await admin_client.list_projects(page=1, page_size=3)
    write_apis: list[dict[str, Any]] = []
    for project in projects.items:
        interfaces = await admin_client.list_interfaces(project.code, page=1, page_size=20)
        for item in interfaces.items:
            config = item.parsedConfig or {}
            if config.get("kind") != "api":
                continue
            if config.get("readOnly") is not False:
                continue
            write_apis.append(
                {
                    "projectCode": project.code,
                    "interfaceCode": item.code,
                    "name": item.name,
                    "method": item.method,
                }
            )
            if len(write_apis) >= 10:
                break
        if len(write_apis) >= 10:
            break
    return {"writeInterfaces": write_apis}
