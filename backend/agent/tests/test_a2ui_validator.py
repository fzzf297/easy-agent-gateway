import pytest

from app.a2ui.catalog import ACTIONS, CATALOG_ID, CATALOG_VERSION, COMPONENTS
from app.a2ui.validator import A2UIValidationError, validate_a2ui_message


def _valid_components() -> list[dict]:
    return [
        {
            "id": "root",
            "component": "AiCard",
            "children": ["title", "table"],
        },
        {
            "id": "title",
            "component": "AiText",
            "text": "查询结果",
        },
        {
            "id": "table",
            "component": "AiTable",
            "columnsPath": "/table/columns",
            "rowsPath": "/table/rows",
        },
    ]


def test_catalog_constants() -> None:
    assert CATALOG_ID == "ruoyi-agent-a2ui"
    assert CATALOG_VERSION == "0.1.0"
    assert "AiTable" in COMPONENTS
    assert "interface.write.confirm" in ACTIONS


def test_validate_create_surface() -> None:
    msg = {
        "createSurface": {
            "surfaceId": "s1",
            "catalogId": CATALOG_ID,
            "catalogVersion": CATALOG_VERSION,
            "rootId": "root",
        }
    }
    validate_a2ui_message(msg)


def test_validate_update_components_ok() -> None:
    msg = {
        "updateComponents": {
            "surfaceId": "s1",
            "components": _valid_components(),
        }
    }
    validate_a2ui_message(msg)


def test_validate_rejects_unknown_component() -> None:
    msg = {
        "updateComponents": {
            "surfaceId": "s1",
            "components": [{"id": "x", "component": "EvilHtml"}],
        }
    }
    with pytest.raises(A2UIValidationError, match="unknown component"):
        validate_a2ui_message(msg)


def test_validate_rejects_missing_child_ref() -> None:
    msg = {
        "updateComponents": {
            "surfaceId": "s1",
            "components": [
                {"id": "root", "component": "AiCard", "children": ["missing"]},
            ],
        }
    }
    with pytest.raises(A2UIValidationError, match="missing component ref"):
        validate_a2ui_message(msg)


def test_validate_rejects_unknown_action() -> None:
    msg = {
        "updateComponents": {
            "surfaceId": "s1",
            "components": [
                {
                    "id": "btn",
                    "component": "AiConfirmButton",
                    "action": {"name": "dataset.delete", "context": {}},
                }
            ],
        }
    }
    with pytest.raises(A2UIValidationError, match="unknown action"):
        validate_a2ui_message(msg)


def test_validate_rejects_forbidden_fields() -> None:
    msg = {
        "updateComponents": {
            "surfaceId": "s1",
            "components": [
                {"id": "x", "component": "AiText", "html": "<script>alert(1)</script>"}
            ],
        }
    }
    with pytest.raises(A2UIValidationError, match="forbidden field"):
        validate_a2ui_message(msg)


def test_validate_rejects_mixed_top_level_keys() -> None:
    msg = {
        "createSurface": {
            "surfaceId": "s1",
            "catalogId": CATALOG_ID,
            "catalogVersion": CATALOG_VERSION,
            "rootId": "root",
        },
        "updateComponents": {"surfaceId": "s1", "components": []},
    }
    with pytest.raises(A2UIValidationError, match="exactly one"):
        validate_a2ui_message(msg)


def test_validate_update_data_model() -> None:
    msg = {
        "updateDataModel": {
            "surfaceId": "s1",
            "dataModel": {"table": {"columns": ["id"], "rows": []}},
        }
    }
    validate_a2ui_message(msg)


def test_validate_delete_surface() -> None:
    validate_a2ui_message({"deleteSurface": {"surfaceId": "s1"}})
