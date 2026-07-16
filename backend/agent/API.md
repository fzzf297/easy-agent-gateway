# Agent 服务接口文档

本文档仅覆盖 `backend/agent` 对外接口，不包含后台管理接口。

## 基础信息

- 默认服务地址：`http://localhost:8001`
- Swagger UI：`http://localhost:8001/docs`
- 鉴权：当前 Agent 接口均不要求鉴权；应通过网络隔离或内网访问控制保护服务。
- 时间字段：服务返回的 SQLite 时间字符串。

### 通用错误响应

业务错误和 HTTP 错误统一使用以下结构：

```json
{
  "detail": "错误信息或错误码"
}
```

请求参数不符合 Schema 时，FastAPI 返回 HTTP `422`。

## 健康检查

### `GET /health`

检查 Agent 服务及其依赖的配置服务可用性。

响应示例：

```json
{
  "status": "ok",
  "admin": "ok",
  "model": "deepseek-chat"
}
```

| 字段 | 说明 |
| --- | --- |
| `status` | `ok` 或 `degraded`；仅当 `admin=ok` 时为 `ok`。 |
| `admin` | `ok`、`unhealthy`、`unreachable` 或 `unknown`。 |
| `model` | 当前配置的模型名称。 |

## 会话

### `POST /api/agent/sessions`

创建会话。

请求体：

```json
{
  "user_label": "张三"
}
```

| 字段 | 必填 | 约束 | 说明 |
| --- | --- | --- | --- |
| `user_label` | 否 | 最大 200 字符 | 会话用户标识，默认空字符串。 |

响应：HTTP `201 Created`

```json
{
  "sessionId": "8fd4ba30-60d1-478c-a9fb-f89fd35e6538",
  "summary": "",
  "createdAt": "2026-07-13 10:00:00",
  "updatedAt": "2026-07-13 10:00:00"
}
```

此接口按客户端 IP 限流，默认每分钟 30 次。超限时返回 HTTP `429`：

```json
{
  "detail": "RATE_LIMITED",
  "retryAfter": 60
}
```

### `GET /api/agent/sessions/{sessionId}/history`

获取会话消息历史。

响应示例：

```json
{
  "sessionId": "8fd4ba30-60d1-478c-a9fb-f89fd35e6538",
  "messages": [
    {
      "role": "user",
      "content": "查询用户列表",
      "createdAt": "2026-07-13 10:00:00"
    },
    {
      "role": "assistant",
      "content": "查询结果如下：",
      "createdAt": "2026-07-13 10:00:02"
    }
  ]
}
```

`role` 当前为 `user` 或 `assistant`。会话不存在时返回 HTTP `404`：

```json
{
  "detail": "Session not found"
}
```

### `POST /api/agent/sessions/{sessionId}/messages`

向会话发送消息，并以 Server-Sent Events（SSE）流式返回 Agent 响应。

请求体：

```json
{
  "content": "查询用户列表"
}
```

| 字段 | 必填 | 约束 | 说明 |
| --- | --- | --- | --- |
| `content` | 是 | 长度 1..10000 | 用户消息。 |

响应 Content-Type：`text/event-stream`。

每个 SSE 消息的 `data` 是下列 JSON 结构；正常事件带有 `id`：

```text
id: 1
data: {"type":"text","payload":"正在查询…"}

```

| `type` | `payload` | 说明 |
| --- | --- | --- |
| `text` | 字符串 | 模型生成的文本增量。 |
| `tool_status` | `{"node":"节点名","status":"done"}` | 图节点完成状态。 |
| `done` | `{"assistantContent":"完整回复"}` | 正常结束；完整回复会持久化至会话历史。 |
| `error` | `{"code":"错误码","status_code":500}` | 流处理期间发生错误，流随后结束。 |

可使用 `Last-Event-ID` 请求头请求重放同一会话中该事件之后的内存缓存事件。每个会话最多缓存 200 条事件，进程重启后缓存失效。

> 此接口同时承担“发送消息”和“推流”职责。携带 `Last-Event-ID` 重新发起请求后，服务会在重放缓存事件后继续处理本次请求体中的 `content`，客户端不应将其视为纯事件订阅接口。

会话不存在时返回 HTTP `404`。

### `PUT /api/agent/sessions/{sessionId}/score`

创建或覆盖会话评分。

请求体：

```json
{
  "score": 5,
  "comment": "回答准确"
}
```

| 字段 | 必填 | 约束 | 说明 |
| --- | --- | --- | --- |
| `score` | 是 | 整数，1..5 | 会话评分。 |
| `comment` | 否 | 最大 1000 字符 | 评分备注，默认空字符串。 |

响应示例：

