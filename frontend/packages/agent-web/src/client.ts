import { normalizeAgentEvent, SseStreamParser } from "./sse";
import type {
  AgentAuditQuery,
  AgentAuditResponse,
  AgentClientOptions,
  AgentHealth,
  AgentHistory,
  AgentInterfaceTestInput,
  AgentInterfaceTestResult,
  AgentScoreInput,
  AgentSession,
  AgentSessionScore,
  SendMessageOptions
} from "./types";

export function buildAgentUrl(apiBaseUrl: string, path: string): string {
  const base = apiBaseUrl.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

export class AgentApiError extends Error {
  readonly status: number;
  readonly detail: string;
  readonly retryAfter?: number;
  readonly payload: unknown;

  constructor(status: number, detail: string, payload?: unknown, retryAfter?: number) {
    super(detail);
    this.name = "AgentApiError";
    this.status = status;
    this.detail = detail;
    this.payload = payload;
    this.retryAfter = retryAfter;
  }
}

export class AgentClient {
  private readonly apiBaseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly fetchImpl: typeof fetch;

  constructor(options: AgentClientOptions) {
    if (!options.apiBaseUrl && options.apiBaseUrl !== "") {
      throw new Error("apiBaseUrl is required");
    }
    this.apiBaseUrl = options.apiBaseUrl;
    this.headers = options.headers || {};
    this.fetchImpl = options.fetchImpl || globalThis.fetch.bind(globalThis);
  }

  async getHealth(): Promise<AgentHealth> {
    const response = await this.fetchImpl(buildAgentUrl(this.apiBaseUrl, "/agent/health"), {
      headers: this.defaultHeaders()
    });
    return this.readJson<AgentHealth>(response);
  }

  async createSession(userLabel = ""): Promise<AgentSession> {
    const response = await this.fetchImpl(buildAgentUrl(this.apiBaseUrl, "/api/agent/sessions"), {
      method: "POST",
      headers: this.jsonHeaders(),
      body: JSON.stringify({ user_label: userLabel })
    });
    return this.readJson<AgentSession>(response);
  }

  async getHistory(sessionId: string): Promise<AgentHistory> {
    const response = await this.fetchImpl(
      buildAgentUrl(
        this.apiBaseUrl,
        `/api/agent/sessions/${encodeURIComponent(sessionId)}/history`
      ),
      { headers: this.defaultHeaders() }
    );
    return this.readJson<AgentHistory>(response);
  }

  async scoreSession(sessionId: string, input: AgentScoreInput): Promise<AgentSessionScore> {
    const response = await this.fetchImpl(
      buildAgentUrl(this.apiBaseUrl, `/api/agent/sessions/${encodeURIComponent(sessionId)}/score`),
      {
        method: "PUT",
        headers: this.jsonHeaders(),
        body: JSON.stringify({ score: input.score, comment: input.comment || "" })
      }
    );
    return this.readJson<AgentSessionScore>(response);
  }

  async testInterface<TData = unknown>(
    input: AgentInterfaceTestInput
  ): Promise<AgentInterfaceTestResult<TData>> {
    const response = await this.fetchImpl(
      buildAgentUrl(this.apiBaseUrl, "/api/agent/interfaces/test"),
      {
        method: "POST",
        headers: this.jsonHeaders(),
        body: JSON.stringify({ ...input, params: input.params || {} })
      }
    );
    return this.readJson<AgentInterfaceTestResult<TData>>(response);
  }

  async getAudit(query: AgentAuditQuery = {}): Promise<AgentAuditResponse> {
    const search = new URLSearchParams();
    if (query.sessionId) search.set("sessionId", query.sessionId);
    if (query.page !== undefined) search.set("page", String(query.page));
    if (query.pageSize !== undefined) search.set("pageSize", String(query.pageSize));
    if (query.includeMessages !== undefined) {
      search.set("includeMessages", String(query.includeMessages));
    }
    if (query.includeScore !== undefined) search.set("includeScore", String(query.includeScore));
    if (query.includeSessions !== undefined) {
      search.set("includeSessions", String(query.includeSessions));
    }
    const suffix = search.size ? `?${search.toString()}` : "";
    const response = await this.fetchImpl(
      buildAgentUrl(this.apiBaseUrl, `/api/agent/audit${suffix}`),
      { headers: this.defaultHeaders() }
    );
    return this.readJson<AgentAuditResponse>(response);
  }

  async sendMessage(sessionId: string, content: string, options: SendMessageOptions = {}) {
    const headers = this.jsonHeaders({ Accept: "text/event-stream" });
    if (options.lastEventId) headers["Last-Event-ID"] = options.lastEventId;

    const response = await this.fetchImpl(
      buildAgentUrl(
        this.apiBaseUrl,
        `/api/agent/sessions/${encodeURIComponent(sessionId)}/messages`
      ),
      {
        method: "POST",
        headers,
        body: JSON.stringify({ content }),
        signal: options.signal
      }
    );

    if (!response.ok) throw await this.createApiError(response);
    if (!response.body) throw new Error("SSE response body is not readable");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const parser = new SseStreamParser();
    const emit = (rawEvents: ReturnType<SseStreamParser["push"]>) => {
      for (const rawEvent of rawEvents) {
        const event = normalizeAgentEvent(rawEvent);
        options.onEvent?.(event);
      }
    };

    try {
      let streamEnded = false;
      while (!streamEnded) {
        const { value, done } = await reader.read();
        streamEnded = done;
        if (!done) emit(parser.push(decoder.decode(value, { stream: true })));
      }
      emit([...parser.push(decoder.decode()), ...parser.flush()]);
    } finally {
      reader.releaseLock();
    }
  }

  private defaultHeaders(extra: Record<string, string> = {}) {
    return { ...this.headers, ...extra };
  }

  private jsonHeaders(extra: Record<string, string> = {}) {
    return this.defaultHeaders({ "Content-Type": "application/json", ...extra });
  }

  private async readJson<T>(response: Response): Promise<T> {
    if (!response.ok) throw await this.createApiError(response);
    return response.json() as Promise<T>;
  }

  private async createApiError(response: Response): Promise<AgentApiError> {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return new AgentApiError(response.status, `${response.status} ${response.statusText}`);
    }

    const record = isRecord(payload) ? payload : {};
    const detail = typeof record.detail === "string" ? record.detail : JSON.stringify(payload);
    const retryAfter = typeof record.retryAfter === "number" ? record.retryAfter : undefined;
    return new AgentApiError(response.status, detail, payload, retryAfter);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
