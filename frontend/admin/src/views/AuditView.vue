<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Agent 审计</h1>
        <div class="muted">查看 Agent 消息、接口试运行和工具调用相关审计事件。</div>
      </div>
      <a-button :loading="loading" @click="loadAudit">刷新</a-button>
    </div>

    <div class="content-card">
      <a-form layout="inline" class="audit-toolbar">
        <a-form-item label="Session ID">
          <a-input-search
            v-model:value="query.sessionId"
            allow-clear
            placeholder="输入 sessionId 精确查询"
            style="width: 340px"
            @search="searchAudit"
          />
        </a-form-item>
        <a-form-item label="消息">
          <a-switch v-model:checked="query.includeMessages" />
        </a-form-item>
        <a-form-item label="评分">
          <a-switch v-model:checked="query.includeScore" />
        </a-form-item>
        <a-form-item label="会话列表">
          <a-switch v-model:checked="query.includeSessions" />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" :loading="loading" @click="searchAudit">查询</a-button>
            <a-button @click="resetFilters">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-alert
        v-if="(query.includeMessages || query.includeScore) && !query.sessionId"
        type="info"
        show-icon
        message="消息和评分需要指定 sessionId；未填写时后端只会返回审计事件列表。"
        class="audit-hint"
      />

      <a-table
        row-key="id"
        :columns="columns"
        :data-source="items"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-tag color="blue">{{ record.action }}</a-tag>
          </template>
          <template v-else-if="column.key === 'sessionId'">
            <a-typography-text copyable>{{ record.sessionId || "-" }}</a-typography-text>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-button type="link" size="small" @click="openDetail(record)">详情</a-button>
          </template>
        </template>
      </a-table>
    </div>

    <a-drawer v-model:open="detailOpen" title="审计详情" width="820">
      <template v-if="selectedEvent">
        <a-descriptions size="small" :column="2" bordered>
          <a-descriptions-item label="ID">{{ selectedEvent.id }}</a-descriptions-item>
          <a-descriptions-item label="动作">{{ selectedEvent.action }}</a-descriptions-item>
          <a-descriptions-item label="Session ID">
            <a-typography-text copyable>{{ selectedEvent.sessionId || "-" }}</a-typography-text>
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ selectedEvent.createdAt }}</a-descriptions-item>
        </a-descriptions>

        <h3>事件详情</h3>
        <pre class="json-preview">{{ formatJson(selectedEvent.detail) }}</pre>

        <template v-if="query.includeMessages">
          <h3>消息历史</h3>
          <a-timeline v-if="messages.length">
            <a-timeline-item
              v-for="(item, index) in messages"
              :key="`${item.createdAt}-${index}`"
              :color="item.role === 'assistant' ? 'green' : 'blue'"
            >
              <div class="audit-message__meta">{{ item.role }} / {{ item.createdAt }}</div>
              <div class="audit-message__content">{{ item.content }}</div>
            </a-timeline-item>
          </a-timeline>
          <a-empty v-else description="暂无消息历史" />
        </template>

        <template v-if="query.includeScore">
          <h3>会话评分</h3>
          <a-descriptions v-if="score" size="small" :column="2" bordered>
            <a-descriptions-item label="用户">{{ score.userLabel || "-" }}</a-descriptions-item>
            <a-descriptions-item label="评分">{{ score.score }}</a-descriptions-item>
            <a-descriptions-item label="更新时间">{{ score.updatedAt }}</a-descriptions-item>
            <a-descriptions-item label="评论">{{ score.comment || "-" }}</a-descriptions-item>
          </a-descriptions>
          <a-empty v-else description="暂无评分" />
        </template>

        <template v-if="query.includeSessions">
          <h3>会话列表</h3>
          <a-table
            row-key="sessionId"
            size="small"
            :columns="sessionColumns"
            :data-source="sessions"
            :pagination="false"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'sessionId'">
                <a-button type="link" size="small" @click="filterBySession(record.sessionId)">
                  {{ record.sessionId }}
                </a-button>
              </template>
              <template v-else-if="column.key === 'score'">
                {{ record.score ?? "-" }}
              </template>
            </template>
          </a-table>
        </template>
      </template>
      <a-empty v-else description="请选择一条审计事件" />
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import type { TablePaginationConfig } from "ant-design-vue";
import { message } from "ant-design-vue";
import { computed, onMounted, reactive, ref } from "vue";

