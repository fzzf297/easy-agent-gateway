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
type PanelMode = "drawer" | "window";
type WindowPosition = { left: number; top: number };
type WindowSize = { width: number; height: number };
type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const TAG_NAME = "easy-agent-chat";
const DRAWER_MIN_WIDTH = 430;
const WINDOW_MIN_WIDTH = 430;
const WINDOW_MIN_HEIGHT = 650;
const VIEWPORT_MARGIN = 8;
const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

export class EasyAgentChatElement extends HTMLElementBase {
  static get observedAttributes() {
    return ["api-base-url", "session-id", "user-label", "title", "placeholder", "theme"];
  }

  headers: AgentHeaders = {};

  private messages: ChatMessage[] = [];
  private loading = false;
  private statusText = "Ready";
  private inputValue = "";
  private opened = false;
  private panelMode: PanelMode = "drawer";
  private drawerWidth = DRAWER_MIN_WIDTH;
  private windowPosition?: WindowPosition;
  private windowSize?: WindowSize;
  private animatePanel = false;
  private requestFailed = false;

  constructor() {
    super();
    this.attachShadow?.({ mode: "open" });
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

    this.loading = true;
    this.requestFailed = false;
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
      this.requestFailed = true;
      this.fail(error instanceof Error ? error.message : "Agent request failed", error);
    } finally {
      this.loading = false;
      if (!this.requestFailed) this.statusText = "Ready";
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
      this.requestFailed = true;
      this.fail(payload?.code || "Agent returned an error", event.payload);
    }
  }

  private appendAssistantText(text: string) {
    const last = this.messages[this.messages.length - 1];
    if (last?.role === "assistant") last.content += text;
  }

  private replaceAssistantText(text: string) {
    const last = this.messages[this.messages.length - 1];
    if (last?.role === "assistant") last.content = text;
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
      ${this.opened ? this.renderPanel() : this.renderLauncher()}
    `;
    this.animatePanel = false;

    const launcher = this.shadowRoot.querySelector<HTMLButtonElement>(".launcher");
    launcher?.addEventListener("click", () => {
      this.opened = true;
      this.animatePanel = true;
      this.render();
      this.shadowRoot?.querySelector<HTMLInputElement>(".input")?.focus();
    });

    const closeButton = this.shadowRoot.querySelector<HTMLButtonElement>("[data-action='close']");
    closeButton?.addEventListener("click", () => {
      this.opened = false;
      this.render();
    });

    const modeButton = this.shadowRoot.querySelector<HTMLButtonElement>("[data-action='mode']");
    modeButton?.addEventListener("click", () => {
      this.panelMode = this.panelMode === "drawer" ? "window" : "drawer";
      this.animatePanel = true;
      this.render();
    });

    const form = this.shadowRoot.querySelector<HTMLFormElement>(".composer");
    const input = this.shadowRoot.querySelector<HTMLInputElement>(".input");
    input?.addEventListener("input", () => {
      this.inputValue = input.value;
    });
    form?.addEventListener("submit", (event) => this.handleSubmit(event));

    const panel = this.shadowRoot.querySelector<HTMLElement>(".panel--window");
    const header = this.shadowRoot.querySelector<HTMLElement>(".panel--window .header");
    if (panel && header) this.bindWindowDragging(header, panel);
    if (panel) {
      this.shadowRoot
        .querySelectorAll<HTMLElement>(".panel--window [data-resize]")
        .forEach((handle) => this.bindWindowResizing(handle, panel));
    }

    const drawer = this.shadowRoot.querySelector<HTMLElement>(".panel--drawer");
    const drawerResizeHandle = this.shadowRoot.querySelector<HTMLElement>(
      ".panel--drawer [data-resize='w']"
    );
    if (drawer && drawerResizeHandle) this.bindDrawerResizing(drawerResizeHandle, drawer);

    const messages = this.shadowRoot.querySelector<HTMLElement>(".messages");
    if (messages) messages.scrollTop = messages.scrollHeight;
  }

  private renderLauncher() {
    return `
      <button class="launcher" part="launcher" type="button" aria-label="打开${escapeAttribute(
        this.title
      )}" title="打开${escapeAttribute(this.title)}">
        ${chatIcon}
      </button>
    `;
  }

  private renderPanel() {
    const isWindow = this.panelMode === "window";
    const panelStyle = this.getPanelStyle(isWindow);
    const modeLabel = isWindow ? "切换为右侧抽屉" : "切换为可拖拽浮窗";
    const enterClass = this.animatePanel ? " panel--enter" : "";

    return `
      <section class="panel panel--${this.panelMode}${enterClass}" part="panel"${panelStyle}>
        <header class="header" part="header">
          <div class="header__identity">
            <span class="header__mark">${sparkIcon}</span>
            <span class="header__copy">
              <span class="title">${escapeHtml(this.title)}</span>
              <span class="status"><i></i>${escapeHtml(this.getStatusLabel())}</span>
            </span>
          </div>
          <div class="header__actions">
            <button class="icon-button" data-action="mode" type="button" aria-label="${modeLabel}" title="${modeLabel}">
              ${isWindow ? drawerIcon : windowIcon}
            </button>
            <button class="icon-button" data-action="close" type="button" aria-label="关闭" title="关闭">
              ${closeIcon}
            </button>
          </div>
        </header>
        <div class="messages" part="messages">
          ${this.renderMessages()}
        </div>
        <form class="composer" part="composer">
          <input class="input" part="input" value="${escapeAttribute(
            this.inputValue
          )}" placeholder="${escapeAttribute(this.placeholder)}" ${this.loading ? "disabled" : ""} />
          <button class="send-button" part="button" type="submit" aria-label="发送" ${
            this.loading ? "disabled" : ""
          }>
            ${sendIcon}
          </button>
        </form>
        ${isWindow ? windowResizeHandles : drawerResizeHandle}
      </section>
    `;
  }

  private getPanelStyle(isWindow: boolean) {
    if (!isWindow) {
      const width = Math.min(this.drawerWidth, window.innerWidth);
      return ` style="width:${width}px"`;
    }

    const styles: string[] = [];
    if (this.windowPosition) {
      styles.push(
        `left:${this.windowPosition.left}px`,
        `top:${this.windowPosition.top}px`,
        "right:auto",
        "bottom:auto"
      );
    }
    if (this.windowSize) {
      styles.push(`width:${this.windowSize.width}px`, `height:${this.windowSize.height}px`);
    }
    return styles.length ? ` style="${styles.join(";")}"` : "";
  }

  private bindDrawerResizing(handle: HTMLElement, panel: HTMLElement) {
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;

      event.preventDefault();
      const startX = event.clientX;
      const startWidth = panel.getBoundingClientRect().width;

      const handleMove = (moveEvent: PointerEvent) => {
        const minWidth = Math.min(DRAWER_MIN_WIDTH, window.innerWidth);
        const width = clamp(startWidth - (moveEvent.clientX - startX), minWidth, window.innerWidth);
        this.drawerWidth = width;
        panel.style.width = `${width}px`;
      };

      const handleUp = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        window.removeEventListener("pointercancel", handleUp);
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      window.addEventListener("pointercancel", handleUp);
    });
  }

  private bindWindowDragging(header: HTMLElement, panel: HTMLElement) {
    header.addEventListener("pointerdown", (event) => {
      const target = event.target;
      if ((target instanceof Element && target.closest("button")) || event.button !== 0) return;

      const panelRect = panel.getBoundingClientRect();
      const offsetX = event.clientX - panelRect.left;
      const offsetY = event.clientY - panelRect.top;
      header.setPointerCapture(event.pointerId);

      const handleMove = (moveEvent: PointerEvent) => {
        const left = Math.min(
          Math.max(VIEWPORT_MARGIN, moveEvent.clientX - offsetX),
          Math.max(VIEWPORT_MARGIN, window.innerWidth - panelRect.width - VIEWPORT_MARGIN)
        );
        const top = Math.min(
          Math.max(VIEWPORT_MARGIN, moveEvent.clientY - offsetY),
          Math.max(VIEWPORT_MARGIN, window.innerHeight - panelRect.height - VIEWPORT_MARGIN)
        );
        this.windowPosition = { left, top };
        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;
        panel.style.right = "auto";
        panel.style.bottom = "auto";
      };

      const handleUp = (upEvent: PointerEvent) => {
        header.releasePointerCapture(upEvent.pointerId);
        header.removeEventListener("pointermove", handleMove);
        header.removeEventListener("pointerup", handleUp);
        header.removeEventListener("pointercancel", handleUp);
      };

      header.addEventListener("pointermove", handleMove);
      header.addEventListener("pointerup", handleUp);
      header.addEventListener("pointercancel", handleUp);
    });
  }

  private bindWindowResizing(handle: HTMLElement, panel: HTMLElement) {
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;

      const direction = handle.dataset.resize as ResizeDirection | undefined;
      if (!direction) return;

      event.preventDefault();
      event.stopPropagation();
      const startRect = panel.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const startRight = startRect.right;
      const startBottom = startRect.bottom;
      const minimum = this.getWindowMinimumSize();

      const handleMove = (moveEvent: PointerEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        let left = startRect.left;
        let top = startRect.top;
        let width = startRect.width;
        let height = startRect.height;

        if (direction.includes("e")) {
          width = clamp(
            startRect.width + deltaX,
            minimum.width,
            window.innerWidth - VIEWPORT_MARGIN - startRect.left
          );
        }
        if (direction.includes("w")) {
          left = clamp(
            startRect.left + deltaX,
            VIEWPORT_MARGIN,
            startRight - minimum.width
          );
          width = startRight - left;
        }
        if (direction.includes("s")) {
          height = clamp(
            startRect.height + deltaY,
            minimum.height,
            window.innerHeight - VIEWPORT_MARGIN - startRect.top
          );
        }
        if (direction.includes("n")) {
          top = clamp(
            startRect.top + deltaY,
            VIEWPORT_MARGIN,
            startBottom - minimum.height
          );
          height = startBottom - top;
        }

        this.windowPosition = { left, top };
        this.windowSize = { width, height };
        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;
        panel.style.right = "auto";
        panel.style.bottom = "auto";
        panel.style.width = `${width}px`;
        panel.style.height = `${height}px`;
      };

      const handleUp = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        window.removeEventListener("pointercancel", handleUp);
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      window.addEventListener("pointercancel", handleUp);
    });
  }

  private getWindowMinimumSize(): WindowSize {
    const compact = window.innerWidth <= 480;
    return {
      width: Math.min(WINDOW_MIN_WIDTH, window.innerWidth - (compact ? 16 : 32)),
      height: Math.min(WINDOW_MIN_HEIGHT, window.innerHeight - (compact ? 16 : 122))
    };
  }

  private getStatusLabel() {
    if (this.statusText === "Ready") return "在线";
    if (this.statusText === "Thinking") return "思考中";
    if (this.statusText === "Tool finished") return "工具调用完成";
    return this.statusText;
  }

  private renderMessages() {
    if (!this.messages.length) {
      return `
        <div class="empty">
          <span class="empty__icon">${sparkIcon}</span>
          <strong>你好，我是${escapeHtml(this.title)}</strong>
          <span>可以直接询问业务问题，我会按后台配置调用已授权能力。</span>
        </div>
      `;
    }
    return this.messages
      .map(
        (message) => `
          <div class="message-row message-row--${message.role}">
            <div class="message ${message.role}" part="message">${escapeHtml(message.content)}</div>
          </div>
        `
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

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

const drawerResizeHandle = `
  <span class="resize-handle resize-handle--w" data-resize="w" aria-hidden="true"></span>