```json
{
  "sessionId": "8fd4ba30-60d1-478c-a9fb-f89fd35e6538",
  "userLabel": "张三",
  "score": 5,
  "comment": "回答准确",
  "createdAt": "2026-07-13 10:01:00",
  "updatedAt": "2026-07-13 10:01:00"
}
```

参数不合法时返回 HTTP `422`；会话不存在时返回 HTTP `404`。

## 已配置接口试运行

### `POST /api/agent/interfaces/test`

试运行一个已配置的只读业务接口。接口执行失败属于业务结果，仍返回 HTTP `200`，由 `ok` 和 `error` 字段表示成功或失败。

请求体：

```json
{
  "projectCode": "demo",
  "interfaceCode": "user_list",
  "params": {
    "pageNum": 1,
    "pageSize": 10
  }
}
```

| 字段 | 必填 | 约束 | 说明 |
| --- | --- | --- | --- |
| `projectCode` | 是 | 长度 1..64 | 项目标识。 |
| `interfaceCode` | 是 | 长度 1..64 | 接口标识。 |
| `params` | 否 | 对象 | 接口参数，默认 `{}`。 |

成功响应：

```json
{
  "ok": true,
  "projectCode": "demo",
  "interfaceCode": "user_list",
  "durationMs": 123,
  "authUsed": true,
  "data": [
    {"id": 1, "name": "Alice"}
  ],
  "preview": "[{\"id\":1,\"name\":\"Alice\"}]",
  "error": null
}
```

失败响应：

```json
{
  "ok": false,
  "projectCode": "demo",
  "interfaceCode": "user_list",
  "durationMs": 12,
  "authUsed": false,
  "data": null,
  "preview": "",
  "error": {
    "code": "INTERFACE_PARAM_REQUIRED: pageNum",
    "statusCode": 400
  }
}
```

`preview` 是 `data` 的 JSON 紧凑预览，最长 1000 个字符。常见 `error.code` 包括：

- `INTERFACE_WRITE_NOT_ALLOWED`：接口不是只读接口，未执行。
- `INTERFACE_PARAM_REQUIRED: <参数名>`：缺少必填参数。
- `THIRD_PARTY_TIMEOUT`、`THIRD_PARTY_UNREACHABLE`：三方服务超时或不可达。
- `THIRD_PARTY_RESPONSE_NOT_JSON`：三方响应不是 JSON。

## 审计查询

### `GET /api/agent/audit`

查询 Agent 审计事件，可选附带会话、消息和评分信息。

查询参数：

| 参数 | 默认值 | 约束 | 说明 |
| --- | --- | --- | --- |
| `sessionId` | — | 可选 | 按会话筛选审计事件。 |
| `page` | `1` | `>= 1` | 页码。 |
| `pageSize` | `20` | `1..100` | 每页数量。 |
| `includeMessages` | `false` | 布尔值 | 返回 `messages` 字段；仅在同时传入 `sessionId` 时有内容。 |
| `includeScore` | `false` | 布尔值 | 返回 `score` 字段；仅在同时传入 `sessionId` 时有内容。 |
| `includeSessions` | `false` | 布尔值 | 返回当前页的 `sessions` 字段。 |

请求示例：

```text
GET /api/agent/audit?sessionId=8fd4ba30-60d1-478c-a9fb-f89fd35e6538&includeMessages=true&includeScore=true
```

响应示例：

```json
{
  "items": [
    {
      "id": 1,
      "sessionId": "8fd4ba30-60d1-478c-a9fb-f89fd35e6538",
      "action": "message_completed",
      "detail": {
        "response_length": 20,
        "tool_calls": 1
      },
      "createdAt": "2026-07-13 10:02:00"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "messages": [
    {
      "role": "user",
      "content": "查询用户列表",
      "createdAt": "2026-07-13 10:00:00"
    }
  ],
  "score": {
    "sessionId": "8fd4ba30-60d1-478c-a9fb-f89fd35e6538",
    "userLabel": "张三",
    "score": 5,
    "comment": "回答准确",
    "createdAt": "2026-07-13 10:01:00",
    "updatedAt": "2026-07-13 10:01:00"
  }
}
```

| 字段 | 说明 |
| --- | --- |
| `items` | 审计事件列表，按创建时间倒序。 |
| `items[].action` | 常见值：`message_received`、`tool_called`、`message_completed`、`error`、`session_scored`、`interface_test_completed`、`interface_test_failed`。 |
| `items[].detail` | 与 `action` 对应的事件详情。 |
| `messages`、`score`、`sessions` | 仅在对应 `include*` 参数为 `true` 时出现。 |

`sessions` 中每个元素包含 `sessionId`、`userLabel`、`summary`、`score`、`scoreComment`、`scoreUpdatedAt`、`createdAt` 与 `updatedAt`。
