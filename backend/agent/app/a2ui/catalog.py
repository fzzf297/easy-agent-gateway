from typing import Any

A2UI_PROTOCOL_VERSION = "v0.9"
CATALOG_ID = "urn:easy-agent-gateway:a2ui:catalog:ruoyi-agent:v1"
LEGACY_CATALOG_ID = "ruoyi-agent-a2ui"
CATALOG_VERSION = "1.0.0"

COMPONENT_SCHEMAS: dict[str, dict[str, Any]] = {
    "AiText": {
        "required": ["text"],
        "properties": {"text": "dynamicString", "variant": "textVariant"},
    },
    "AiCard": {
        "required": ["children"],
        "properties": {"children": "children"},
    },
    "AiRow": {
        "required": ["children"],
        "properties": {"children": "children"},
    },
    "AiColumn": {
        "required": ["children"],
        "properties": {"children": "children"},
    },
    "AiAlert": {
        "required": ["text"],
        "properties": {"text": "dynamicString", "tone": "alertTone"},
    },
    "AiInput": {
        "required": ["label", "value"],
        "properties": {
            "label": "dynamicString",
            "value": "dynamicString",
            "placeholder": "dynamicString",
            "inputType": "inputType",
            "required": "boolean",
            "disabled": "dynamicBoolean",
        },
    },
    "AiSelect": {
        "required": ["label", "value", "options"],
        "properties": {
            "label": "dynamicString",
            "value": "dynamicString",
            "options": "options",
            "placeholder": "dynamicString",
            "required": "boolean",
            "disabled": "dynamicBoolean",
        },
    },
    "AiButton": {
        "required": ["label", "action"],
        "properties": {
            "label": "dynamicString",
            "action": "previewAction",
            "disabled": "dynamicBoolean",
        },
    },
    "AiConfirmButton": {
        "required": ["label", "action"],
        "properties": {
            "label": "dynamicString",
            "action": "confirmAction",
            "disabled": "dynamicBoolean",
        },
    },
    "AiTable": {
        "required": ["columns", "rows"],
        "properties": {
            "columns": "columns",
            "rows": "rows",
            "emptyText": "dynamicString",
        },
    },
}

COMPONENTS = set(COMPONENT_SCHEMAS)
ACTIONS = {
    "interface.write.preview",
    "interface.write.confirm",
}

MAX_COMPONENTS = 80
MAX_DEPTH = 8
MAX_TABLE_COLUMNS = 12
MAX_TABLE_ROWS = 50
MAX_DATA_MODEL_BYTES = 256 * 1024
FORBIDDEN_FIELDS = {"html", "script", "style", "class", "url", "onClick"}
ACTION_COMPONENTS = {
    "AiButton": {"interface.write.preview"},
    "AiConfirmButton": {"interface.write.confirm"},
}
ALLOWED_TOP_KEYS = {
    "createSurface",
    "updateComponents",
    "updateDataModel",
    "deleteSurface",
}
