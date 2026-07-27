import { describe, expect, it } from "vitest";

import {
  AgentA2UIValidationError,
  normalizeAgentA2UIMessage
} from "../src/a2ui/normalize";
import { A2UI_CATALOG_ID } from "../src/a2ui/constants";

describe("A2UI message normalizer", () => {
  it("accepts standard v0.9 messages", () => {
    expect(
      normalizeAgentA2UIMessage({
        version: "v0.9",
        createSurface: { surfaceId: "s1", catalogId: A2UI_CATALOG_ID }
      })
    ).toEqual({
      version: "v0.9",
      createSurface: { surfaceId: "s1", catalogId: A2UI_CATALOG_ID }
    });
  });

  it("normalizes the legacy catalog, root id, path fields and data model", () => {
    const create = normalizeAgentA2UIMessage({
      createSurface: {
        surfaceId: "legacy",
        catalogId: "ruoyi-agent-a2ui",
        catalogVersion: "0.1.0",
        rootId: "root"
      }
    });
    expect(create).toEqual({
      version: "v0.9",
      createSurface: { surfaceId: "legacy", catalogId: A2UI_CATALOG_ID }
    });

    const components = normalizeAgentA2UIMessage({
      updateComponents: {
        surfaceId: "legacy",
        components: [
          { id: "root", component: "AiCard", children: ["table"] },
          {
            id: "table",
            component: "AiTable",
            columnsPath: "/table/columns",
            rowsPath: "/table/rows"
          }
        ]
      }
    });
    expect(components.updateComponents.components[1]).toMatchObject({
      columns: { path: "/table/columns" },
      rows: { path: "/table/rows" }
    });

    expect(
      normalizeAgentA2UIMessage({
        updateDataModel: { surfaceId: "legacy", dataModel: { table: { rows: [] } } }
      })
    ).toEqual({
      version: "v0.9",
      updateDataModel: {
        surfaceId: "legacy",
        path: "/",
        value: { table: { rows: [] } }
      }
    });
  });

  it.each([
    {
      createSurface: { surfaceId: "s", catalogId: "unknown", rootId: "root" }
    },
    {
      createSurface: {
        surfaceId: "s",
        catalogId: A2UI_CATALOG_ID,
        rootId: "not-root"
      }
    },
    {
      updateComponents: {
        surfaceId: "s",
        components: [{ id: "root", component: "AiText", text: "x", html: "<b>x</b>" }]
      }
    }
  ])("rejects an unsafe or unsupported legacy message", (message) => {
    expect(() => normalizeAgentA2UIMessage(message)).toThrow(AgentA2UIValidationError);
  });

  it("rejects invalid JSON pointers and oversized data models", () => {
    expect(() =>
      normalizeAgentA2UIMessage({
        version: "v0.9",
        updateDataModel: { surfaceId: "s", path: "/bad~2path", value: {} }
      })
    ).toThrow(/invalid escape/);
    expect(() =>
      normalizeAgentA2UIMessage({
        version: "v0.9",
        updateDataModel: { surfaceId: "s", path: "/", value: "x".repeat(300_000) }
      })
    ).toThrow(/too large/);
  });
});
