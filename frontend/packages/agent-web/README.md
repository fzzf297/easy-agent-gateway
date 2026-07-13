# @easy-agent-gateway/agent-web

Easy Agent Gateway 的框架无关 Web Component 和 TypeScript SDK。接口字段与 Agent 服务 API 保持一致。

组件默认显示为页面右下角悬浮按钮，点击后打开无蒙层的右侧聊天抽屉；抽屉标题栏可切换为可拖拽浮窗。

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

### api-base-url 与健康检查

- 页面直接连接 Agent 服务（例如本地 `8001` 端口）时，传 `api-base-url="http://localhost:8001"`；健康检查地址是 `http://localhost:8001/agent/health`。
- 页面通过本项目 nginx/Vite 同域代理时，传 `api-base-url=""`；聊天请求会发送到同域 `/api/agent/*`。
- 本项目网关对外的 Agent 健康检查地址是 `/agent/health`。聊天组件不会自动请求健康检查接口。

## SSE 重放

`sendMessage` 支持文档中的 `Last-Event-ID` 请求头：

```ts
await client.sendMessage(sessionId, content, { lastEventId: "7", onEvent });
```

重放请求仍会继续处理本次 `content`，不是纯订阅请求。
