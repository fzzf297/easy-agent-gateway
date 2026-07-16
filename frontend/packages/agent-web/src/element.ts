import { AgentClient } from "./client";
import { renderMarkdown } from "./markdown";
import { elementStyles } from "./styles";
import type {
  AgentChatEventDetailMap,
  AgentHeaders,
  AgentHistoryMessage,
  AgentRenderMode,
  AgentSseEvent,
  AgentTheme
} from "./types";

type ChatMessage = Pick<AgentHistoryMessage, "role" | "content"> & {
  state?: "pending" | "error";
  error?: string;
};
type PanelMode = "drawer" | "window";
type WindowPosition = { left: number; top: number };
type WindowSize = { width: number; height: number };
type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const TAG_NAME = "easy-agent-chat";
const DRAWER_DEFAULT_WIDTH = 430;
const DRAWER_MIN_WIDTH = 320;
const WINDOW_MIN_WIDTH = 320;
const WINDOW_MIN_HEIGHT = 400;
const VIEWPORT_MARGIN = 8;
const LAUNCHER_DEFAULT_GAP = 28;
const LAUNCHER_DRAG_THRESHOLD = 4;
const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

export class EasyAgentChatElement extends HTMLElementBase {
  static get observedAttributes() {
    return [
      "api-base-url",
      "session-id",
      "user-label",
      "title",
      "placeholder",
      "theme",
      "render-mode"
    ];
  }

  headers: AgentHeaders = {};

  private messages: ChatMessage[] = [];
  private loading = false;
  private statusText = "Ready";
  private inputValue = "";
  private opened = false;
  private panelMode: PanelMode = "drawer";
  private drawerWidth = DRAWER_DEFAULT_WIDTH;
  private launcherPosition?: WindowPosition;
  private windowPosition?: WindowPosition;
  private windowSize?: WindowSize;
  private animatePanel = false;
  private requestFailed = false;
  private stickToBottom = true;
  private suppressLauncherClickUntil = 0;
  private assistantRenderFrame?: number;

