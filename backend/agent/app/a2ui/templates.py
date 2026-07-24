from typing import Any

from app.a2ui.catalog import CATALOG_ID, CATALOG_VERSION


def build_query_result_table(
    surface_id: str,
    title: str,
    columns: list[str],
    rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    root_id = "root"
    components = [
        {
            "id": root_id,
            "component": "AiCard",
            "children": ["title", "table"],
        },
        {
            "id": "title",
            "component": "AiText",
            "text": title,
        },
        {
            "id": "table",
            "component": "AiTable",
            "columnsPath": "/table/columns",
            "rowsPath": "/table/rows",
        },
    ]
    return [
        {
            "createSurface": {
                "surfaceId": surface_id,
                "catalogId": CATALOG_ID,
                "catalogVersion": CATALOG_VERSION,
                "rootId": root_id,
            }
        },
        {
            "updateComponents": {
                "surfaceId": surface_id,
                "components": components,
            }
        },
        {
            "updateDataModel": {
                "surfaceId": surface_id,
                "dataModel": {
                    "table": {
                        "columns": columns,
                        "rows": rows,
                    }
                },
            }
        },
    ]


def build_write_confirm_card(
    surface_id: str,
    project_code: str,
    interface_code: str,
    params_summary: dict[str, Any],
) -> list[dict[str, Any]]:
    root_id = "root"
    components = [
        {
            "id": root_id,
            "component": "AiCard",
            "children": ["alert", "summary", "confirm"],
        },
        {
            "id": "alert",
            "component": "AiAlert",
            "text": "请确认后执行写操作",
        },
        {
            "id": "summary",
            "component": "AiText",
            "textPath": "/summary/text",
        },
        {
            "id": "confirm",
            "component": "AiConfirmButton",
            "label": "确认执行",
            "action": {
                "name": "interface.write.confirm",
                "context": {
                    "projectCode": project_code,
                    "interfaceCode": interface_code,
                    "params": params_summary,
                },
            },
        },
    ]
    summary_text = (
        f"项目 {project_code} / 接口 {interface_code} / 参数 {params_summary}"
    )
    return [
        {
            "createSurface": {
                "surfaceId": surface_id,
                "catalogId": CATALOG_ID,
                "catalogVersion": CATALOG_VERSION,
                "rootId": root_id,
            }
        },
        {
            "updateComponents": {
                "surfaceId": surface_id,
                "components": components,
            }
        },
        {
            "updateDataModel": {
                "surfaceId": surface_id,
                "dataModel": {"summary": {"text": summary_text}},
            }
        },
    ]
