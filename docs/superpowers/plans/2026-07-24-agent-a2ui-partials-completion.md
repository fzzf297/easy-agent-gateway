# Agent A2UI 部分完成项收尾计划

> **For agentic workers:** 按 Task 顺序实现；每 Task 先写失败测试再改代码；完成后跑 `cd backend/agent && python3 -m ruff check && python3 -m pytest`。

**Goal:** 把 PDF 方案中「后端部分完成」项做到可验收闭环，同时遵守本仓边界：路径仍用 `/api/agent/*`，业务场景仍是 interface 查询/写确认（不引入 dataset/training）。

**Architecture:** 在现有 agent 上补齐 Intent → Context → Generator(模板优先，LLM 结构化兜底) → Validator(一次修复) → SSE → 持久化表 → Action 权限重校验。不新建 `/api/ai/*`；对方案中的 `/api/ai/chat` 在文档中明确等价映射。

**Tech Stack:** FastAPI、Pydantic、SQLite migrations、LangChain/LLM、pytest、ruff

---

## 范围定义（「部分完成 → 做完」）

| 原方案项 | 当前缺口 | 本计划「做完」标准 |
|---------|---------|-------------------|
| Chat API | 能力在 conversation，无清晰服务边界；路径非 `/api/ai/chat` | 抽出稳定 Chat 编排入口；文档声明与 `/api/agent/sessions/{id}/messages` 等价；**不**新增 `/api/ai/*` |
| Intent Router | 仅关键词 | 正式返回 `TEXT` / `TEXT_WITH_A2UI` / `A2UI_ONLY` + intent code；可单测 |
| Business Context | 散落在 tools | 新增 Context Service：按意图预取只读上下文，供 Generator 使用 |
| A2UI Generator | 仅模板 | 模板优先；需要动态 UI 时 LLM 输出结构化 JSON；校验失败自动修一次，再失败降级文本 |
| SSE 事件名 | 只有 `text` | **双发** `text` + `text-delta`（同 payload），文档与前端类型同步；`done` 字段保持 |
| 存储三表 | 仅 JSON | 新增 `agent_surfaces`、`agent_action_logs`；消息表可继续存摘要；读写接线 |
| 安全 | 白名单有，权限重校验弱 | Action 执行前重验接口存在且允许写；落 action_log；审计字段齐全 |

**明确不做：**
- 数据集 / 训练任务业务
- 新建 `/api/ai/*` 路由别名（避免双契约）
- 完整登录鉴权体系（另专项）
- 前端 Vue Renderer

---

## File Map

| 文件 | 动作 |
|------|------|
| `app/a2ui/intent.py` | 扩展三模式 |
| `app/services/business_context.py` | 新建 Context Service |
| `app/a2ui/generator.py` | 新建 Generator（模板 + LLM） |
| `app/services/conversation.py` | 接入 Intent/Context/Generator；SSE 双发 |
| `app/services/chat.py` | 新建薄编排门面（可选，或把 stream_response 收口） |
| `migrations/003_a2ui_surfaces.sql` | surfaces + action_logs |
| `app/repositories/a2ui_store.py` | 新建仓储 |
| `app/services/a2ui_actions.py` | 权限重校验 + action_log |
| `app/schemas/a2ui.py` | IntentOut 等 |
| `API.md` / `backend/API.md` / `agent-web/types.ts` | 契约 |

---

### Task 1: Intent Router 三模式

**Files:**
- Modify: `backend/agent/app/a2ui/intent.py`
- Modify: `backend/agent/app/schemas/a2ui.py`
- Test: `backend/agent/tests/test_a2ui_intent.py`

- [ ] 返回结构：

```python
{"responseMode": "TEXT"|"TEXT_WITH_A2UI"|"A2UI_ONLY", "intent": str, "confidence": float}
```

- [ ] 规则：
  - 纯寒暄/解释 → `TEXT` / `GENERAL_QA`
  - 查询列表/查看 → `TEXT_WITH_A2UI` / `INTERFACE_QUERY`
  - 明确只要表单/确认卡（如「给我一个新增用户表单」）→ `A2UI_ONLY` / `INTERFACE_WRITE_FORM`
  - 创建/删除/确认 → `TEXT_WITH_A2UI` / `INTERFACE_WRITE`
- [ ] 单测覆盖三类模式
- [ ] conversation 使用完整 Intent 结果

---

### Task 2: Business Context Service

**Files:**
- Create: `backend/agent/app/services/business_context.py`
- Test: `backend/agent/tests/test_business_context.py`

- [ ] `async def build_context(intent: str, user_text: str) -> dict`
- [ ] `INTERFACE_QUERY`：尝试 `list_projects` 摘要（限制条数）
- [ ] `INTERFACE_WRITE*`：尝试写接口列表摘要（mock admin_client）
- [ ] `GENERAL_QA`：返回空上下文 `{}`
- [ ] 失败不阻断主流程，返回 `{"error": "..."}` 并打日志
- [ ] conversation 在调 Generator 前调用

---

### Task 3: A2UI Generator（模板 + LLM + 一次修复）

**Files:**
- Create: `backend/agent/app/a2ui/generator.py`
- Test: `backend/agent/tests/test_a2ui_generator.py`