  private readonly handleDocumentKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !this.opened || !this.shadowRoot?.activeElement) return;
    event.preventDefault();
    this.closePanel();
  };

  private readonly handleViewportResize = () => {
    this.constrainPanelToViewport();
    this.constrainLauncherToViewport();
  };

  constructor() {
    super();
    this.attachShadow?.({ mode: "open" });
  }

  connectedCallback() {
    this.ownerDocument.addEventListener("keydown", this.handleDocumentKeyDown);
    this.ownerDocument.defaultView?.addEventListener("resize", this.handleViewportResize);
    this.render();
  }

  disconnectedCallback() {
    this.ownerDocument.removeEventListener("keydown", this.handleDocumentKeyDown);
    this.ownerDocument.defaultView?.removeEventListener("resize", this.handleViewportResize);
    this.cancelAssistantRenderFrame();
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

  get renderMode(): AgentRenderMode {
    return this.getAttribute("render-mode") === "text" ? "text" : "markdown";
  }

  set renderMode(value: AgentRenderMode) {
    this.setAttribute("render-mode", value);
  }

  private get client() {
    return new AgentClient({
      apiBaseUrl: this.apiBaseUrl,
      headers: this.headers
    });
  }

  private async handleSubmit(event: Event) {
    event.preventDefault();
    const input = this.shadowRoot?.querySelector<HTMLTextAreaElement>(".input");
    const content = input?.value.trim() || "";
    if (!content || this.loading) return;

    this.loading = true;
    this.requestFailed = false;
    this.inputValue = "";
    this.statusText = "Thinking";
    this.messages.push({ role: "user", content });
    this.messages.push({ role: "assistant", content: "", state: "pending" });
    this.stickToBottom = true;
    this.render();
    this.focusInput();

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
      if (!this.requestFailed) {
        this.statusText = "Ready";
        this.finalizeAssistantMessage();
        this.flushLastAssistantMessageSync();
      }
      this.syncPanelState();
    }
  }

  private handleAgentEvent(sessionId: string, event: AgentSseEvent) {
    if (event.type === "text") {
      const text = typeof event.payload === "string" ? event.payload : "";
      this.appendAssistantText(text);
      this.emit("message-delta", { sessionId, text });
      this.scheduleLastAssistantMessageSync();
      return;
    }

    if (event.type === "tool_status") {
      this.statusText = "Tool finished";
      this.syncPanelState();
      return;
    }

    if (event.type === "done") {
      const payload = event.payload as { assistantContent?: string } | undefined;
      const content = payload?.assistantContent || this.currentAssistantContent();
      this.replaceAssistantText(content);
      this.emit("message-done", { sessionId, content });
      this.flushLastAssistantMessageSync();
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
    if (last?.role === "assistant") {
      last.content = text;
      last.state = undefined;
      last.error = undefined;
    }
  }

  private finalizeAssistantMessage() {
    const last = this.messages[this.messages.length - 1];
    if (last?.role !== "assistant") return;
    last.state = undefined;
    last.error = undefined;
    if (!last.content.trim()) last.content = "暂未返回有效内容。";
  }

  private currentAssistantContent() {
    const last = this.messages[this.messages.length - 1];
    return last?.role === "assistant" ? last.content : "";
  }

  private fail(message: string, detail?: unknown) {
    this.statusText = "Error";
    const last = this.messages[this.messages.length - 1];
    if (last?.role === "assistant") {
      last.state = "error";
      last.error = message;
    } else {
      this.messages.push({ role: "assistant", content: "", state: "error", error: message });
    }
    this.flushLastAssistantMessageSync();
    this.syncPanelState();
    this.emit("agent-error", {
      sessionId: this.sessionId || undefined,
      message,
      detail
    });
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

    const previousMessages = this.shadowRoot.querySelector<HTMLElement>(".messages");
    const previousScrollTop = previousMessages?.scrollTop || 0;
    const restoreInputFocus = this.shadowRoot.activeElement?.classList.contains("input") || false;

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      ${this.opened ? this.renderPanel() : this.renderLauncher()}
    `;
    this.animatePanel = false;

    const launcher = this.shadowRoot.querySelector<HTMLButtonElement>(".launcher");
    launcher?.addEventListener("click", (event) => {
      if (Date.now() < this.suppressLauncherClickUntil) {
        event.preventDefault();
        return;
      }
      this.openPanel();
    });
    if (launcher) this.bindLauncherDragging(launcher);

    const closeButton = this.shadowRoot.querySelector<HTMLButtonElement>("[data-action='close']");
    closeButton?.addEventListener("click", () => {
      this.closePanel();
    });

    const modeButton = this.shadowRoot.querySelector<HTMLButtonElement>("[data-action='mode']");
    modeButton?.addEventListener("click", () => {
      this.panelMode = this.panelMode === "drawer" ? "window" : "drawer";
      this.animatePanel = true;
      this.render();
      this.shadowRoot
        ?.querySelector<HTMLButtonElement>("[data-action='mode']")
        ?.focus({ preventScroll: true });
    });

    const form = this.shadowRoot.querySelector<HTMLFormElement>(".composer");
    const input = this.shadowRoot.querySelector<HTMLTextAreaElement>(".input");
    input?.addEventListener("input", () => {
      this.inputValue = input.value;
      this.resizeComposerInput(input);
      this.updateSendButtonState();
    });
    input?.addEventListener("keydown", (event) =>
      this.handleComposerKeyDown(event, form || undefined)
    );
    form?.addEventListener("submit", (event) => this.handleSubmit(event));
    if (input) this.resizeComposerInput(input);
    this.updateSendButtonState();

    const panel = this.shadowRoot.querySelector<HTMLElement>(".panel--window");
    const header = this.shadowRoot.querySelector<HTMLElement>(".panel--window .header");
    if (panel && header) {
      this.bindWindowDragging(header, panel);
      header.addEventListener("dblclick", (event) => {
        const target = event.target;
        if (target instanceof Element && target.closest("button")) return;
        this.windowPosition = undefined;
        this.windowSize = undefined;
        this.render();
        this.focusInput();
      });
    }
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
    const scrollLatestButton = this.shadowRoot.querySelector<HTMLButtonElement>(
      "[data-action='scroll-latest']"
    );
    messages?.addEventListener(
      "scroll",
      () => {
        this.stickToBottom = isNearScrollBottom(messages);
        if (scrollLatestButton) scrollLatestButton.hidden = this.stickToBottom;
      },
      { passive: true }
    );
    scrollLatestButton?.addEventListener("click", () => {
      if (!messages) return;
      this.stickToBottom = true;
      scrollLatestButton.hidden = true;
      messages.scrollTo({ top: messages.scrollHeight, behavior: "smooth" });
    });
    if (messages) {
      messages.scrollTop = this.stickToBottom ? messages.scrollHeight : previousScrollTop;
      if (scrollLatestButton) scrollLatestButton.hidden = this.stickToBottom;
    }
    if (restoreInputFocus) this.focusInput();
  }

  private openPanel() {
    this.opened = true;
    this.animatePanel = true;
    this.render();
    this.focusInput();
  }

  private closePanel() {
    this.opened = false;
    this.render();
    this.constrainLauncherToViewport();
    this.shadowRoot
      ?.querySelector<HTMLButtonElement>(".launcher")
      ?.focus({ preventScroll: true });
  }

  private focusInput() {
    const input = this.shadowRoot?.querySelector<HTMLTextAreaElement>(".input");
    if (!input) return;
    input.focus({ preventScroll: true });
    const end = input.value.length;
    input.setSelectionRange(end, end);
  }

  private handleComposerKeyDown(event: KeyboardEvent, form?: HTMLFormElement) {
    // Host pages may globally block Backspace. Inside Shadow DOM the event target
    // is retargeted to <easy-agent-chat>, so keep the editing event in the component.
    if (event.key === "Backspace") {
      event.stopPropagation();
      return;
    }
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    form?.requestSubmit();
  }

  private resizeComposerInput(input: HTMLTextAreaElement) {
    input.style.height = "0px";
    const height = Math.min(input.scrollHeight, 120);
    input.style.height = `${Math.max(42, height)}px`;
    input.style.overflowY = input.scrollHeight > 120 ? "auto" : "hidden";
  }

  private updateSendButtonState() {
    const sendButton = this.shadowRoot?.querySelector<HTMLButtonElement>(".send-button");
    if (sendButton) sendButton.disabled = this.loading || !this.inputValue.trim();
  }

  private renderLauncher() {
    const launcherStyle = this.launcherPosition
      ? ` style="left:${this.launcherPosition.left}px;top:${this.launcherPosition.top}px;right:auto;bottom:auto"`
      : "";
    return `
      <button class="launcher" part="launcher" type="button" aria-label="打开${escapeAttribute(
        this.title
      )}" title="打开${escapeAttribute(this.title)}"${launcherStyle}>
        ${chatIcon}
      </button>
    `;
  }

  private renderPanel() {
    const isWindow = this.panelMode === "window";
    const panelStyle = this.getPanelStyle(isWindow);
    const modeLabel = isWindow ? "切换为右侧抽屉" : "切换为可拖拽浮窗";
    const enterClass = this.animatePanel ? " panel--enter" : "";
    const statusState = this.getStatusState();
    const sendDisabled = this.loading || !this.inputValue.trim();

    return `
      <section class="panel panel--${this.panelMode}${enterClass}" part="panel" role="dialog" aria-modal="false" aria-label="${escapeAttribute(
        this.title
      )}"${panelStyle}>
        <header class="header" part="header">
          <div class="header__identity">
            <span class="header__mark">${sparkIcon}</span>
            <span class="header__copy">
              <span class="title">${escapeHtml(this.title)}</span>
              <span class="status status--${statusState}" aria-live="polite"><i></i><span class="status__label">${escapeHtml(
                this.getStatusLabel()
              )}</span></span>
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
        <div class="messages-shell">
          <div class="messages" part="messages" role="log" aria-live="polite" aria-relevant="additions text" aria-busy="${
            this.loading
          }">
            ${this.renderMessages()}
          </div>
          <button class="scroll-latest" data-action="scroll-latest" type="button" aria-label="回到最新消息" title="回到最新消息" hidden>
            ${downIcon}
          </button>
        </div>
        <form class="composer" part="composer">
          <textarea class="input" part="input" rows="1" aria-label="${escapeAttribute(
            this.placeholder
          )}" placeholder="${escapeAttribute(this.placeholder)}">${escapeHtml(
            this.inputValue
          )}</textarea>
          <button class="send-button" part="button" type="submit" aria-label="发送" title="发送" ${
            sendDisabled ? "disabled" : ""
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

  private bindLauncherDragging(launcher: HTMLButtonElement) {
    launcher.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;

      launcher.classList.add("launcher--dragging");
      const startRect = launcher.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const pointerId = event.pointerId;
      let dragged = false;
      launcher.setPointerCapture(pointerId);

      const handleMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== pointerId) return;
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        if (!dragged && Math.hypot(deltaX, deltaY) < LAUNCHER_DRAG_THRESHOLD) return;

        dragged = true;
        moveEvent.preventDefault();
        const left = clamp(
          startRect.left + deltaX,
          VIEWPORT_MARGIN,
          window.innerWidth - startRect.width - VIEWPORT_MARGIN
        );
        const top = clamp(
          startRect.top + deltaY,
          VIEWPORT_MARGIN,
          window.innerHeight - startRect.height - VIEWPORT_MARGIN
        );
        this.launcherPosition = { left, top };
        launcher.style.left = `${left}px`;
        launcher.style.top = `${top}px`;
        launcher.style.right = "auto";
        launcher.style.bottom = "auto";
      };

      const handleUp = (upEvent: PointerEvent) => {
        if (upEvent.pointerId !== pointerId) return;
        launcher.removeEventListener("pointermove", handleMove);
        launcher.removeEventListener("pointerup", handleUp);
        launcher.removeEventListener("pointercancel", handleUp);
        if (launcher.hasPointerCapture(pointerId)) launcher.releasePointerCapture(pointerId);

        launcher.classList.remove("launcher--dragging");
        if (!dragged) return;

        this.suppressLauncherClickUntil = Date.now() + 400;
        const launcherWidth = launcher.offsetWidth;
        const launcherHeight = launcher.offsetHeight;
        const top = clamp(
          this.launcherPosition?.top ?? launcher.getBoundingClientRect().top,
          VIEWPORT_MARGIN,
          window.innerHeight - launcherHeight - VIEWPORT_MARGIN
        );
        const left = Math.max(
          VIEWPORT_MARGIN,
          window.innerWidth - launcherWidth - this.getLauncherGap(launcher)
        );
        this.launcherPosition = { left, top };
        launcher.style.left = `${left}px`;
        launcher.style.top = `${top}px`;
      };

      launcher.addEventListener("pointermove", handleMove);
      launcher.addEventListener("pointerup", handleUp);
      launcher.addEventListener("pointercancel", handleUp);
    });
  }

  private getLauncherGap(launcher: HTMLElement) {
    const value = Number.parseFloat(
      window.getComputedStyle(launcher).getPropertyValue("--eag-launcher-gap")
    );
    return Number.isFinite(value) ? value : LAUNCHER_DEFAULT_GAP;
  }

  private bindDrawerResizing(handle: HTMLElement, panel: HTMLElement) {
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;

      event.preventDefault();
      const startX = event.clientX;
      const startWidth = panel.getBoundingClientRect().width;
      const pointerId = event.pointerId;
      panel.classList.add("panel--resizing");
      handle.setPointerCapture(pointerId);

      const handleMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== pointerId) return;
        const minWidth = Math.min(DRAWER_MIN_WIDTH, window.innerWidth);
        const width = clamp(startWidth - (moveEvent.clientX - startX), minWidth, window.innerWidth);
        this.drawerWidth = width;
        panel.style.width = `${width}px`;
      };

      const handleUp = (upEvent: PointerEvent) => {
        if (upEvent.pointerId !== pointerId) return;
        handle.removeEventListener("pointermove", handleMove);
        handle.removeEventListener("pointerup", handleUp);
        handle.removeEventListener("pointercancel", handleUp);
        panel.classList.remove("panel--resizing");
        if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
      };

      handle.addEventListener("pointermove", handleMove);
      handle.addEventListener("pointerup", handleUp);
      handle.addEventListener("pointercancel", handleUp);
    });
  }

  private bindWindowDragging(header: HTMLElement, panel: HTMLElement) {
    header.addEventListener("pointerdown", (event) => {
      const target = event.target;
      if ((target instanceof Element && target.closest("button")) || event.button !== 0) return;

      const panelRect = panel.getBoundingClientRect();
      const offsetX = event.clientX - panelRect.left;
      const offsetY = event.clientY - panelRect.top;
      const pointerId = event.pointerId;
      header.setPointerCapture(pointerId);

      const handleMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== pointerId) return;
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
        if (upEvent.pointerId !== pointerId) return;
        header.removeEventListener("pointermove", handleMove);
        header.removeEventListener("pointerup", handleUp);
        header.removeEventListener("pointercancel", handleUp);
        if (header.hasPointerCapture(pointerId)) header.releasePointerCapture(pointerId);
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
      const pointerId = event.pointerId;
      panel.classList.add("panel--resizing");
      handle.setPointerCapture(pointerId);

      const handleMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== pointerId) return;
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

      const handleUp = (upEvent: PointerEvent) => {
        if (upEvent.pointerId !== pointerId) return;
        handle.removeEventListener("pointermove", handleMove);
        handle.removeEventListener("pointerup", handleUp);
        handle.removeEventListener("pointercancel", handleUp);
        panel.classList.remove("panel--resizing");
        if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
      };

      handle.addEventListener("pointermove", handleMove);
      handle.addEventListener("pointerup", handleUp);
      handle.addEventListener("pointercancel", handleUp);
    });
  }

  private getWindowMinimumSize(): WindowSize {
    return {
      width: Math.min(WINDOW_MIN_WIDTH, Math.max(0, window.innerWidth - 16)),
      height: Math.min(WINDOW_MIN_HEIGHT, Math.max(0, window.innerHeight - 16))
    };
  }

  private constrainPanelToViewport() {
    if (!this.opened || !this.shadowRoot) return;

    const drawer = this.shadowRoot.querySelector<HTMLElement>(".panel--drawer");
    if (drawer) {
      const minimum = Math.min(DRAWER_MIN_WIDTH, window.innerWidth);
      this.drawerWidth = clamp(this.drawerWidth, minimum, window.innerWidth);
      drawer.style.width = `${this.drawerWidth}px`;
      return;
    }

    const panel = this.shadowRoot.querySelector<HTMLElement>(".panel--window");
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const minimum = this.getWindowMinimumSize();
    const width = clamp(rect.width, minimum.width, Math.max(0, window.innerWidth - 16));
    const height = clamp(rect.height, minimum.height, Math.max(0, window.innerHeight - 16));
    const left = clamp(rect.left, VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN);
    const top = clamp(rect.top, VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN);
    this.windowPosition = { left, top };
    this.windowSize = { width, height };
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    panel.style.width = `${width}px`;
    panel.style.height = `${height}px`;
  }

  private constrainLauncherToViewport() {
    if (!this.launcherPosition || this.opened || !this.shadowRoot) return;

    const launcher = this.shadowRoot.querySelector<HTMLButtonElement>(".launcher");
    if (!launcher) return;
    const launcherWidth = launcher.offsetWidth;
    const launcherHeight = launcher.offsetHeight;
    const left = Math.max(
      VIEWPORT_MARGIN,
      window.innerWidth - launcherWidth - this.getLauncherGap(launcher)
    );
    const top = clamp(
      this.launcherPosition.top,
      VIEWPORT_MARGIN,
      window.innerHeight - launcherHeight - VIEWPORT_MARGIN
    );
    this.launcherPosition = { left, top };
    launcher.style.left = `${left}px`;
    launcher.style.top = `${top}px`;
  }

  private getStatusLabel() {
    if (this.statusText === "Ready") return "就绪";
    if (this.statusText === "Thinking") return "处理中";
    if (this.statusText === "Tool finished") return "处理中";
    if (this.statusText === "Error") return "请求失败";
    return this.statusText;
  }

  private getStatusState() {
    if (this.requestFailed || this.statusText === "Error") return "error";
    if (this.loading) return "loading";
    return "ready";
  }

  private syncPanelState() {
    const status = this.shadowRoot?.querySelector<HTMLElement>(".status");
    if (status) {
      status.className = `status status--${this.getStatusState()}`;
      const label = status.querySelector<HTMLElement>(".status__label");
      if (label) label.textContent = this.getStatusLabel();
    }
    const messages = this.shadowRoot?.querySelector<HTMLElement>(".messages");
    messages?.setAttribute("aria-busy", String(this.loading));
    this.updateSendButtonState();
  }

  private syncLastAssistantMessage() {
    if (!this.shadowRoot) return;
    const rows = this.shadowRoot.querySelectorAll<HTMLElement>(".message-row--assistant");
    const row = rows[rows.length - 1];
    const last = this.messages[this.messages.length - 1];
    if (!row || last?.role !== "assistant") return;
    row.innerHTML = this.renderMessageBubble(last);
    this.syncMessageScroll();
  }

  private scheduleLastAssistantMessageSync() {
    const view = this.ownerDocument.defaultView;
    if (!view?.requestAnimationFrame) {
      this.syncLastAssistantMessage();
      return;
    }
    if (this.assistantRenderFrame !== undefined) return;
    this.assistantRenderFrame = view.requestAnimationFrame(() => {
      this.assistantRenderFrame = undefined;
      this.syncLastAssistantMessage();
    });
  }

  private flushLastAssistantMessageSync() {
    this.cancelAssistantRenderFrame();
    this.syncLastAssistantMessage();
  }

  private cancelAssistantRenderFrame() {
    if (this.assistantRenderFrame === undefined) return;
    this.ownerDocument.defaultView?.cancelAnimationFrame(this.assistantRenderFrame);
    this.assistantRenderFrame = undefined;
  }

  private syncMessageScroll() {
    const messages = this.shadowRoot?.querySelector<HTMLElement>(".messages");
    const scrollLatestButton = this.shadowRoot?.querySelector<HTMLButtonElement>(
      "[data-action='scroll-latest']"
    );
    if (!messages) return;
    if (this.stickToBottom) messages.scrollTop = messages.scrollHeight;
    if (scrollLatestButton) scrollLatestButton.hidden = this.stickToBottom;
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
      .map((message) => this.renderMessage(message))
      .join("");
  }

  private renderMessage(message: ChatMessage) {
    return `
      <div class="message-row message-row--${message.role}">
        ${this.renderMessageBubble(message)}
      </div>
    `;
  }

  private renderMessageBubble(message: ChatMessage) {
    if (message.role === "user") {
      return `<div class="message user" part="message">${escapeHtml(message.content)}</div>`;
    }

    const markdownMode = this.renderMode === "markdown";
    const renderedContent = markdownMode
      ? renderMarkdown(message.content)
      : escapeHtml(message.content);
    const contentClass = markdownMode ? "markdown-body" : "message__content--text";
    const content = message.content
      ? `<div class="message__content ${contentClass}">${renderedContent}</div>`
      : "";
    const pending =
      message.state === "pending" && !message.content
        ? `<span class="typing" role="status"><span>正在处理</span><span class="typing__dots" aria-hidden="true"><i></i><i></i><i></i></span></span>`
        : "";
    const error =
      message.state === "error"
        ? `<div class="message__error"><strong>请求失败</strong><span>${escapeHtml(
            message.error || "暂时无法完成请求，请稍后再试。"
          )}</span></div>`
        : "";
    const stateClass = message.state ? ` message--${message.state}` : "";
    return `<div class="message assistant${stateClass}" part="message">${content}${pending}${error}</div>`;
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

function isNearScrollBottom(element: HTMLElement) {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= 48;
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

const downIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m7 10 5 5 5-5" />
  </svg>
`;
