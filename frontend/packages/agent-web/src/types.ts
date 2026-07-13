export type AgentTheme = "light" | "dark";
export type AgentHeaders = Record<string, string>;

export interface AgentClientOptions {
  apiBaseUrl: string;
  headers?: AgentHeaders;
  fetchImpl?: typeof fetch;
}

export interface AgentHealth {
  status: "ok" | "degraded";
  admin: "ok" | "unhealthy" | "unreachable" | "unknown";
  model: string;
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

export type AgentMessageRole = "user" | "assistant";

export interface AgentHistoryMessage {
  role: AgentMessageRole;
  content: string;
  createdAt: string;
}

export interface AgentHistory {
  sessionId: string;
  messages: AgentHistoryMessage[];
}

export interface AgentScoreInput {
  score: number;
  comment?: string;
}

export interface AgentSessionScore {
  sessionId: string;
  userLabel: string;
  score: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentInterfaceTestInput {
  projectCode: string;
  interfaceCode: string;
  params?: Record<string, unknown>;
}

export interface AgentInterfaceTestError {
  code: string;
  statusCode: number;
}

export interface AgentInterfaceTestResult<TData = unknown> {
  ok: boolean;
  projectCode: string;
  interfaceCode: string;
  durationMs: number;
  authUsed: boolean;
  data: TData | null;
  preview: string;
  error: AgentInterfaceTestError | null;
}

export interface AgentAuditQuery {
  sessionId?: string;
  page?: number;
  pageSize?: number;
  includeMessages?: boolean;
  includeScore?: boolean;
  includeSessions?: boolean;
}

export interface AgentAuditEvent {
  id: number;
  sessionId: string | null;
  action: string;
  detail: Record<string, unknown>;
  createdAt: string;
}

export interface AgentAuditSession {
  sessionId: string;
  userLabel: string;
  summary: string;
  score: number | null;
  scoreComment: string | null;
  scoreUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentAuditResponse {
  items: AgentAuditEvent[];
  page: number;
  pageSize: number;
  messages?: AgentHistoryMessage[];
  score?: AgentSessionScore | null;
  sessions?: AgentAuditSession[];
}

export interface RawSseEvent {
  id?: string;
  event?: string;
  data: string;
}

export interface AgentTextEvent {
  id?: string;
  type: "text";
  payload: string;
}

export interface AgentToolStatusEvent {
  id?: string;
  type: "tool_status";
  payload: { node: string; status: "done" };
}

export interface AgentDoneEvent {
  id?: string;
  type: "done";
  payload: { assistantContent: string };
}

export interface AgentStreamErrorEvent {
  id?: string;
  type: "error";
  payload: { code: string; status_code: number };
}

export type AgentSseEvent =
  | AgentTextEvent
  | AgentToolStatusEvent
  | AgentDoneEvent
  | AgentStreamErrorEvent;

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