`;

const windowResizeHandles = (["n", "s", "e", "w", "ne", "nw", "se", "sw"] as const)
  .map(
    (direction) =>
      `<span class="resize-handle resize-handle--${direction}" data-resize="${direction}" aria-hidden="true"></span>`
  )
  .join("");

const chatIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7.5 18.2 4 20l.9-3.6A8 8 0 0 1 3 11.3C3 6.7 7 3 12 3s9 3.7 9 8.3-4 8.2-9 8.2c-1.6 0-3.1-.4-4.5-1.3Z" />
    <path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" class="icon-dots" />
  </svg>
`;

const sparkIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.8c.7 4.8 3.4 7.5 8.2 8.2-4.8.7-7.5 3.4-8.2 8.2-.7-4.8-3.4-7.5-8.2-8.2 4.8-.7 7.5-3.4 8.2-8.2Z" />
    <path d="M19 2.8c.2 1.5 1 2.3 2.5 2.5-1.5.2-2.3 1-2.5 2.5-.2-1.5-1-2.3-2.5-2.5 1.5-.2 2.3-1 2.5-2.5Z" />
  </svg>
`;

const windowIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4" y="5" width="16" height="14" rx="2" />
    <path d="M4 9h16" />
  </svg>
`;

const drawerIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M14 4v16" />
  </svg>
`;

const closeIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m7 7 10 10M17 7 7 17" />
  </svg>
`;

const sendIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m4 4 17 8-17 8 3-8-3-8Z" />
    <path d="M7 12h14" />
  </svg>
`;
