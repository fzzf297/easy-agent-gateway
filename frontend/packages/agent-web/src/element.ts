import { AgentClient } from "./client";
import { elementStyles } from "./styles";
import type {
  AgentChatEventDetailMap,
  AgentHeaders,
  AgentHistoryMessage,
  AgentSseEvent,
  AgentTheme
} from "./types";

type ChatMessage = Pick<AgentHistoryMessage, "role" | "content">;

const TAG_NAME = "easy-agent-chat";

export class EasyAgentChatElement extends HTMLElement {
  static get observedAttributes() {
    return ["api-base-url", "session-id", "user-label", "title", "placeholder", "theme"];
  }

  headers: AgentHeaders = {};

  private messages: ChatMessage[] = [];
  private loading = false;
  private statusText = "Ready";
  private inputValue = "";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  get apiBaseUrl() {
    return this.getAttribute("api-base-url") || "";
  }

  set apiBaseUrl(value: string) {
    this.setAttribute("api-base-url", value);
  }

  get sessionId() {
    return this.getAttribute("session-id") || "";
  }

  set sessionId(value: string) {
    if (value) this.setAttribute("session-id", value);
    else this.removeAttribute("session-id");
  }

  get userLabel() {
    return this.getAttribute("user-label") || "";
  }

  set userLabel(value: string) {
    this.setAttribute("user-label", value);
  }

  get title() {
    return this.getAttribute("title") || "AI 助手";
  }

  set title(value: string) {
    this.setAttribute("title", value);
  }

  get placeholder() {
    return this.getAttribute("placeholder") || "请输入问题";
  }

  set placeholder(value: string) {
    this.setAttribute("placeholder", value);
  }

  get theme(): AgentTheme {
    return (this.getAttribute("theme") as AgentTheme) || "light";
  }

  set theme(value: AgentTheme) {
    this.setAttribute("theme", value);
  }

  private get client() {
    return new AgentClient({
      apiBaseUrl: this.apiBaseUrl,
      headers: this.headers
    });
  }

  private async handleSubmit(event: Event) {
    event.preventDefault();
    const input = this.shadowRoot?.querySelector<HTMLInputElement>(".input");
    const content = input?.value.trim() || "";
    if (!content || this.loading) return;

    if (!this.apiBaseUrl && this.apiBaseUrl !== "") {
      this.fail("apiBaseUrl is required");
      return;
    }

    this.loading = true;
    this.inputValue = "";
    this.statusText = "Thinking";
    this.messages.push({ role: "user", content });
    this.messages.push({ role: "assistant", content: "" });
    this.render();

    try {
      let sessionId = this.sessionId;
      if (!sessionId) {
        const session = await this.client.createSession(this.userLabel);
        sessionId = session.sessionId;
        this.sessionId = session.sessionId;
        this.emit("session-created", session);
      }

      this.emit("message-start", { sessionId, content });
      await this.client.sendMessage(sessionId, content, {
        onEvent: (agentEvent) => this.handleAgentEvent(sessionId, agentEvent)
      });
    } catch (error) {
      this.fail(error instanceof Error ? error.message : "Agent request failed", error);
    } finally {
      this.loading = false;
      this.statusText = "Ready";
      this.render();
    }
  }

  private handleAgentEvent(sessionId: string, event: AgentSseEvent) {
    if (event.type === "text") {
      const text = typeof event.payload === "string" ? event.payload : "";
      this.appendAssistantText(text);
      this.emit("message-delta", { sessionId, text });
      this.render();
      return;
    }

    if (event.type === "tool_status") {
      this.statusText = "Tool finished";
      this.render();
      return;
    }

    if (event.type === "done") {
      const payload = event.payload as { assistantContent?: string } | undefined;
      const content = payload?.assistantContent || this.currentAssistantContent();
      this.replaceAssistantText(content);
      this.emit("message-done", { sessionId, content });
      this.render();
      return;
    }

    if (event.type === "error") {
      const payload = event.payload as { code?: string } | undefined;
      this.fail(payload?.code || "Agent returned an error", event.payload);
    }
  }

  private appendAssistantText(text: string) {
    const last = this.messages[this.messages.length - 1];
    if (last?.role === "assistant") {
      last.content += text;
    }
  }

  private replaceAssistantText(text: string) {
    const last = this.messages[this.messages.length - 1];
    if (last?.role === "assistant") {
      last.content = text;
    }
  }

  private currentAssistantContent() {
    const last = this.messages[this.messages.length - 1];
    return last?.role === "assistant" ? last.content : "";
  }

  private fail(message: string, detail?: unknown) {
    this.statusText = message;
    this.emit("agent-error", {
      sessionId: this.sessionId || undefined,
      message,
      detail
    });
    this.render();
  }

  private emit<TName extends keyof AgentChatEventDetailMap>(
    name: TName,
    detail: AgentChatEventDetailMap[TName]
  ) {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail,
        bubbles: true,
        composed: true
      })
    );
  }

  private render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <section class="chat" part="chat">
        <header class="header" part="header">
          <div class="title">${escapeHtml(this.title)}</div>
          <div class="status">${escapeHtml(this.statusText)}</div>
        </header>
        <div class="messages" part="messages">
          ${this.renderMessages()}
        </div>
        <form class="composer" part="composer">
          <input class="input" part="input" value="${escapeAttribute(this.inputValue)}" placeholder="${escapeAttribute(
            this.placeholder
          )}" ${this.loading ? "disabled" : ""} />
          <button class="button" part="button" type="submit" ${this.loading ? "disabled" : ""}>
            发送
          </button>
        </form>
      </section>
    `;

    const form = this.shadowRoot.querySelector<HTMLFormElement>(".composer");
    const input = this.shadowRoot.querySelector<HTMLInputElement>(".input");
    input?.addEventListener("input", () => {
      this.inputValue = input.value;
    });
    form?.addEventListener("submit", (event) => this.handleSubmit(event));
  }

  private renderMessages() {
    if (!this.messages.length) {
      return `<div class="empty">开始提问，Agent 会按后台配置调用已授权能力。</div>`;
    }
    return this.messages
      .map(
        (message) =>
          `<div class="message ${message.role}" part="message">${escapeHtml(message.content)}</div>`
      )
      .join("");
  }
}

export function defineEasyAgentChatElement() {
  if (typeof window === "undefined" || !window.customElements) return;
  if (!window.customElements.get(TAG_NAME)) {
    window.customElements.define(TAG_NAME, EasyAgentChatElement);
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replaceAll("\n", " ");
}
