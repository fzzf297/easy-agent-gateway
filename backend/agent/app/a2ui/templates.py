from typing import Any

from app.a2ui.catalog import A2UI_PROTOCOL_VERSION, CATALOG_ID


def _message(operation: str, payload: dict[str, Any]) -> dict[str, Any]:
    return {"version": A2UI_PROTOCOL_VERSION, operation: payload}


def build_query_result_table(
    surface_id: str,
    title: str,
    columns: list[str],
    rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    components = [
        {
            "id": "root",
            "component": "AiCard",
            "children": ["title", "table"],
        },
        {
            "id": "title",
            "component": "AiText",
            "text": title,
            "variant": "h3",
        },
        {
            "id": "table",
            "component": "AiTable",
            "columns": {"path": "/table/columns"},
            "rows": {"path": "/table/rows"},
            "emptyText": "暂无数据",
        },
    ]
    return [
        _message(
            "createSurface",
            {"surfaceId": surface_id, "catalogId": CATALOG_ID},
        ),
        _message(
            "updateComponents",
            {"surfaceId": surface_id, "components": components},
        ),
        _message(
            "updateDataModel",
            {
                "surfaceId": surface_id,
                "path": "/",
                "value": {"table": {"columns": columns, "rows": rows}},
            },
        ),
    ]


def build_write_confirm_card(
    surface_id: str,
    project_code: str,
    interface_code: str,
    params_summary: dict[str, Any],
    *,
    include_create: bool = True,
) -> list[dict[str, Any]]:
    components = [
        {
            "id": "root",
            "component": "AiCard",
            "children": ["alert", "summary", "confirm"],
        },
        {
            "id": "alert",
            "component": "AiAlert",
            "text": "请确认后执行写操作",
            "tone": "warning",
        },
        {
            "id": "summary",
            "component": "AiText",
            "text": {"path": "/summary/text"},
        },
        {
            "id": "confirm",
            "component": "AiConfirmButton",
            "label": "确认执行",
            "action": {
                "event": {
                    "name": "interface.write.confirm",
                    "context": {
                        "projectCode": project_code,
                        "interfaceCode": interface_code,
                        "params": {"path": "/form/params"},
                    },
                }
            },
        },
    ]
    summary_text = f"项目 {project_code} / 接口 {interface_code} / 参数 {params_summary}"
    messages: list[dict[str, Any]] = []
    if include_create:
        messages.append(
            _message(
                "createSurface",
                {"surfaceId": surface_id, "catalogId": CATALOG_ID},
            )
        )
    messages.extend(
        [
            _message(
                "updateComponents",
                {"surfaceId": surface_id, "components": components},
            ),
            _message(
                "updateDataModel",
                {
                    "surfaceId": surface_id,
                    "path": "/",
                    "value": {
                        "summary": {"text": summary_text},
                        "form": {"params": params_summary},
                    },
                },
            ),
        ]
    )
    return messages


def build_write_success_update(surface_id: str) -> list[dict[str, Any]]:
    return [
        _message(
            "updateComponents",
            {
                "surfaceId": surface_id,
                "components": [
                    {
                        "id": "confirm",
                        "component": "AiAlert",
                        "text": "写操作已执行",
                        "tone": "success",
                    }
                ],
            },
        )
    ]
