# Easy Agent Gateway 前端接口文档

本文档面向前端对接，覆盖当前运行时的 `backend/admin` 与 `backend/agent` HTTP 接口。

## 基础信息

### 服务地址

| 服务 | 本地默认地址 | 说明 |
| --- | --- | --- |
| admin | `http://localhost:8000` | 管理后台、项目/页面/接口配置 |
| agent | `http://localhost:8001` | Agent 会话、SSE、审计、接口试运行 |

Docker/线上通过 nginx 暴露时，以实际域名为准。常见路径仍保持：

- admin: `/api/admin/*`、`/api/app/*`
- agent: `/api/agent/*`

### 鉴权

| 接口范围 | 是否鉴权 | Header |
| --- | --- | --- |
| `/api/admin/*` | 需要，除登录/刷新外 | `Authorization: Bearer <accessToken>` |
| `/api/app/*` | 不需要 | 无 |
| `/api/agent/*` | 不需要 | 无 |
| `/health`、`/agent/health` | 不需要 | 无 |

### 错误响应

业务错误和 HTTP 错误统一返回：

```json
{
  "detail": "错误信息"
}
```

常见状态码：

| 状态码 | 含义 |
| --- | --- |
| `400` | 请求参数或业务配置不合法 |
| `401` | 未登录、Token 无效或过期 |
| `403` | 用户禁用 |
| `404` | 资源不存在 |
| `409` | 唯一键冲突等资源冲突 |
| `423` | 登录失败过多，用户临时锁定 |
| `422` | FastAPI/Pydantic 参数校验失败 |
| `500/502/503/504` | 服务端、上游 admin、三方接口或模型调用异常 |

### 分页响应

分页列表统一结构：

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

分页查询参数：

| 参数 | 默认 | 约束 |
| --- | --- | --- |
| `page` | `1` | `>= 1` |
| `pageSize` | `20` | `1..100` |
| `keyword` | `""` | 仅管理端项目/页面/接口列表支持 |

### 枚举

| 字段 | 可选值 |
| --- | --- |
| `status` | `enabled`、`disabled` |
| `method` | `GET`、`POST`、`PUT`、`PATCH`、`DELETE` |
| `authMode` | `none`、`bearer`、`api_key`、`signature` |

## Admin 接口

### 健康检查

#### `GET /health`

响应：

```json
{
  "status": "ok"
}
```

## Admin 认证

### `POST /api/admin/auth/login`

说明：管理员登录。

请求：

```json
{
  "username": "admin",
  "password": "admin123"
}
```

响应：

```json
{
  "accessToken": "xxx",
  "refreshToken": "yyy",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "id": 1,
    "username": "admin",
    "displayName": "管理员",
    "status": "active",
    "lastLoginAt": "2026-07-06 10:00:00",
    "createdAt": "2026-07-06 10:00:00"
  }
}
```

### `POST /api/admin/auth/refresh`

说明：用 Refresh Token 换新 Token。

请求：

```json
{
  "refreshToken": "yyy"
}
```

响应同登录。

### `POST /api/admin/auth/logout`

说明：退出登录，需要 `Authorization`。

请求：

```json
{
  "refreshToken": "yyy"
}
```

响应：

```json
{
  "ok": true
}
```

### `GET /api/admin/auth/me`

说明：获取当前管理员信息，需要 `Authorization`。

响应：

```json
{
  "id": 1,
  "username": "admin",
  "displayName": "管理员",
  "status": "active",
  "lastLoginAt": "2026-07-06 10:00:00",
  "createdAt": "2026-07-06 10:00:00"
}
```

## Admin 项目管理

### Project 对象

```json
{
  "id": 1,
  "code": "demo",
  "name": "示例项目",
  "description": "",
  "baseUrl": "https://example.com",
  "status": "enabled",
  "createdAt": "2026-07-06 10:00:00",
  "updatedAt": "2026-07-06 10:00:00"
}
```

