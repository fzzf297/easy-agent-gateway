# @easy-agent-gateway/agent-web

Easy Agent Gateway 的框架无关 Web Component 和 TypeScript SDK。接口字段与 Agent 服务 API 保持一致。

## 安装

```bash
pnpm add @easy-agent-gateway/agent-web
```

```ts
import "@easy-agent-gateway/agent-web";
```

```html
<easy-agent-chat
  api-base-url="https://agent.example.com"
  user-label="demo"
></easy-agent-chat>
```

纯 HTML 页面可通过固定版本的 CDN 文件注册组件：

```html
<script src="https://cdn.jsdelivr.net/npm/@easy-agent-gateway/agent-web@0.1.0/dist/index.umd.cjs"></script>
```

## SDK

```ts
import { AgentClient } from "@easy-agent-gateway/agent-web";

const client = new AgentClient({ apiBaseUrl: "https://agent.example.com" });

await client.getHealth();
const session = await client.createSession("张三");
await client.getHistory(session.sessionId);
await client.sendMessage(session.sessionId, "查询用户列表", {
  onEvent: (event) => console.log(event)
});
await client.scoreSession(session.sessionId, { score: 5, comment: "回答准确" });
await client.testInterface({
  projectCode: "demo",
  interfaceCode: "user_list",
  params: { pageNum: 1, pageSize: 10 }
});
await client.getAudit({ sessionId: session.sessionId, includeMessages: true });
```

服务端目前不要求鉴权。若部署层增加了网关请求头，可通过 `AgentClient` 的 `headers` 或组件元素的 `headers` 属性传入。

## SSE 重放

`sendMessage` 支持文档中的 `Last-Event-ID` 请求头：

```ts
await client.sendMessage(sessionId, content, { lastEventId: "7", onEvent });
```

重放请求仍会继续处理本次 `content`，不是纯订阅请求。
