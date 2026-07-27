import { A2uiMessageSchema } from "@a2ui/web_core/v0_9";

import type { AgentA2UIComponent, AgentA2UIMessage } from "../types";
import { enterpriseA2UIComponentApis } from "./catalog";
import {
  A2UI_CATALOG_ID,
  A2UI_COMPONENT_NAMES,
  A2UI_LEGACY_CATALOG_ID,
  A2UI_PROTOCOL_VERSION
} from "./constants";

const componentNames = new Set<string>(A2UI_COMPONENT_NAMES);
const operations = [
  "createSurface",
  "updateComponents",
  "updateDataModel",
  "deleteSurface"
] as const;
const forbiddenFields = new Set(["html", "script", "style", "class", "url", "onClick"]);
const MAX_DATA_MODEL_BYTES = 256 * 1024;

export class AgentA2UIValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentA2UIValidationError";
  }
}

export function normalizeAgentA2UIMessage(input: unknown): AgentA2UIMessage {
  const raw = requireRecord(input, "A2UI message");
  const operation = getOperation(raw);
  const version = raw.version ?? A2UI_PROTOCOL_VERSION;
  if (version !== "v0.9" && version !== "v0.9.1") {
    throw new AgentA2UIValidationError("Unsupported A2UI protocol version");
  }
  const allowedTopLevel = new Set<string>(["version", operation]);
  rejectUnknownKeys(raw, allowedTopLevel, "A2UI message");

  let normalized: Record<string, unknown>;
  if (operation === "createSurface") {
    normalized = normalizeCreateSurface(raw[operation], version);
  } else if (operation === "updateComponents") {
    normalized = normalizeUpdateComponents(raw[operation], version);
  } else if (operation === "updateDataModel") {
    normalized = normalizeUpdateDataModel(raw[operation], version);
  } else {
    normalized = normalizeDeleteSurface(raw[operation], version);
  }

  const parsed = A2uiMessageSchema.safeParse(normalized);
  if (!parsed.success) {
    throw new AgentA2UIValidationError(parsed.error.issues[0]?.message || "Invalid A2UI message");
  }
  return parsed.data as AgentA2UIMessage;
}

export function getAgentA2UISurfaceId(message: AgentA2UIMessage): string {
  if ("createSurface" in message) return message.createSurface.surfaceId;
  if ("updateComponents" in message) return message.updateComponents.surfaceId;
  if ("updateDataModel" in message) return message.updateDataModel.surfaceId;
  return message.deleteSurface.surfaceId;
}

export function getAgentA2UIOperation(message: AgentA2UIMessage) {
  if ("createSurface" in message) return "createSurface" as const;
  if ("updateComponents" in message) return "updateComponents" as const;
  if ("updateDataModel" in message) return "updateDataModel" as const;
  return "deleteSurface" as const;
}

function normalizeCreateSurface(payloadValue: unknown, version: "v0.9" | "v0.9.1") {
  const payload = requireRecord(payloadValue, "createSurface");
  rejectUnknownKeys(
    payload,
    new Set(["surfaceId", "catalogId", "catalogVersion", "rootId", "theme", "sendDataModel"]),
    "createSurface"
  );
  const surfaceId = requireSurfaceId(payload.surfaceId);
  if (payload.rootId !== undefined && payload.rootId !== "root") {
    throw new AgentA2UIValidationError("Legacy rootId must be root");
  }
  const catalogId = payload.catalogId;
  if (catalogId !== A2UI_CATALOG_ID && catalogId !== A2UI_LEGACY_CATALOG_ID) {
    throw new AgentA2UIValidationError("Unsupported A2UI catalog");
  }
  const createSurface: Record<string, unknown> = {
    surfaceId,
    catalogId: A2UI_CATALOG_ID
  };
  if (payload.theme !== undefined) createSurface.theme = payload.theme;
  if (payload.sendDataModel !== undefined) {
    if (typeof payload.sendDataModel !== "boolean") {
      throw new AgentA2UIValidationError("sendDataModel must be a boolean");
    }
    createSurface.sendDataModel = payload.sendDataModel;
  }
  return { version, createSurface };
}

