// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import {
  defineEasyAgentChatElement,
  type EasyAgentChatElement
} from "../src/element";
import type { AgentHistoryMessage } from "../src/types";

type ChatMessage = Pick<AgentHistoryMessage, "role" | "content"> & {
  state?: "pending" | "error";
  error?: string;
};

type ElementMarkdownHarness = EasyAgentChatElement & {
  renderMessageBubble: (message: ChatMessage) => string;
  scheduleLastAssistantMessageSync: () => void;
  syncLastAssistantMessage: () => void;
};

function createHarness() {
  defineEasyAgentChatElement();
  return document.createElement("easy-agent-chat") as ElementMarkdownHarness;
}

describe("EasyAgentChatElement Markdown rendering", () => {
  it("renders assistant Markdown while keeping the text mode fallback", () => {
    const element = createHarness();
    const message = { role: "assistant", content: "**完成**" } as const;

    expect(element.renderMessageBubble(message)).toContain("<strong>完成</strong>");

    element.renderMode = "text";

    expect(element.renderMessageBubble(message)).toContain("**完成**");
    expect(element.renderMessageBubble(message)).not.toContain("<strong>");
    expect(element.renderMessageBubble(message)).toContain("message__content--text");
  });

  it("coalesces streaming message updates into one animation frame", () => {
    const element = createHarness();
    let callback: FrameRequestCallback | undefined;
    const requestAnimationFrame = vi.fn((nextCallback: FrameRequestCallback) => {
      callback = nextCallback;
      return 1;
    });
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: requestAnimationFrame
    });
    element.syncLastAssistantMessage = vi.fn();

    element.scheduleLastAssistantMessageSync();
    element.scheduleLastAssistantMessageSync();

    expect(requestAnimationFrame).toHaveBeenCalledOnce();

    callback?.(0);

    expect(element.syncLastAssistantMessage).toHaveBeenCalledOnce();
  });
});
