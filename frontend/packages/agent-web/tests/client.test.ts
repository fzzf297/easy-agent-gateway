import { describe, expect, it, vi } from "vitest";

import { AgentApiError, AgentClient, buildAgentUrl } from "../src/client";
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

  it("maps every JSON endpoint to the documented request contract", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ status: "ok", admin: "ok", model: "deepseek-chat" })
      )
      .mockResolvedValueOnce(
        Response.json(
          {
            sessionId: "s1",
            summary: "",
            createdAt: "2026-07-13 10:00:00",
            updatedAt: "2026-07-13 10:00:00"
          },
          { status: 201 }
        )
      )
      .mockResolvedValueOnce(Response.json({ sessionId: "s1", messages: [] }))
      .mockResolvedValueOnce(
        Response.json({
          sessionId: "s1",
          userLabel: "张三",
          score: 5,
          comment: "准确",
          createdAt: "2026-07-13 10:01:00",
          updatedAt: "2026-07-13 10:01:00"
        })
      )
      .mockResolvedValueOnce(
        Response.json({
          ok: true,
          projectCode: "demo",
          interfaceCode: "user_list",
          durationMs: 12,
          authUsed: true,
          data: [],
          preview: "[]",
          error: null
        })
      )
      .mockResolvedValueOnce(
        Response.json({ items: [], page: 2, pageSize: 10, messages: [] })
      );
    const client = new AgentClient({
      apiBaseUrl: "http://localhost:8001/",
      headers: { "X-Tenant": "demo" },
      fetchImpl: fetchImpl as unknown as typeof fetch
    });

    await client.getHealth();
    await client.createSession("张三");
    await client.getHistory("s1");
    await client.scoreSession("s1", { score: 5, comment: "准确" });
    await client.testInterface({
      projectCode: "demo",
      interfaceCode: "user_list",
      params: { pageNum: 1 }
    });
    await client.getAudit({
      sessionId: "s1",
      page: 2,
      pageSize: 10,
      includeMessages: true,
      includeScore: false,
      includeSessions: false
    });

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8001/health",
      expect.objectContaining({ headers: { "X-Tenant": "demo" } })
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8001/api/agent/sessions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ user_label: "张三" })
      })
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      "http://localhost:8001/api/agent/sessions/s1/history",
      expect.any(Object)
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      4,
      "http://localhost:8001/api/agent/sessions/s1/score",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ score: 5, comment: "准确" })
      })
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      5,
      "http://localhost:8001/api/agent/interfaces/test",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          projectCode: "demo",
          interfaceCode: "user_list",
          params: { pageNum: 1 }
        })
      })
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      6,
      "http://localhost:8001/api/agent/audit?sessionId=s1&page=2&pageSize=10&includeMessages=true&includeScore=false&includeSessions=false",
      expect.any(Object)
    );
  });

  it("preserves the documented API error and rate-limit fields", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ detail: "RATE_LIMITED", retryAfter: 60 }, { status: 429 })
    );
    const client = new AgentClient({
      apiBaseUrl: "http://localhost:8001",
      fetchImpl: fetchImpl as unknown as typeof fetch
    });

    const error = await client.createSession().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AgentApiError);
    expect(error).toMatchObject({
      status: 429,
      detail: "RATE_LIMITED",
      retryAfter: 60
    });
  });

  it("sends Last-Event-ID only when explicitly supplied", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response('id: 8\ndata: {"type":"done","payload":{"assistantContent":"ok"}}\n\n')
    );
    const client = new AgentClient({
      apiBaseUrl: "http://localhost:8001",
      fetchImpl: fetchImpl as unknown as typeof fetch
    });

    await client.sendMessage("s1", "继续", { lastEventId: "7" });

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:8001/api/agent/sessions/s1/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Last-Event-ID": "7" }),
        body: JSON.stringify({ content: "继续" })
      })
    );
  });
});