- [ ] `generate_a2ui(intent, context, tool_results, user_text) -> GenerateResult`
- [ ] 优先：tool_results 可表格 → 模板
- [ ] 其次：write 意图且 context 有接口 → 确认卡模板
- [ ] 再次：调用 LLM 要求纯 JSON 数组（多条 A2UI message）；`validate` 失败则带错误再生成一次；仍失败 → `degraded=True`，不发 A2UI
- [ ] LLM 调用可注入/mock；默认超时失败即降级
- [ ] 禁止把 HTML/JS 提示进 prompt；只允许 Catalog 组件名

---

### Task 4: SSE 双发 `text` + `text-delta`

**Files:**
- Modify: `backend/agent/app/services/conversation.py`
- Modify: `frontend/packages/agent-web/src/types.ts`
- Modify: `backend/agent/API.md`、`backend/API.md`
- Test: `backend/agent/tests/test_a2ui_sse.py`

- [ ] 每个文本增量连续 yield：
  1. `type=text`
  2. `type=text-delta`（相同 payload）
- [ ] 旧客户端只认 `text` 不受影响
- [ ] 新类型加入 `AgentSseEvent`；element 对 `text-delta` 若已处理 `text` 则跳过防重复（同 id 或标记）

前端防重复策略：若同一 `id` 已追加过文本则忽略 `text-delta`；或 element 只消费 `text`，`text-delta` 仅透出事件。

---

### Task 5: 持久化表 `agent_surfaces` / `agent_action_logs`

**Files:**
- Create: `backend/agent/migrations/003_a2ui_surfaces.sql`
- Create: `backend/agent/app/repositories/a2ui_store.py`
- Modify: `conversation.py`、`a2ui_actions.py`、history API（可选返回 surface 摘要）
- Test: `backend/agent/tests/test_a2ui_store.py`

```sql
CREATE TABLE agent_surfaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  surface_id TEXT NOT NULL UNIQUE,
  session_id TEXT NOT NULL,
  message_id TEXT NOT NULL DEFAULT '',
  catalog_version TEXT NOT NULL,
  component_json TEXT NOT NULL DEFAULT '{}',
  data_model_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'ready',
  create_time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES agent_sessions(session_id) ON DELETE CASCADE
);

CREATE TABLE agent_action_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  surface_id TEXT NOT NULL DEFAULT '',
  action_name TEXT NOT NULL,
  request_context TEXT NOT NULL DEFAULT '{}',
  execution_result TEXT NOT NULL DEFAULT '{}',
  idempotency_key TEXT NOT NULL DEFAULT '',
  operator_id TEXT NOT NULL DEFAULT '',
  create_time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agent_surfaces_session ON agent_surfaces(session_id);
CREATE INDEX idx_agent_action_logs_session ON agent_action_logs(session_id);
CREATE UNIQUE INDEX idx_agent_action_logs_idem ON agent_action_logs(idempotency_key)
  WHERE idempotency_key != '';
```

- [ ] stream 结束写 surfaces
- [ ] action 成功/失败写 action_logs
- [ ] 幂等改为查 DB unique（进程重启仍有效）；内存缓存可保留作快路径

---

### Task 6: Chat 服务层收口

**Files:**
- Create: `backend/agent/app/services/chat.py`
- Modify: `backend/agent/app/api/sessions.py` 改为调 `chat.stream_message`
- Docs: API.md 增加「与方案 `/api/ai/chat` 等价说明」

- [ ] `chat.stream_message(session_id, content)` 委托现有 `stream_response`
- [ ] 路由层变薄；业务编排集中在 chat/conversation

---

### Task 7: Action 权限重校验

**Files:**
- Modify: `backend/agent/app/services/a2ui_actions.py`
- Test: `backend/agent/tests/test_a2ui_actions.py`

- [ ] confirm 前：`get_interface` + config，断言 `readOnly=false` 且 method 允许
- [ ] 失败返回明确错误码 `WRITE_NOT_ALLOWED` / `INTERFACE_NOT_FOUND`
- [ ] 结果写入 `agent_action_logs`
- [ ] preview 不落执行结果，可落 `action_name=interface.write.preview`

---

### Task 8: 验证

- [ ] `python3 -m ruff check`
- [ ] `python3 -m pytest`
- [ ] 手工：查询意图出现 `text`+`text-delta`+`a2ui-message`；action 重复 key 不二次执行；surfaces/action_logs 有行

---

## 验收对照（对 PDF）

| PDF 后端模块 | 验收 |
|-------------|------|
| Chat API | `/api/agent/.../messages` + chat 门面；文档等价说明 |
| Intent Router | 三模式可测 |
| Business Context | 独立 service |
| A2UI Generator | 模板 + LLM + 一次修复 + 降级 |
| Validator | 已有，Generator 强制走 |
| Action Dispatcher | 已有 + 权限重校验 + DB 幂等/日志 |
| SSE | `text`/`text-delta`/`a2ui-message`/`done`/`error` |
| 存储 | surfaces + action_logs 表 |
| 安全 | 白名单 + 写接口重验 + 审计日志 |
