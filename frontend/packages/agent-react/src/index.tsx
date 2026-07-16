import "@easy-agent-gateway/agent-web";

import React, { useEffect, useRef } from "react";
import type {
  AgentChatEventDetailMap,
  AgentHeaders,
  AgentTheme
} from "@easy-agent-gateway/agent-web";

type EasyAgentElement = HTMLElement & {
  headers?: AgentHeaders;
};
type AgentChatEventName = Extract<keyof AgentChatEventDetailMap, string>;

export interface AgentChatProps {
  apiBaseUrl: string;
  sessionId?: string;
  userLabel?: string;
  title?: string;
  placeholder?: string;
  theme?: AgentTheme;
  headers?: AgentHeaders;
  className?: string;
  style?: React.CSSProperties;
  onSessionCreated?: (detail: AgentChatEventDetailMap["session-created"]) => void;
  onMessageStart?: (detail: AgentChatEventDetailMap["message-start"]) => void;
  onMessageDelta?: (detail: AgentChatEventDetailMap["message-delta"]) => void;
  onMessageDone?: (detail: AgentChatEventDetailMap["message-done"]) => void;
  onAgentError?: (detail: AgentChatEventDetailMap["agent-error"]) => void;
}

export function AgentChat({
  apiBaseUrl,
  sessionId,
  userLabel,
  title,
  placeholder,
  theme,
  headers,
  className,
  style,
  onSessionCreated,
  onMessageStart,
  onMessageDelta,
  onMessageDone,
  onAgentError
}: AgentChatProps) {
  const ref = useRef<EasyAgentElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.headers = headers || {};
    }
  }, [headers]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const listeners: Array<[AgentChatEventName, EventListener]> = [
      ["session-created", (event) => onSessionCreated?.((event as CustomEvent).detail)],
      ["message-start", (event) => onMessageStart?.((event as CustomEvent).detail)],
      ["message-delta", (event) => onMessageDelta?.((event as CustomEvent).detail)],
      ["message-done", (event) => onMessageDone?.((event as CustomEvent).detail)],
      ["agent-error", (event) => onAgentError?.((event as CustomEvent).detail)]
    ];

    for (const [name, listener] of listeners) {
      element.addEventListener(name, listener);
    }

    return () => {
      for (const [name, listener] of listeners) {
        element.removeEventListener(name, listener);
      }
    };
  }, [onAgentError, onMessageDelta, onMessageDone, onMessageStart, onSessionCreated]);

  return React.createElement("easy-agent-chat", {
    ref,
    class: className,
    style,
    "api-base-url": apiBaseUrl,
    "session-id": sessionId,
    "user-label": userLabel,
    title,
    placeholder,
    theme
  });
}

export default AgentChat;