`code` 规则：以字母开头，只允许字母、数字、`_`、`-`，长度 `2..64`。

### `GET /api/admin/projects`

说明：分页查询项目，需要 `Authorization`。

查询参数：`page`、`pageSize`、`keyword`。

响应：`ListResponse<Project>`。

### `POST /api/admin/projects`

说明：创建项目，需要 `Authorization`。

请求：

```json
{
  "code": "demo",
  "name": "示例项目",
  "description": "",
  "baseUrl": "https://example.com",
  "status": "enabled"
}
```

响应：`Project`，HTTP `201`。

### `GET /api/admin/projects/{projectId}`

说明：获取项目详情，需要 `Authorization`。

响应：`Project`。

### `PUT /api/admin/projects/{projectId}`

说明：更新项目，需要 `Authorization`。所有字段可选。

请求：

```json
{
  "name": "新项目名",
  "description": "说明",
  "baseUrl": "https://api.example.com",
  "status": "enabled"
}
```

响应：`Project`。

### `DELETE /api/admin/projects/{projectId}`

说明：删除项目，需要 `Authorization`。

响应：

```json
{
  "ok": true
}
```

## Admin 页面管理

### Page 对象

```json
{
  "id": 1,
  "projectId": 1,
  "code": "home",
  "name": "首页",
  "route": "/home",
  "sortOrder": 0,
  "status": "enabled",
  "config": {},
  "createdAt": "2026-07-06 10:00:00",
  "updatedAt": "2026-07-06 10:00:00"
}
```

`route` 必须以 `/` 开头。

### `GET /api/admin/projects/{projectId}/pages`

说明：分页查询项目页面，需要 `Authorization`。

查询参数：`page`、`pageSize`、`keyword`。

响应：`ListResponse<Page>`，包含启用和禁用页面。

### `POST /api/admin/projects/{projectId}/pages`

说明：创建页面，需要 `Authorization`。

请求：

```json
{
  "code": "home",
  "name": "首页",
  "route": "/home",
  "sortOrder": 0,
  "status": "enabled",
  "config": {}
}
```

响应：`Page`，HTTP `201`。

### `GET /api/admin/pages/{pageId}`

说明：获取页面详情，需要 `Authorization`。

响应：`Page`。

### `PUT /api/admin/pages/{pageId}`

说明：更新页面，需要 `Authorization`。所有字段可选。

请求：

```json
{
  "name": "首页",
  "route": "/home",
  "sortOrder": 1,
  "status": "enabled",
  "config": {}
}
```

响应：`Page`。

### `PATCH /api/admin/pages/{pageId}/status`

说明：启用/禁用页面，需要 `Authorization`。

请求：

```json
{
  "status": "disabled"
}
```

响应：`Page`。

### `DELETE /api/admin/pages/{pageId}`

说明：删除页面，需要 `Authorization`。

响应：

```json
{
  "ok": true
}
```

### `GET /api/admin/pages/{pageId}/versions`

说明：查询页面版本，需要 `Authorization`。

查询参数：`page`、`pageSize`。

响应：`ListResponse<ConfigVersion>`。

### `GET /api/admin/pages/{pageId}/versions/{version}`

说明：查询页面指定版本，需要 `Authorization`。

响应：`ConfigVersion`。

## Admin 接口管理

### Interface 对象

```json
{
  "id": 1,
  "projectId": 1,
  "code": "user_list",
  "name": "用户列表",
  "method": "POST",
  "path": "/system/user/list",
  "authMode": "bearer",
  "status": "enabled",
  "description": "只读用户列表查询",
  "createdAt": "2026-07-06 10:00:00",
  "updatedAt": "2026-07-06 10:00:00"
}
```

`path` 必须以 `/` 开头。

### `GET /api/admin/projects/{projectId}/interfaces`

说明：分页查询项目接口，需要 `Authorization`。

查询参数：`page`、`pageSize`、`keyword`。

