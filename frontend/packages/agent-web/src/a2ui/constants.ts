export const A2UI_PROTOCOL_VERSION = "v0.9" as const;
export const A2UI_CATALOG_ID = "urn:easy-agent-gateway:a2ui:catalog:ruoyi-agent:v1";
export const A2UI_LEGACY_CATALOG_ID = "ruoyi-agent-a2ui";
export const A2UI_CATALOG_VERSION = "1.0.0";

export const A2UI_COMPONENT_NAMES = [
  "AiText",
  "AiCard",
  "AiRow",
  "AiColumn",
  "AiAlert",
  "AiInput",
  "AiSelect",
  "AiButton",
  "AiConfirmButton",
  "AiTable"
] as const;

export const A2UI_ACTION_NAMES = [
  "interface.write.preview",
  "interface.write.confirm"
] as const;

export type EnterpriseA2UIComponentName = (typeof A2UI_COMPONENT_NAMES)[number];
export type EnterpriseA2UIActionName = (typeof A2UI_ACTION_NAMES)[number];
