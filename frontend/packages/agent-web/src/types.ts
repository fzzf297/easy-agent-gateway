export type AgentTheme = "light" | "dark";
export type AgentHeaders = Record<string, string>;

export interface AgentClientOptions {
  apiBaseUrl: string;
  headers?: AgentHeaders;
  fetchImpl?: typeof fetch;
}

export interface CreateSessionRequest {
  user_label?: string;
}

export interface AgentSession {
  sessionId: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentHistoryMessage {
  role: string;
  content: string;
  createdAt: string;
}

export interface AgentHistory {
  sessionId: string;
  messages: AgentHistoryMessage[];
}

export interface RawSseEvent {
  id?: string;
  event?: string;
  data: string;
}

export interface AgentSseEvent<TPayload = unknown> {
  id?: string;
  type: string;
  payload?: TPayload;
}

export interface SendMessageOptions {
  lastEventId?: string;
  signal?: AbortSignal;
  onEvent?: (event: AgentSseEvent) => void;
}

export interface AgentChatElementProps {
  apiBaseUrl: string;
  sessionId?: string;
  userLabel?: string;
  title?: string;
  placeholder?: string;
  theme?: AgentTheme;
  headers?: AgentHeaders;
}

export type AgentChatCustomEvent<TDetail> = CustomEvent<TDetail>;

export interface AgentChatEventDetailMap {
  "session-created": AgentSession;
  "message-start": { sessionId: string; content: string };
  "message-delta": { sessionId: string; text: string };
  "message-done": { sessionId: string; content: string };
  "agent-error": { sessionId?: string; message: string; detail?: unknown };
}