响应：`ListResponse<Interface>`，包含启用和禁用接口。

### `POST /api/admin/projects/{projectId}/interfaces`

说明：创建接口定义，需要 `Authorization`。

请求：

```json
{
  "code": "user_list",
  "name": "用户列表",
  "method": "POST",
  "path": "/system/user/list",
  "authMode": "bearer",
  "status": "enabled",
  "description": "只读用户列表查询"
}
```

响应：`Interface`，HTTP `201`。

### `GET /api/admin/interfaces/{interfaceId}`

说明：获取接口详情，需要 `Authorization`。

响应：`Interface`。

### `PUT /api/admin/interfaces/{interfaceId}`

说明：更新接口定义，需要 `Authorization`。所有字段可选。

请求：

```json
{
  "name": "用户列表",
  "method": "POST",
  "path": "/system/user/list",
  "authMode": "bearer",
  "status": "enabled",
  "description": "说明"
}
```

响应：`Interface`。

### `PATCH /api/admin/interfaces/{interfaceId}/status`

说明：启用/禁用接口，需要 `Authorization`。

请求：

```json
{
  "status": "disabled"
}
```

响应：`Interface`。

### `DELETE /api/admin/interfaces/{interfaceId}`

说明：删除接口，需要 `Authorization`。

响应：

```json
{
  "ok": true
}
```

### `GET /api/admin/interfaces/{interfaceId}/config`

说明：获取接口 YAML 配置，需要 `Authorization`。

响应：

```json
{
  "interfaceId": 1,
  "yamlText": "version: 1\nkind: api\n...",
  "parsedConfig": {
    "version": 1,
    "kind": "api"
  },
  "createdAt": "2026-07-06 10:00:00",
  "updatedAt": "2026-07-06 10:00:00"
}
```

### `PUT /api/admin/interfaces/{interfaceId}/config-yaml`

说明：保存接口 YAML 配置，需要 `Authorization`。

请求：

```json
{
  "yamlText": "version: 1\nkind: api\nreadOnly: true\nrequest:\n  method: POST\n  path: /system/user/list\nresponse:\n  dataPath: rows\n"
}
```

响应：`InterfaceConfig`。

### `POST /api/admin/interfaces/config-yaml/validate`

说明：只校验 YAML，不保存，需要 `Authorization`。

请求：

```json
{
  "yamlText": "version: 1\nkind: api\nreadOnly: true\nrequest:\n  method: GET\n  path: /users\n"
}
```

响应：

```json
{
  "valid": true,
  "parsedConfig": {
    "version": 1,
    "kind": "api",
    "readOnly": true
  },
  "errors": []
}
```

校验失败时当前实现返回 HTTP `400`，响应为 `{ "detail": "..." }`。

### `GET /api/admin/interfaces/{interfaceId}/versions`

说明：查询接口版本，需要 `Authorization`。

查询参数：`page`、`pageSize`。

响应：`ListResponse<ConfigVersion>`。

### `GET /api/admin/interfaces/{interfaceId}/versions/{version}`

说明：查询接口指定版本，需要 `Authorization`。

响应：`ConfigVersion`。

### ConfigVersion 对象

```json
{
  "id": 1,
  "entityId": 1,
  "version": 1,
  "action": "create",
  "snapshot": {},
  "createdAt": "2026-07-06 10:00:00"
}
```

## APP 读取接口

`/api/app/*` 给 Agent 和只读前端读取配置使用，不需要鉴权，只返回 `enabled` 数据。

### `GET /api/app/projects`

查询参数：`page`、`pageSize`。

响应：`ListResponse<Project>`。

### `GET /api/app/projects/{projectCode}`

响应：`Project`。

### `GET /api/app/projects/{projectCode}/pages`

查询参数：`page`、`pageSize`。

响应：`ListResponse<Page>`。

### `GET /api/app/projects/{projectCode}/pages/{pageCode}`

响应：`Page`。

