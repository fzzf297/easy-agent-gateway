CATALOG_ID = "ruoyi-agent-a2ui"
CATALOG_VERSION = "0.1.0"

COMPONENTS = {
    "AiText",
    "AiCard",
    "AiRow",
    "AiColumn",
    "AiAlert",
    "AiInput",
    "AiSelect",
    "AiButton",
    "AiConfirmButton",
    "AiTable",
}

ACTIONS = {
    "interface.query.render",
    "interface.write.preview",
    "interface.write.confirm",
}

MAX_COMPONENTS = 80
MAX_DEPTH = 8
FORBIDDEN_FIELDS = {"html", "script", "url", "onClick"}
ACTION_COMPONENTS = {"AiButton", "AiConfirmButton"}
ALLOWED_TOP_KEYS = {
    "createSurface",
    "updateComponents",
    "updateDataModel",
    "deleteSurface",
}