function normalizeUpdateComponents(payloadValue: unknown, version: "v0.9" | "v0.9.1") {
  const payload = requireRecord(payloadValue, "updateComponents");
  rejectUnknownKeys(payload, new Set(["surfaceId", "components"]), "updateComponents");
  const surfaceId = requireSurfaceId(payload.surfaceId);
  if (!Array.isArray(payload.components) || !payload.components.length) {
    throw new AgentA2UIValidationError("components must be a non-empty array");
  }
  if (payload.components.length > 80) {
    throw new AgentA2UIValidationError("Too many A2UI components");
  }
  const components = payload.components.map(normalizeComponent);
  validateComponentGraph(components);
  return { version, updateComponents: { surfaceId, components } };
}

function normalizeComponent(value: unknown): AgentA2UIComponent {
  const raw = requireRecord(value, "component");
  const id = raw.id;
  const component = raw.component;
  if (typeof id !== "string" || !id || id.length > 128) {
    throw new AgentA2UIValidationError("Component id is required");
  }
  if (typeof component !== "string" || !componentNames.has(component)) {
    throw new AgentA2UIValidationError(`Unsupported component: ${String(component)}`);
  }
  for (const field of forbiddenFields) {
    if (field in raw) throw new AgentA2UIValidationError(`Forbidden component field: ${field}`);
  }

  const normalized = { ...raw };
  normalizeLegacyPath(normalized, "textPath", "text");
  normalizeLegacyPath(normalized, "columnsPath", "columns");
  normalizeLegacyPath(normalized, "rowsPath", "rows");
  if (isRecord(normalized.action) && typeof normalized.action.name === "string") {
    normalized.action = {
      event: {
        name: normalized.action.name,
        context: isRecord(normalized.action.context)
          ? normalizeLegacyActionContext(normalized.action.context)
          : {}
      }
    };
  }

  const api = enterpriseA2UIComponentApis.get(component);
  const properties = { ...normalized };
  delete properties.id;
  delete properties.component;
  const parsed = api?.schema.safeParse(properties);
  if (!parsed?.success) {
    throw new AgentA2UIValidationError(
      parsed?.error.issues[0]?.message || `Invalid ${component} properties`
    );
  }
  validateBindings(parsed.data);
  validateComponentAction(component, parsed.data);
  return { id, component, ...parsed.data } as AgentA2UIComponent;
}

function normalizeLegacyActionContext(
  context: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => {
      if (!isRecord(value) || (typeof value.path === "string" && Object.keys(value).length === 1)) {
        return [key, value];
      }
      return [key, `__eag_json__:${JSON.stringify(value)}`];
    })
  );
}

function normalizeUpdateDataModel(payloadValue: unknown, version: "v0.9" | "v0.9.1") {
  const payload = requireRecord(payloadValue, "updateDataModel");
  rejectUnknownKeys(payload, new Set(["surfaceId", "path", "value", "dataModel"]), "updateDataModel");
  const surfaceId = requireSurfaceId(payload.surfaceId);
  if (payload.dataModel !== undefined && (payload.path !== undefined || "value" in payload)) {
    throw new AgentA2UIValidationError("Cannot mix legacy and standard data model fields");
  }
  const path = payload.dataModel !== undefined ? "/" : payload.path ?? "/";
  validateJsonPointer(path, "Data model path");
  const updateDataModel: Record<string, unknown> = { surfaceId, path };
  if (payload.dataModel !== undefined) updateDataModel.value = payload.dataModel;
  else if ("value" in payload) updateDataModel.value = payload.value;
  if ("value" in updateDataModel) validateDataModelValue(updateDataModel.value);
  return { version, updateDataModel };
}

function normalizeDeleteSurface(payloadValue: unknown, version: "v0.9" | "v0.9.1") {
  const payload = requireRecord(payloadValue, "deleteSurface");
  rejectUnknownKeys(payload, new Set(["surfaceId"]), "deleteSurface");
  return { version, deleteSurface: { surfaceId: requireSurfaceId(payload.surfaceId) } };
}

