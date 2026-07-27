/** @vitest-environment jsdom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AgentChat } from "../src/index";

let root: Root | undefined;
const reactGlobal = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
reactGlobal.IS_REACT_ACT_ENVIRONMENT = true;

afterEach(async () => {
  if (root) await act(async () => root?.unmount());
  root = undefined;
  document.body.replaceChildren();
});

describe("AgentChat React wrapper", () => {
  it("forwards A2UI props, headers and events to the shared element", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    const onDone = vi.fn();
    const onA2UIMessage = vi.fn();
    const onA2UIActionDone = vi.fn();
    const headers = { Authorization: "Bearer test" };

    await act(async () => {
      root?.render(
        <AgentChat
          apiBaseUrl="http://localhost:8001"
          a2uiEnabled={false}
          headers={headers}
          onMessageDone={onDone}
          onA2UIMessage={onA2UIMessage}
          onA2UIActionDone={onA2UIActionDone}
        />
      );
    });
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
    expect(onDone).toHaveBeenCalledWith({ content: "ok" });
    expect(onA2UIMessage).toHaveBeenCalledWith({ surfaceId: "s1" });
    expect(onA2UIActionDone).toHaveBeenCalledWith({ idempotencyKey: "key" });
  });
});
