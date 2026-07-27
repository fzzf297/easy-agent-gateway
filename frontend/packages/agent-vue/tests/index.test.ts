/** @vitest-environment jsdom */

import { createApp, h, nextTick, type App } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AgentChat } from "../src/index";

let app: App | undefined;

afterEach(() => {
  app?.unmount();
  app = undefined;
  document.body.replaceChildren();
});

describe("AgentChat Vue wrapper", () => {
  it("forwards A2UI props, headers and kebab-case events", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const onDone = vi.fn();
    const onA2UIMessage = vi.fn();
    const onA2UIActionDone = vi.fn();
    const headers = { Authorization: "Bearer test" };
    app = createApp({
      render: () =>
        h(AgentChat, {
          apiBaseUrl: "http://localhost:8001",
          a2uiEnabled: false,
          headers,
          onMessageDone: onDone,
          onA2uiMessage: onA2UIMessage,
          onA2uiActionDone: onA2UIActionDone
        })
    });
    app.mount(container);
    await nextTick();
    const element = container.querySelector<HTMLElement & { headers: Record<string, string> }>(
      "easy-agent-chat"
    );
    expect(element?.getAttribute("a2ui-mode")).toBe("off");
    expect(element?.headers).toEqual(headers);

    element?.dispatchEvent(new CustomEvent("message-done", { detail: { content: "ok" } }));
    element?.dispatchEvent(new CustomEvent("a2ui-message", { detail: { surfaceId: "s1" } }));
    element?.dispatchEvent(
      new CustomEvent("a2ui-action-done", { detail: { idempotencyKey: "key" } })
    );
    await nextTick();
    expect(onDone).toHaveBeenCalledWith({ content: "ok" });
    expect(onA2UIMessage).toHaveBeenCalledWith({ surfaceId: "s1" });
    expect(onA2UIActionDone).toHaveBeenCalledWith({ idempotencyKey: "key" });
  });
});