import { getAgentAudit } from "@/api/audit";
import { getErrorMessage } from "@/api/request";
import type {
  AgentAuditEvent,
  AgentMessage,
  AgentScore,
  AgentSessionSummary
} from "@/types/admin";

const loading = ref(false);
const detailOpen = ref(false);
const selectedEvent = ref<AgentAuditEvent | null>(null);
const items = ref<AgentAuditEvent[]>([]);
const total = ref(0);
const messages = ref<AgentMessage[]>([]);
const score = ref<AgentScore | null>(null);
const sessions = ref<AgentSessionSummary[]>([]);

const query = reactive({
  sessionId: "",
  page: 1,
  pageSize: 20,
  includeMessages: false,
  includeScore: false,
  includeSessions: false
});

const columns = [
  { title: "ID", dataIndex: "id", width: 90 },
  { title: "动作", dataIndex: "action", key: "action", width: 220 },
  { title: "Session ID", dataIndex: "sessionId", key: "sessionId", ellipsis: true },
  { title: "创建时间", dataIndex: "createdAt", width: 220 },
  { title: "操作", key: "actions", width: 100 }
];

const sessionColumns = [
  { title: "Session ID", dataIndex: "sessionId", key: "sessionId", ellipsis: true },
  { title: "用户", dataIndex: "userLabel", width: 120 },
  { title: "评分", dataIndex: "score", key: "score", width: 80 },
  { title: "更新时间", dataIndex: "updatedAt", width: 180 }
];

const pagination = computed<TablePaginationConfig>(() => ({
  current: query.page,
  pageSize: query.pageSize,
  total: total.value,
  showSizeChanger: true
}));

async function loadAudit() {
  loading.value = true;
  try {
    const response = await getAgentAudit({
      sessionId: query.sessionId || undefined,
      page: query.page,
      pageSize: query.pageSize,
      includeMessages: query.includeMessages,
      includeScore: query.includeScore,
      includeSessions: query.includeSessions
    });
    items.value = response.items;
    total.value = response.total;
    messages.value = response.messages || [];
    score.value = response.score ?? null;
    sessions.value = response.sessions || [];
    if (selectedEvent.value) {
      selectedEvent.value =
        response.items.find((item) => item.id === selectedEvent.value?.id) || selectedEvent.value;
    }
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    loading.value = false;
  }
}

function searchAudit() {
  query.page = 1;
  loadAudit();
}

function resetFilters() {
  Object.assign(query, {
    sessionId: "",
    page: 1,
    pageSize: 20,
    includeMessages: false,
    includeScore: false,
    includeSessions: false
  });
  selectedEvent.value = null;
  detailOpen.value = false;
  loadAudit();
}

function handleTableChange(pager: TablePaginationConfig) {
  query.page = pager.current || 1;
  query.pageSize = pager.pageSize || 20;
  loadAudit();
}

function openDetail(record: AgentAuditEvent) {
  selectedEvent.value = record;
  detailOpen.value = true;
}

function filterBySession(sessionId: string) {
  query.sessionId = sessionId;
  query.includeMessages = true;
  query.includeScore = true;
  query.page = 1;
  detailOpen.value = false;
  loadAudit();
}

function formatJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

onMounted(loadAudit);
</script>

<style scoped>
.audit-toolbar {
  row-gap: 12px;
}

.audit-hint {
  margin: 12px 0 16px;
}

.audit-message__meta {
  color: #6b7280;
  font-size: 12px;
}

.audit-message__content {
  margin-top: 4px;
  white-space: pre-wrap;
}
</style>
