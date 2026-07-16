import { describe, expect, it } from "vitest";

import { normalizeAgentEvent, parseSseText, SseStreamParser } from "../src/sse";

describe("SSE parsing", () => {
  it("parses backend text events with ids", () => {
    const events = parseSseText('id: 1\ndata: {"type":"text","payload":"hello"}\n\n');

    expect(events).toEqual([{ id: "1", type: "text", payload: "hello" }]);
  });

  it("handles chunks split across event boundaries", () => {
    const parser = new SseStreamParser();

    expect(parser.push('id: 1\ndata: {"type":"text"')).toEqual([]);
    const rawEvents = parser.push(',"payload":"he"}\n\nid: 2\ndata: {"type":"done"}\n\n');
    const events = rawEvents.map(normalizeAgentEvent);

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ id: "1", type: "text", payload: "he" });
    expect(events[1]).toMatchObject({ id: "2", type: "done" });
  });

  it("normalizes tool status and error event payloads", () => {
    const events = parseSseText(
      [
        'data: {"type":"tool_status","payload":{"node":"tools","status":"done"}}',
        "",
        'data: {"type":"error","payload":{"code":"INTERNAL_ERROR"}}',
        "",
        ""
      ].join("\n")
    );

    expect(events[0].type).toBe("tool_status");
    expect(events[0].payload).toEqual({ node: "tools", status: "done" });
    expect(events[1].type).toBe("error");
    expect(events[1].payload).toEqual({ code: "INTERNAL_ERROR" });
  });
});
