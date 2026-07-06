export const elementStyles = `
:host {
  --eag-bg: #ffffff;
  --eag-text: #111827;
  --eag-muted: #6b7280;
  --eag-border: #e5e7eb;
  --eag-primary: #1677ff;
  --eag-user-bg: #1677ff;
  --eag-user-text: #ffffff;
  --eag-agent-bg: #f3f6fb;
  display: block;
  color: var(--eag-text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

:host([theme="dark"]) {
  --eag-bg: #111827;
  --eag-text: #f9fafb;
  --eag-muted: #9ca3af;
  --eag-border: #374151;
  --eag-agent-bg: #1f2937;
}

* {
  box-sizing: border-box;
}

.chat {
  height: 100%;
  min-height: 360px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
  background: var(--eag-bg);
  border: 1px solid var(--eag-border);
  border-radius: 8px;
}

.header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--eag-border);
}

.title {
  font-weight: 700;
}

.status {
  margin-top: 4px;
  color: var(--eag-muted);
  font-size: 12px;
}

.messages {
  min-height: 240px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  overflow: auto;
}

.empty {
  margin: auto;
  color: var(--eag-muted);
  text-align: center;
}

.message {
  max-width: 86%;
  padding: 10px 12px;
  border-radius: 8px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message.user {
  align-self: flex-end;
  color: var(--eag-user-text);
  background: var(--eag-user-bg);
}

.message.assistant {
  align-self: flex-start;
  background: var(--eag-agent-bg);
}

.composer {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--eag-border);
}

.input {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  color: var(--eag-text);
  background: transparent;
  border: 1px solid var(--eag-border);
  border-radius: 6px;
  outline: none;
}

.input:focus {
  border-color: var(--eag-primary);
}

.button {
  min-width: 72px;
  padding: 0 14px;
  color: #fff;
  background: var(--eag-primary);
  border: 0;
  border-radius: 6px;
  cursor: pointer;
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
`;
