export const elementStyles = `
:host {
  --eag-bg: #ffffff;
  --eag-surface: #f7f9fc;
  --eag-text: #172033;
  --eag-muted: #667085;
  --eag-border: #e7ebf2;
  --eag-primary: #2563eb;
  --eag-primary-hover: #1d4ed8;
  --eag-user-bg: #2563eb;
  --eag-user-text: #ffffff;
  --eag-agent-bg: #f0f4fa;
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  width: 0;
  height: 0;
  color: var(--eag-text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  pointer-events: none;
}

:host([theme="dark"]) {
  --eag-bg: #101828;
  --eag-surface: #182230;
  --eag-text: #f8fafc;
  --eag-muted: #98a2b3;
  --eag-border: #344054;
  --eag-agent-bg: #253044;
}

* {
  box-sizing: border-box;
}

button,
input {
  font: inherit;
}

svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.launcher {
  position: fixed;
  right: 28px;
  bottom: 28px;
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  padding: 0;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(145deg, #3b82f6 0%, #1d4ed8 58%, #1e40af 100%);
  border: 0;
  border-radius: 50%;
  box-shadow: 0 14px 32px rgb(37 99 235 / 36%), 0 3px 8px rgb(15 23 42 / 18%);
  pointer-events: auto;
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.launcher::after {
  content: "";
  position: absolute;
  inset: -5px;
  border: 1px solid rgb(59 130 246 / 22%);
  border-radius: 50%;
}

.launcher:hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 18px 38px rgb(37 99 235 / 40%), 0 4px 10px rgb(15 23 42 / 20%);
}

.launcher:focus-visible,
.icon-button:focus-visible,
.send-button:focus-visible,
.input:focus-visible {
  outline: 3px solid rgb(59 130 246 / 24%);
  outline-offset: 2px;
}

.launcher svg {
  width: 27px;
  height: 27px;
  stroke-width: 1.7;
}

.launcher .icon-dots {
  stroke-width: 3;
}

.panel {
  position: fixed;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  color: var(--eag-text);
  background: var(--eag-bg);
  pointer-events: auto;
}

.panel--drawer {
  top: 0;
  right: 0;
  bottom: 0;
  width: min(430px, 100vw);
  border-left: 1px solid var(--eag-border);
  box-shadow: -18px 0 48px rgb(15 23 42 / 15%);
}

.panel--window {
  right: 28px;
  bottom: 98px;
  width: min(430px, calc(100vw - 32px));
  height: min(650px, calc(100vh - 122px));
  border: 1px solid var(--eag-border);
  border-radius: 16px;
  box-shadow: 0 24px 70px rgb(15 23 42 / 22%), 0 4px 18px rgb(15 23 42 / 10%);
}

.resize-handle {
  position: absolute;
  z-index: 5;
  display: block;
  touch-action: none;
}

.panel--drawer .resize-handle--w {
  top: 0;
  bottom: 0;
  left: 0;
  width: 10px;
  cursor: ew-resize;
}

.panel--drawer .resize-handle--w::after {
  content: "";
  position: absolute;
  top: 50%;
  bottom: auto;
  left: 2px;
  width: 3px;
  height: 48px;
  background: var(--eag-primary);
  border-radius: 999px;
  opacity: 0;
  transform: translateY(-50%);
  transition: opacity 120ms ease;
}

.panel--drawer .resize-handle--w:hover::after {
  opacity: .45;
}

.panel--window .resize-handle--n,
.panel--window .resize-handle--s {
  right: 12px;
  left: 12px;
  height: 8px;
  cursor: ns-resize;
}

.panel--window .resize-handle--n { top: 0; }
.panel--window .resize-handle--s { bottom: 0; }

.panel--window .resize-handle--e,
.panel--window .resize-handle--w {
  top: 12px;
  bottom: 12px;
  width: 8px;
  cursor: ew-resize;
}

.panel--window .resize-handle--e { right: 0; }
.panel--window .resize-handle--w { left: 0; }

.panel--window .resize-handle--ne,
.panel--window .resize-handle--nw,
.panel--window .resize-handle--se,
.panel--window .resize-handle--sw {
  width: 14px;
  height: 14px;
}

.panel--window .resize-handle--ne,
.panel--window .resize-handle--sw {
  cursor: nesw-resize;
}

.panel--window .resize-handle--nw,
.panel--window .resize-handle--se {
  cursor: nwse-resize;
}

.panel--window .resize-handle--ne { top: 0; right: 0; }
.panel--window .resize-handle--nw { top: 0; left: 0; }
.panel--window .resize-handle--se { right: 0; bottom: 0; }
.panel--window .resize-handle--sw { bottom: 0; left: 0; }

.panel--drawer.panel--enter {
  animation: drawer-in 200ms ease-out;
}

.panel--window.panel--enter {
  animation: window-in 160ms ease-out;
}

@keyframes drawer-in {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes window-in {
  from { opacity: 0; transform: translateY(8px) scale(.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.header {
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px 12px 16px;
  background: color-mix(in srgb, var(--eag-bg) 92%, transparent);
  border-bottom: 1px solid var(--eag-border);
  user-select: none;
  touch-action: none;
}

.panel--window .header {
  cursor: move;
}

.header__identity {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 11px;
}

.header__mark {
  width: 38px;
  height: 38px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  color: #fff;
  background: linear-gradient(145deg, #3b82f6, #1d4ed8);
  border-radius: 11px;
  box-shadow: 0 7px 18px rgb(37 99 235 / 24%);
}

.header__mark svg {
  width: 21px;
  height: 21px;
  fill: currentColor;
  stroke: none;
}

.header__copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.title {
  overflow: hidden;
  font-size: 15px;
  font-weight: 750;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--eag-muted);
  font-size: 12px;
  line-height: 1;
}

.status i {
  width: 7px;
  height: 7px;
  background: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgb(34 197 94 / 12%);
}

.header__actions {
  display: flex;
  flex: 0 0 auto;
  gap: 4px;
}

.icon-button {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  padding: 0;
  color: var(--eag-muted);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.icon-button:hover {
  color: var(--eag-text);
  background: var(--eag-surface);
}

.icon-button svg {
  width: 18px;
  height: 18px;
}

.messages {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px 18px;
  overflow: auto;
  overscroll-behavior: contain;
  background:
    radial-gradient(circle at 100% 0, rgb(59 130 246 / 6%), transparent 32%),
    var(--eag-bg);
}

.messages::-webkit-scrollbar {
  width: 6px;
}

.messages::-webkit-scrollbar-thumb {
  background: rgb(148 163 184 / 44%);
  border-radius: 999px;
}

.empty {
  max-width: 280px;
  display: grid;
  justify-items: center;
  gap: 9px;
  margin: auto;
  color: var(--eag-muted);
  font-size: 13px;
  line-height: 1.65;
  text-align: center;
}

.empty strong {
  color: var(--eag-text);
  font-size: 16px;
}

.empty__icon {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  margin-bottom: 4px;
  color: var(--eag-primary);
  background: rgb(37 99 235 / 9%);
  border-radius: 16px;
}

.empty__icon svg {
  width: 27px;
  height: 27px;
  fill: currentColor;
  stroke: none;
}

.message-row {
  display: flex;
}

.message-row--user {
  justify-content: flex-end;
}

.message-row--assistant {
  justify-content: flex-start;
}

.message {
  max-width: 86%;
  padding: 10px 13px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
}

.message.user {
  color: var(--eag-user-text);
  background: var(--eag-user-bg);
  border-bottom-right-radius: 4px;
  box-shadow: 0 5px 14px rgb(37 99 235 / 16%);
}

.message.assistant {
  background: var(--eag-agent-bg);
  border-bottom-left-radius: 4px;
}

.composer {
  display: flex;
  gap: 9px;
  padding: 13px 14px 14px;
  background: var(--eag-bg);
  border-top: 1px solid var(--eag-border);
}

.input {
  height: 42px;
  flex: 1;
  min-width: 0;
  padding: 0 13px;
  color: var(--eag-text);
  background: var(--eag-surface);
  border: 1px solid transparent;
  border-radius: 10px;
  outline: none;
  transition: border-color 150ms ease, background 150ms ease;
}

.input::placeholder {
  color: #98a2b3;
}

.input:focus {
  background: var(--eag-bg);
  border-color: var(--eag-primary);
}

.send-button {
  width: 42px;
  height: 42px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  padding: 0;
  color: #fff;
  cursor: pointer;
  background: var(--eag-primary);
  border: 0;
  border-radius: 10px;
  box-shadow: 0 7px 16px rgb(37 99 235 / 22%);
}

.send-button:hover {
  background: var(--eag-primary-hover);
}

.send-button:disabled {
  cursor: not-allowed;
  opacity: .55;
}

.send-button svg {
  width: 19px;
  height: 19px;
}

@media (max-width: 480px) {
  .launcher {
    right: 18px;
    bottom: 18px;
  }

  .panel--window {
    right: 8px;
    bottom: 8px;
    width: calc(100vw - 16px);
    height: calc(100vh - 16px);
  }
}
`;
