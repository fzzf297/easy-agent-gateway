import pytest

from app.a2ui.catalog import (
    A2UI_PROTOCOL_VERSION,
    ACTIONS,
    CATALOG_ID,
    CATALOG_VERSION,
    COMPONENT_SCHEMAS,
    COMPONENTS,
)
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
            "columns": {"path": "/table/columns"},
            "rows": {"path": "/table/rows"},
        },
    ]


def test_catalog_constants() -> None:
    assert CATALOG_ID == "urn:easy-agent-gateway:a2ui:catalog:ruoyi-agent:v1"
    assert CATALOG_VERSION == "1.0.0"
    assert "AiTable" in COMPONENTS
    assert "interface.write.confirm" in ACTIONS


def test_catalog_component_fields_match_the_frontend_contract() -> None:
    expected = {
        "AiText": {"text", "variant"},
        "AiCard": {"children"},
        "AiRow": {"children"},
        "AiColumn": {"children"},
        "AiAlert": {"text", "tone"},
        "AiInput": {"label", "value", "placeholder", "inputType", "required", "disabled"},
        "AiSelect": {"label", "value", "options", "placeholder", "required", "disabled"},
        "AiButton": {"label", "action", "disabled"},
        "AiConfirmButton": {"label", "action", "disabled"},
        "AiTable": {"columns", "rows", "emptyText"},
    }
    assert set(COMPONENT_SCHEMAS) == set(expected)
    for name, fields in expected.items():
        assert set(COMPONENT_SCHEMAS[name]["properties"]) == fields


def test_validate_create_surface() -> None:
    msg = {
        "version": A2UI_PROTOCOL_VERSION,
        "createSurface": {
            "surfaceId": "s1",
            "catalogId": CATALOG_ID,
        }
    }
    validate_a2ui_message(msg)


def test_validate_update_components_ok() -> None:
    msg = {
        "version": A2UI_PROTOCOL_VERSION,
        "updateComponents": {
            "surfaceId": "s1",
            "components": _valid_components(),
        }
    }
    validate_a2ui_message(msg)


def test_validate_rejects_unknown_component() -> None:
    msg = {
        "version": A2UI_PROTOCOL_VERSION,
        "updateComponents": {
            "surfaceId": "s1",
            "components": [{"id": "x", "component": "EvilHtml"}],
        }
    }
    with pytest.raises(A2UIValidationError, match="unknown component"):
        validate_a2ui_message(msg)


def test_validate_rejects_missing_child_ref() -> None:
    msg = {
        "version": A2UI_PROTOCOL_VERSION,
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
        "version": A2UI_PROTOCOL_VERSION,
        "updateComponents": {
            "surfaceId": "s1",
            "components": [
                {
                    "id": "btn",
                    "component": "AiConfirmButton",
                    "label": "确认",
                    "action": {"event": {"name": "dataset.delete", "context": {}}},
                }
            ],
        }
    }
    with pytest.raises(A2UIValidationError, match="not allowed"):
        validate_a2ui_message(msg)


def test_validate_rejects_forbidden_fields() -> None:
    msg = {
        "version": A2UI_PROTOCOL_VERSION,
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
        "version": A2UI_PROTOCOL_VERSION,
        "createSurface": {
            "surfaceId": "s1",
            "catalogId": CATALOG_ID,
        },
        "updateComponents": {"surfaceId": "s1", "components": []},
    }
    with pytest.raises(A2UIValidationError, match="exactly one"):
        validate_a2ui_message(msg)


def test_validate_update_data_model() -> None:
    msg = {
        "version": A2UI_PROTOCOL_VERSION,
        "updateDataModel": {
            "surfaceId": "s1",
            "path": "/",
            "value": {"table": {"columns": ["id"], "rows": []}},
        }
    }
    validate_a2ui_message(msg)


def test_validate_delete_surface() -> None:
    validate_a2ui_message(
        {"version": A2UI_PROTOCOL_VERSION, "deleteSurface": {"surfaceId": "s1"}}
    )


def test_validate_rejects_legacy_wire_fields() -> None:
    with pytest.raises(A2UIValidationError, match="unknown createSurface field"):
        validate_a2ui_message(
            {
                "version": A2UI_PROTOCOL_VERSION,
                "createSurface": {
                    "surfaceId": "s1",
                    "catalogId": CATALOG_ID,
                    "rootId": "root",
                },
            }
        )


def test_validate_rejects_invalid_pointer_and_oversized_data() -> None:
    with pytest.raises(A2UIValidationError, match="invalid escape"):
        validate_a2ui_message(
            {
                "version": A2UI_PROTOCOL_VERSION,
                "updateDataModel": {"surfaceId": "s1", "path": "/bad~2path", "value": {}},
            }
        )
    with pytest.raises(A2UIValidationError, match="too large"):
        validate_a2ui_message(
            {
                "version": A2UI_PROTOCOL_VERSION,
                "updateDataModel": {
                    "surfaceId": "s1",
                    "path": "/",
                    "value": "x" * 300_000,
                },
            }
        )
