import { normalizeAgentEvent, SseStreamParser } from "./sse";
import type {
  AgentClientOptions,
  AgentHistory,
  AgentSession,
  SendMessageOptions
} from "./types";

export function buildAgentUrl(apiBaseUrl: string, path: string): string {
  const base = apiBaseUrl.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
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
    this.fetchImpl = options.fetchImpl || fetch;
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
      buildAgentUrl(this.apiBaseUrl, `/api/agent/sessions/${sessionId}/history`),
      {
        headers: this.defaultHeaders()
      }
    );
    return this.readJson<AgentHistory>(response);
  }

  async sendMessage(sessionId: string, content: string, options: SendMessageOptions = {}) {
    const headers = this.jsonHeaders({ Accept: "text/event-stream" });
    if (options.lastEventId) headers["Last-Event-ID"] = options.lastEventId;

    const response = await this.fetchImpl(
      buildAgentUrl(this.apiBaseUrl, `/api/agent/sessions/${sessionId}/messages`),
      {
        method: "POST",
        headers,
        body: JSON.stringify({ content }),
        signal: options.signal
      }
    );

    if (!response.ok) {
      throw new Error(await this.readError(response));
    }
    if (!response.body) {
      throw new Error("SSE response body is not readable");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const parser = new SseStreamParser();

    try {
      let isDone = false;
      while (!isDone) {
        const { value, done } = await reader.read();
        isDone = done;
        if (done) continue;
        const chunk = decoder.decode(value, { stream: true });
        for (const rawEvent of parser.push(chunk)) {
          options.onEvent?.(normalizeAgentEvent(rawEvent));
        }
      }

      const tail = decoder.decode();
      const events = [...parser.push(tail), ...parser.flush()];
      for (const rawEvent of events) {
        options.onEvent?.(normalizeAgentEvent(rawEvent));
      }
    } finally {
      reader.releaseLock();
    }
  }

  private defaultHeaders(extra: Record<string, string> = {}) {
    return {
      ...this.headers,
      ...extra
    };
  }

  private jsonHeaders(extra: Record<string, string> = {}) {
    return this.defaultHeaders({
      "Content-Type": "application/json",
      ...extra
    });
  }

  private async readJson<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw new Error(await this.readError(response));
    }
    return response.json() as Promise<T>;
  }

  private async readError(response: Response): Promise<string> {
    try {
      const payload = await response.json();
      if (typeof payload?.detail === "string") return payload.detail;
      return JSON.stringify(payload);
    } catch {
      return `${response.status} ${response.statusText}`;
    }
  }
}