### `GET /api/app/projects/{projectCode}/pages/{pageCode}/versions`

查询参数：`page`、`pageSize`。

响应：`ListResponse<ConfigVersion>`。

### `GET /api/app/projects/{projectCode}/interfaces`

查询参数：`page`、`pageSize`。

响应：`ListResponse<PublicInterface>`。

`PublicInterface` 比 `Interface` 多一个可选字段：

```json
{
  "parsedConfig": {}
}
```

### `GET /api/app/projects/{projectCode}/interfaces/{interfaceCode}`

响应：`PublicInterface`。

### `GET /api/app/projects/{projectCode}/interfaces/{interfaceCode}/config`

响应：`InterfaceConfig`。

### `GET /api/app/projects/{projectCode}/interfaces/{interfaceCode}/versions`

查询参数：`page`、`pageSize`。

响应：`ListResponse<ConfigVersion>`。

## Agent 接口

### 健康检查

#### `GET /health`

agent 服务直连时使用。

响应：

```json
{
  "status": "ok",
  "admin": "ok",
  "model": "deepseek-chat"
}
```

`status` 为 `ok` 表示 admin 可达，否则为 `degraded`。

## Agent 会话

### `POST /api/agent/sessions`

说明：创建会话。不鉴权。

请求：

```json
{
  "user_label": "张三"
}
```

`user_label` 可为空，最大长度 `200`。

响应，HTTP `201`：

```json
{
  "sessionId": "uuid",
  "summary": "",
  "createdAt": "2026-07-06 10:00:00",
  "updatedAt": "2026-07-06 10:00:00"
}
```

### `GET /api/agent/sessions/{sessionId}/history`

说明：获取会话消息历史。不鉴权。

响应：

```json
{
  "sessionId": "uuid",
  "messages": [
    {
      "role": "user",
      "content": "查用户列表",
      "createdAt": "2026-07-06 10:00:00"
    },
    {
      "role": "assistant",
      "content": "查询结果...",
      "createdAt": "2026-07-06 10:00:01"
    }
  ]
}
```

### `POST /api/agent/sessions/{sessionId}/messages`

说明：发送消息并接收 SSE 流。不鉴权。

请求：

```json
{
  "content": "查询 demo 项目的用户列表"
}
```

请求 Header 可选：

| Header | 说明 |
| --- | --- |
| `Last-Event-ID` | 断线重连时携带最后收到的事件 id，服务端会回放后续缓存事件 |

响应 Header：

```text
Content-Type: text/event-stream
```

SSE 每条消息格式：

```text
id: 1
data: {"type":"text","payload":"你好"}
```

事件类型：

| type | payload |
| --- | --- |
| `text` | 字符串，模型增量文本 |
| `tool_status` | `{ "node": "tools", "status": "done" }` 等工具/节点状态 |
| `error` | `{ "code": "错误码", "status_code": 500 }` |
| `done` | `{ "assistantContent": "完整回答" }` |

前端建议：

- 展示时拼接所有 `type=text` 的 `payload`。
- 收到 `type=done` 后用 `payload.assistantContent` 作为最终回答。
- 收到 `type=error` 后停止本轮展示并提示 `payload.code`。

### `PUT /api/agent/sessions/{sessionId}/score`

说明：提交或覆盖会话评分。不鉴权。

请求：

```json
{
  "score": 5,
  "comment": "回答准确"
}
```

`score` 范围 `1..5`，`comment` 最大长度 `1000`。

响应：

```json
{
  "sessionId": "uuid",
  "userLabel": "张三",
  "score": 5,
  "comment": "回答准确",
  "createdAt": "2026-07-06 10:00:00",
  "updatedAt": "2026-07-06 10:00:00"
}
```

## Agent 接口试运行

### `POST /api/agent/interfaces/test`

说明：试运行单个已配置三方业务接口。不鉴权。

请求：

