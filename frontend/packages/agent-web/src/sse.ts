import type { AgentSseEvent, RawSseEvent } from "./types";

export class SseStreamParser {
  private buffer = "";

  push(chunk: string): RawSseEvent[] {
    this.buffer += chunk.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const events: RawSseEvent[] = [];

    let boundary = this.buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const block = this.buffer.slice(0, boundary);
      this.buffer = this.buffer.slice(boundary + 2);
      const event = parseSseBlock(block);
      if (event) events.push(event);
      boundary = this.buffer.indexOf("\n\n");
    }

    return events;
  }

  flush(): RawSseEvent[] {
    if (!this.buffer.trim()) {
      this.buffer = "";
      return [];
    }

    const event = parseSseBlock(this.buffer);
    this.buffer = "";
    return event ? [event] : [];
  }
}

export function parseSseBlock(block: string): RawSseEvent | null {
  const lines = block.split("\n");
  const dataLines: string[] = [];
  let id: string | undefined;
  let eventName: string | undefined;

  for (const line of lines) {
    if (!line || line.startsWith(":")) continue;
    const index = line.indexOf(":");
    const field = index >= 0 ? line.slice(0, index) : line;
    const rawValue = index >= 0 ? line.slice(index + 1) : "";
    const value = rawValue.startsWith(" ") ? rawValue.slice(1) : rawValue;

    if (field === "id") id = value;
    if (field === "event") eventName = value;
    if (field === "data") dataLines.push(value);
  }

  if (!dataLines.length) return null;
  return {
    id,
    event: eventName,
    data: dataLines.join("\n")
  };
}

export function normalizeAgentEvent(raw: RawSseEvent): AgentSseEvent {
  try {
    const parsed = JSON.parse(raw.data) as { type?: string; payload?: unknown };
    return {
      id: raw.id,
      type: parsed.type || raw.event || "message",
      payload: parsed.payload
    };
  } catch {
    return {
      id: raw.id,
      type: raw.event || "message",
      payload: raw.data
    };
  }
}

export function parseSseText(input: string): AgentSseEvent[] {
  const parser = new SseStreamParser();
  return [...parser.push(input), ...parser.flush()].map(normalizeAgentEvent);
}