function validateComponentAction(component: string, properties: Record<string, unknown>) {
  if (component !== "AiButton" && component !== "AiConfirmButton") return;
  const action = requireRecord(properties.action, `${component}.action`);
  const event = requireRecord(action.event, `${component}.action.event`);
  const expected =
    component === "AiButton" ? "interface.write.preview" : "interface.write.confirm";
  if (event.name !== expected) {
    throw new AgentA2UIValidationError(`${component} may only dispatch ${expected}`);
  }
}

function validateComponentGraph(components: AgentA2UIComponent[]) {
  const byId = new Map<string, AgentA2UIComponent>();
  for (const component of components) {
    if (byId.has(component.id)) {
      throw new AgentA2UIValidationError(`Duplicate component id: ${component.id}`);
    }
    byId.set(component.id, component);
  }
  if (!byId.has("root")) return;
  visit("root", 0, new Set());

  function visit(id: string, depth: number, stack: Set<string>) {
    if (depth > 8) throw new AgentA2UIValidationError("Component tree is too deep");
    if (stack.has(id)) throw new AgentA2UIValidationError("Component tree contains a cycle");
    const component = byId.get(id);
    if (!component) throw new AgentA2UIValidationError(`Missing component reference: ${id}`);
    stack.add(id);
    const children = component.children;
    if (Array.isArray(children)) {
      for (const child of children) {
        if (typeof child !== "string" || !byId.has(child)) {
          throw new AgentA2UIValidationError(`Missing component reference: ${String(child)}`);
        }
        visit(child, depth + 1, stack);
      }
    }
    stack.delete(id);
  }
}

function normalizeLegacyPath(target: Record<string, unknown>, legacy: string, standard: string) {
  if (!(legacy in target)) return;
  if (standard in target) {
    throw new AgentA2UIValidationError(`Cannot mix ${legacy} and ${standard}`);
  }
  if (typeof target[legacy] !== "string") {
    throw new AgentA2UIValidationError(`${legacy} must be a string`);
  }
  target[standard] = { path: target[legacy] };
  delete target[legacy];
}

function validateBindings(value: unknown) {
  if (Array.isArray(value)) {
    value.forEach(validateBindings);
    return;
  }
  if (!isRecord(value)) return;
  if (Object.keys(value).length === 1 && "path" in value) {
    validateJsonPointer(value.path, "Binding path");
    return;
  }
  Object.values(value).forEach(validateBindings);
}

function validateJsonPointer(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !value.startsWith("/") || value.length > 512) {
    throw new AgentA2UIValidationError(`${label} must be a JSON Pointer`);
  }
  if (/~(?![01])/u.test(value)) {
    throw new AgentA2UIValidationError(`${label} contains an invalid escape`);
  }
}

function validateDataModelValue(value: unknown) {
  let serialized: string | undefined;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new AgentA2UIValidationError("Data model value must be JSON serializable");
  }
  if (serialized === undefined) {
    throw new AgentA2UIValidationError("Data model value must be JSON serializable");
  }
  if (new TextEncoder().encode(serialized).byteLength > MAX_DATA_MODEL_BYTES) {
    throw new AgentA2UIValidationError("Data model value is too large");
  }
}

function getOperation(raw: Record<string, unknown>): (typeof operations)[number] {
  const found = operations.filter((operation) => operation in raw);
  if (found.length !== 1) {
    throw new AgentA2UIValidationError("Exactly one A2UI operation is required");
  }
  return found[0];
}

function requireSurfaceId(value: unknown) {
  if (typeof value !== "string" || !value || value.length > 128) {
    throw new AgentA2UIValidationError("surfaceId is required");
  }
  return value;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new AgentA2UIValidationError(`${label} must be an object`);
  return value;
}

function rejectUnknownKeys(
  value: Record<string, unknown>,
  allowed: Set<string>,
  label: string
) {
  const unknown = Object.keys(value).find((key) => !allowed.has(key));
  if (unknown) throw new AgentA2UIValidationError(`Unknown ${label} field: ${unknown}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