```json
{
  "projectCode": "demo",
  "interfaceCode": "user_list",
  "params": {
    "pageNum": "1",
    "pageSize": "10"
  }
}
```

响应成功：

```json
{
  "ok": true,
  "projectCode": "demo",
  "interfaceCode": "user_list",
  "durationMs": 123,
  "authUsed": true,
  "data": [],
  "preview": "[]",
  "error": null
}
```

响应失败仍为 HTTP `200`，通过 `ok=false` 表示：

```json
{
  "ok": false,
  "projectCode": "demo",
  "interfaceCode": "user_list",
  "durationMs": 20,
  "authUsed": false,
  "data": null,
  "preview": "",
  "error": {
    "code": "INTERFACE_WRITE_NOT_ALLOWED",
    "statusCode": 400
  }
}
```

常见错误码：

| code | 说明 |
| --- | --- |
| `PROJECT_BASE_URL_REQUIRED` | 项目未配置 `baseUrl` |
| `PROJECT_BASE_URL_INVALID` | `baseUrl` 非法 |
| `INTERFACE_KIND_NOT_API` | 不是 `kind: api` |
| `INTERFACE_READ_ONLY_REQUIRED` | 缺少 `readOnly` |
| `INTERFACE_WRITE_NOT_ALLOWED` | 写接口不允许通过该接口执行 |
| `INTERFACE_PARAM_REQUIRED: xxx` | 缺少参数 |
| `PROJECT_AUTH_NOT_FOUND` | 项目认证接口不存在 |
| `PROJECT_AUTH_NOT_UNIQUE` | 项目存在多个 auth 但未指定 |
| `THIRD_PARTY_HOST_NOT_ALLOWED` | 三方 host 未在允许列表 |
| `THIRD_PARTY_UNAUTHORIZED` | 三方接口返回 `401` |
| `THIRD_PARTY_TIMEOUT` | 三方接口超时 |
| `THIRD_PARTY_UNREACHABLE` | 三方接口不可达 |
| `THIRD_PARTY_RESPONSE_NOT_JSON` | 三方响应不是 JSON |

## Agent 审计

### `GET /api/agent/audit`

说明：查询审计事件。不鉴权。

查询参数：

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `sessionId` | 无 | 只查指定会话 |
| `page` | `1` | 页码 |
| `pageSize` | `20` | 每页数量，`1..100` |
| `includeMessages` | `false` | 同时返回该会话消息，需传 `sessionId` |
| `includeScore` | `false` | 同时返回该会话评分，需传 `sessionId` |
| `includeSessions` | `false` | 同时返回会话列表 |

响应：

```json
{
  "items": [
    {
      "id": 1,
      "sessionId": "uuid",
      "action": "message_received",
      "detail": {},
      "createdAt": "2026-07-06 10:00:00"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20,
  "messages": [],
  "score": null,
  "sessions": [
    {
      "sessionId": "uuid",
      "userLabel": "张三",
      "summary": "",
      "score": 5,
      "scoreComment": "回答准确",
      "scoreUpdatedAt": "2026-07-06 10:00:00",
      "createdAt": "2026-07-06 10:00:00",
      "updatedAt": "2026-07-06 10:00:00"
    }
  ]
}
```

`total` 为当前审计事件筛选条件下的总数。`messages`、`score`、`sessions` 只有对应 `include*` 为 `true` 时才返回。

## 前端接入建议

1. 管理后台先调用 `POST /api/admin/auth/login`，保存 `accessToken` 和 `refreshToken`。
2. 管理后台所有 `/api/admin/*` 请求带 `Authorization: Bearer <accessToken>`。
3. `401` 时调用 `/api/admin/auth/refresh`；刷新失败则回登录页。
4. Agent 聊天先创建 session，再用 SSE 发送消息。
5. 接口试运行用 `ok` 判断业务执行结果，不要只看 HTTP 状态码。
6. YAML 校验失败返回 HTTP `400`，前端直接展示 `detail` 即可。
