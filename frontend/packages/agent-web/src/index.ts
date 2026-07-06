export { AgentClient, buildAgentUrl } from "./client";
export { EasyAgentChatElement, defineEasyAgentChatElement } from "./element";
export { normalizeAgentEvent, parseSseBlock, parseSseText, SseStreamParser } from "./sse";
export type {
  AgentChatCustomEvent,
  AgentChatElementProps,
  AgentChatEventDetailMap,
  AgentClientOptions,
  AgentHeaders,
  AgentHistory,
  AgentHistoryMessage,
  AgentSession,
  AgentSseEvent,
  AgentTheme,
  RawSseEvent,
  SendMessageOptions
} from "./types";

import { defineEasyAgentChatElement } from "./element";

defineEasyAgentChatElement();
