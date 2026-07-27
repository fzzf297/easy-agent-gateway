export type AgentTheme = "light" | "dark";
export type AgentRenderMode = "markdown" | "text";
export type AgentA2UIMode = "auto" | "off";
export type AgentResponseMode = "TEXT" | "TEXT_WITH_A2UI" | "A2UI_ONLY";
export type AgentHeaders = Record<string, string>;

export type AgentA2UIProtocolVersion = "v0.9" | "v0.9.1";
export type AgentA2UIDynamicValue<T> = T | { path: string };

export interface AgentA2UIComponent {
  id: string;
  component: string;
  [property: string]: unknown;
}

export interface AgentA2UICreateSurfaceMessage {
  version: AgentA2UIProtocolVersion;
  createSurface: {
    surfaceId: string;
    catalogId: string;
    theme?: unknown;
    sendDataModel?: boolean;
  };
}

export interface AgentA2UIUpdateComponentsMessage {
  version: AgentA2UIProtocolVersion;
  updateComponents: {
    surfaceId: string;
    components: AgentA2UIComponent[];
  };
}

export interface AgentA2UIUpdateDataModelMessage {
  version: AgentA2UIProtocolVersion;
  updateDataModel: {
    surfaceId: string;
    path?: string;
    value?: unknown;
  };
}

export interface AgentA2UIDeleteSurfaceMessage {
  version: AgentA2UIProtocolVersion;
  deleteSurface: { surfaceId: string };
}

export type AgentA2UIMessage =
  | AgentA2UICreateSurfaceMessage
  | AgentA2UIUpdateComponentsMessage
  | AgentA2UIUpdateDataModelMessage
  | AgentA2UIDeleteSurfaceMessage;

export interface AgentA2UIAction {
  name: string;
  surfaceId: string;
  sourceComponentId: string;
  timestamp: string;
  context: Record<string, unknown>;
}

export interface AgentA2UIActionInput {
  conversationId: string;
  messageId?: string;
  surfaceId: string;
  idempotencyKey: string;
  action: { name: string; context: Record<string, unknown> };
}

export interface AgentA2UIActionResult {
  ok: boolean;
  message: string;
  responseMode: AgentResponseMode;
  text: string;
  a2uiMessages: AgentA2UIMessage[];
}

export interface AgentA2UICatalog {
  catalogId: string;
  version: string;
  protocolVersion: AgentA2UIProtocolVersion;
  components: string[];
  componentSchemas: Record<string, Record<string, unknown>>;
  actions: string[];
}

export type AgentA2UIErrorPhase = "normalize" | "render" | "action" | "history";

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
  responseMode?: AgentResponseMode;
  surfaceIds?: string[];
  a2uiMessages?: AgentA2UIMessage[];
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

export interface AgentTextDeltaEvent {
  id?: string;
  type: "text-delta";
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
  payload: {
    assistantContent: string;
    responseMode?: AgentResponseMode;
    surfaceIds?: string[];
  };
}

export interface AgentStreamErrorEvent {
  id?: string;
  type: "error";
  payload: { code: string; status_code: number };
}

export interface AgentA2UIMessageEvent {
  id?: string;
  type: "a2ui-message";
  payload: AgentA2UIMessage | Record<string, unknown>;
}

export type AgentSseEvent =
  | AgentTextEvent
  | AgentTextDeltaEvent
  | AgentToolStatusEvent
  | AgentA2UIMessageEvent
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
  renderMode?: AgentRenderMode;
  a2uiMode?: AgentA2UIMode;
  headers?: AgentHeaders;
}

export type AgentChatCustomEvent<TDetail> = CustomEvent<TDetail>;

export interface AgentChatEventDetailMap {
  "session-created": AgentSession;
  "message-start": { sessionId: string; content: string };
  "message-delta": { sessionId: string; text: string; protocol?: "text-delta" };
  "message-done": {
    sessionId: string;
    content: string;
    responseMode?: AgentResponseMode;
    surfaceIds: string[];
  };
  "a2ui-message": {
    sessionId: string;
    message: AgentA2UIMessage | Record<string, unknown>;
    surfaceId?: string;
  };
  "a2ui-action-start": {
    sessionId: string;
    action: AgentA2UIAction;
    idempotencyKey: string;
  };
  "a2ui-action-done": {
    sessionId: string;
    action: AgentA2UIAction;
    idempotencyKey: string;
    result: AgentA2UIActionResult;
  };
  "a2ui-error": {
    sessionId?: string;
    surfaceId?: string;
    phase: AgentA2UIErrorPhase;
    message: string;
    detail?: unknown;
  };
  "agent-error": { sessionId?: string; message: string; detail?: unknown };
}
