/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";

import { A2UI_CATALOG_ID } from "../src/a2ui/constants";
import { defineEasyAgentChatElement, type EasyAgentChatElement } from "../src/element";
import type { AgentA2UIAction, AgentResponseMode } from "../src/types";

type ElementHarness = EasyAgentChatElement & {
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    responseMode?: AgentResponseMode;
    surfaceIds?: string[];
    state?: "pending" | "error";
  }>;
  opened: boolean;
  finalizeAssistantMessage: () => void;
  handleA2UIAction: (action: AgentA2UIAction) => Promise<void>;
  render: () => void;
  renderMessageBubble: (message: {
    role: "assistant";
    content: string;
    surfaceIds?: string[];
  }) => string;
};

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("EasyAgentChatElement A2UI integration", () => {
  it("keeps A2UI_ONLY content empty and hides surfaces when A2UI is off", () => {
    const element = createHarness();
    element.messages = [
      {
        role: "assistant",
        content: "",
        responseMode: "A2UI_ONLY",
        surfaceIds: ["surface-only"],
        state: "pending"
      }
    ];

    element.finalizeAssistantMessage();
    expect(element.messages[0]?.content).toBe("");
    expect(
      element.renderMessageBubble({
        role: "assistant",
        content: "",
        surfaceIds: ["surface-only"]
      })
    ).toContain('data-a2ui-surface-id="surface-only"');

    element.a2uiMode = "off";
    expect(
      element.renderMessageBubble({
        role: "assistant",
        content: "",
        surfaceIds: ["surface-only"]
      })
    ).not.toContain("a2ui-surface");
  });

  it("rebuilds a persisted surface when session history loads", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        sessionId: "history-session",
        messages: [
          { role: "user", content: "show", createdAt: "2026-07-27 10:00:00" },
          {
            role: "assistant",
            content: "",
            createdAt: "2026-07-27 10:00:01",
            responseMode: "A2UI_ONLY",
            surfaceIds: ["history-surface"],
            a2uiMessages: [
              {
                version: "v0.9",
                createSurface: {
                  surfaceId: "history-surface",
                  catalogId: A2UI_CATALOG_ID
                }
              },
              {
                version: "v0.9",
                updateComponents: {
                  surfaceId: "history-surface",
                  components: [
                    { id: "root", component: "AiText", text: "Restored" }
                  ]
                }
              }
            ]
          }
        ]
      })
    );
    const element = createHarness();
    element.apiBaseUrl = "http://localhost:8001";
    element.sessionId = "history-session";
    document.body.append(element);

    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(element.messages).toHaveLength(2));
    element.opened = true;
    element.render();

    const host = element.shadowRoot?.querySelector<HTMLElement & { surface?: unknown }>(
      'a2ui-surface[data-a2ui-surface-id="history-surface"]'
    );
    expect(host).toBeDefined();
    expect(host?.id).toBe("");
    expect(element.shadowRoot?.querySelector('[id="root"]')).toBeNull();

    const originalSurface = host?.surface;
    element.render();
    const rebuiltHost = element.shadowRoot?.querySelector<HTMLElement & { surface?: unknown }>(
      'a2ui-surface[data-a2ui-surface-id="history-surface"]'
    );
    expect(rebuiltHost).not.toBe(host);
    expect(rebuiltHost?.surface).toBe(originalSurface);
  });

  it("reuses the idempotency key for 5xx retries but replaces it after 4xx", async () => {
    const success = {
      ok: true,
      message: "done",
      responseMode: "TEXT" as const,
      text: "done",
      a2uiMessages: []
    };
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ detail: "temporary" }, { status: 500 }))
      .mockResolvedValueOnce(Response.json(success))
      .mockResolvedValueOnce(Response.json({ detail: "invalid" }, { status: 400 }))
      .mockResolvedValueOnce(Response.json(success));
    const element = createHarness();
    element.apiBaseUrl = "http://localhost:8001";
    element.sessionId = "action-session";
    element.messages = [
      { role: "assistant", content: "", surfaceIds: ["action-surface"] }
    ];
    const keys: string[] = [];
    element.addEventListener("a2ui-action-start", (event) => {
      keys.push((event as CustomEvent<{ idempotencyKey: string }>).detail.idempotencyKey);
    });
    const action: AgentA2UIAction = {
      name: "interface.write.confirm",
      surfaceId: "action-surface",
      sourceComponentId: "confirm",
      timestamp: new Date().toISOString(),
      context: {}
    };

    await expect(element.handleA2UIAction(action)).rejects.toThrow("temporary");
    await element.handleA2UIAction(action);
    await expect(element.handleA2UIAction(action)).rejects.toThrow("invalid");
    await element.handleA2UIAction(action);

    expect(fetchSpy).toHaveBeenCalledTimes(4);
    expect(keys[1]).toBe(keys[0]);
    expect(keys[2]).not.toBe(keys[1]);
    expect(keys[3]).not.toBe(keys[2]);
  });

  it("ignores a stale history response after the session changes", async () => {
    let resolveFirst: ((response: Response) => void) | undefined;
    const firstHistory = new Promise<Response>((resolve) => {
      resolveFirst = resolve;
    });
    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("first-session")) return firstHistory;
      return Promise.resolve(
        Response.json({
          sessionId: "second-session",
          messages: [
            {
              role: "assistant",
              content: "second history",
              createdAt: "2026-07-27 10:00:02"
            }
          ]
        })
      );
    });
    const element = createHarness();
    element.apiBaseUrl = "http://localhost:8001";
    element.sessionId = "first-session";
    document.body.append(element);
    await vi.waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1));

    element.sessionId = "second-session";
    await vi.waitFor(() => expect(element.messages[0]?.content).toBe("second history"));
    resolveFirst?.(
      Response.json({
        sessionId: "first-session",
        messages: [
          {
            role: "assistant",
            content: "stale history",
            createdAt: "2026-07-27 10:00:01"
          }
        ]
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(element.sessionId).toBe("second-session");
    expect(element.messages[0]?.content).toBe("second history");
  });
});

function createHarness() {
  defineEasyAgentChatElement();
  return document.createElement("easy-agent-chat") as ElementHarness;
}
