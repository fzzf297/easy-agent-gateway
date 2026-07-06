import { describe, expect, it, vi } from "vitest";

import { AgentClient, buildAgentUrl } from "../src/client";
import type { AgentSseEvent } from "../src/types";

describe("AgentClient", () => {
  it("builds API urls without double slashes", () => {
    expect(buildAgentUrl("http://localhost:8001/", "/api/agent/sessions")).toBe(
      "http://localhost:8001/api/agent/sessions"
    );
    expect(buildAgentUrl("", "/api/agent/sessions")).toBe("/api/agent/sessions");
  });

  it("streams message events from the agent API", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'id: 1\ndata: {"type":"text","payload":"hi"}\n\nid: 2\ndata: {"type":"done","payload":{"assistantContent":"hi"}}\n\n'
          )
        );
        controller.close();
      }
    });
    const fetchImpl = vi.fn(async () => new Response(body, { status: 200 }));
    const client = new AgentClient({
      apiBaseUrl: "http://localhost:8001",
      fetchImpl: fetchImpl as unknown as typeof fetch
    });
    const events: AgentSseEvent[] = [];

    await client.sendMessage("s1", "hello", {
      onEvent: (event) => events.push(event)
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:8001/api/agent/sessions/s1/messages",
      expect.objectContaining({ method: "POST" })
    );
    expect(events).toEqual([
      { id: "1", type: "text", payload: "hi" },
      { id: "2", type: "done", payload: { assistantContent: "hi" } }
    ]);
  });
});
