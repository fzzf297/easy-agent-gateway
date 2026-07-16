export type Status = "enabled" | "disabled";
export type AdminStatus = "active" | "disabled";
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type AuthMode = "none" | "bearer" | "api_key" | "signature";

export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminUser {
  id: number;
  username: string;
  displayName: string;
  status: AdminStatus;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: AdminUser;
}

export interface Project {
  id: number;
  code: string;
  name: string;
  description: string;
  baseUrl: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPayload {
  code: string;
  name: string;
  description?: string;
  baseUrl?: string;
  status?: Status;
}

export interface AdminPage {
  id: number;
  projectId: number;
  code: string;
  name: string;
  route: string;
  sortOrder: number;
  status: Status;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PagePayload {
  code: string;
  name: string;
  route: string;
  sortOrder?: number;
  status?: Status;
  config?: Record<string, unknown>;
}

export interface AppInterface {
  id: number;
  projectId: number;
  code: string;
  name: string;
  method: HttpMethod;
  path: string;
  authMode: AuthMode;
  status: Status;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicInterface extends AppInterface {
  parsedConfig?: Record<string, unknown> | null;
}

export interface InterfacePayload {
  code: string;
  name: string;
  method: HttpMethod;
  path: string;
  authMode?: AuthMode;
  status?: Status;
  description?: string;
}

export interface InterfaceConfig {
  interfaceId: number;
  yamlText: string;
  parsedConfig: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface YamlValidationResult {
  valid: boolean;
  parsedConfig: Record<string, unknown>;
  errors: unknown[];
}

export interface ConfigVersion {
  id: number;
  entityId: number;
  version: number;
  action: string;
  snapshot: Record<string, unknown>;
  createdAt: string;
}

export interface AdminHealth {
  status: string;
}

export interface AgentHealth {
  status: "ok" | "degraded" | string;
  admin: string;
  model: string;
}

export interface InterfaceTestPayload {
  projectCode: string;
  interfaceCode: string;
  params: Record<string, unknown>;
}

export interface InterfaceTestError {
  code: string;
  statusCode: number;
}

export interface InterfaceTestResult {
  ok: boolean;
  projectCode: string;
  interfaceCode: string;
  durationMs: number;
  authUsed: boolean;
  data: unknown;
  preview: string;
  error: InterfaceTestError | null;
}

export interface AgentMessage {
  role: string;
  content: string;
  createdAt: string;
}

export interface AgentScore {
  sessionId: string;
  userLabel: string;
  score: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentSessionSummary {
  sessionId: string;
  userLabel: string;
  summary: string;
  score: number | null;
  scoreComment: string | null;
  scoreUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentAuditEvent {
  id: number;
  sessionId: string | null;
  action: string;
  detail: Record<string, unknown>;
  createdAt: string;
}

export interface AgentAuditQuery {
  sessionId?: string;
  page?: number;
  pageSize?: number;
  includeMessages?: boolean;
  includeScore?: boolean;
  includeSessions?: boolean;
}

export interface AgentAuditResponse {
  items: AgentAuditEvent[];
  total: number;
  page: number;
  pageSize: number;
  messages?: AgentMessage[];
  score?: AgentScore | null;
  sessions?: AgentSessionSummary[];
}
