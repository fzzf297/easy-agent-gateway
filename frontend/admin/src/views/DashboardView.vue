<template>
  <div class="dashboard-page">
    <div class="page-header">
      <div>
        <h1>运行概览</h1>
        <div class="muted">查看后台服务状态，并快速进入项目、页面、接口和审计管理。</div>
      </div>
      <a-button type="primary" :loading="loading" @click="loadOverview">刷新状态</a-button>
    </div>

    <a-row :gutter="[16, 16]" class="dashboard-status-grid">
      <a-col :xs="24" :md="8">
        <a-card class="dashboard-card dashboard-card--admin" title="Admin API" :bordered="false">
          <a-spin :spinning="loading">
            <div class="dashboard-health">
              <a-tag :color="adminHealthy ? 'green' : 'red'">
                {{ adminStatus || "unknown" }}
              </a-tag>
              <span>{{ adminHealthy ? "服务正常" : "等待恢复" }}</span>
            </div>
            <p class="muted dashboard-card__note">{{ adminHealthError || "后台管理接口健康检查" }}</p>
          </a-spin>
        </a-card>
      </a-col>
      <a-col :xs="24" :md="8">
        <a-card class="dashboard-card dashboard-card--agent" title="Agent API" :bordered="false">
          <a-spin :spinning="loading">
            <div class="dashboard-health">
              <a-tag :color="agentHealthy ? 'green' : 'orange'">
                {{ agentHealth?.status || "unknown" }}
              </a-tag>
              <span>{{ agentHealthy ? "可接受调用" : "状态未知" }}</span>
            </div>
            <p class="muted dashboard-card__note">
              admin: {{ agentHealth?.admin || "unknown" }} / model: {{ agentHealth?.model || "-" }}
            </p>
          </a-spin>
        </a-card>
      </a-col>
      <a-col :xs="24" :md="8">
        <a-card class="dashboard-card dashboard-card--project" title="项目配置" :bordered="false">
          <a-statistic title="项目总数" :value="projectTotal" />
          <router-link class="dashboard-action-link" to="/projects">进入项目管理</router-link>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]" class="dashboard-section">
      <a-col :xs="24" :md="8">
        <a-card class="dashboard-card" title="当前管理员" :bordered="false">
          <a-descriptions size="small" :column="1">
            <a-descriptions-item label="用户名">{{ auth.user?.username || "-" }}</a-descriptions-item>
            <a-descriptions-item label="显示名">{{ auth.user?.displayName || "-" }}</a-descriptions-item>
            <a-descriptions-item label="状态">
              <a-tag :color="auth.user?.status === 'active' ? 'green' : 'default'">
                {{ auth.user?.status || "-" }}
              </a-tag>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
      <a-col :xs="24" :md="8">
        <a-card class="dashboard-card dashboard-card--link" title="页面配置" :bordered="false">
          <p class="muted">在项目列表中进入页面配置，维护页面路由、排序和 JSON 配置。</p>
          <router-link class="dashboard-action-link" to="/projects">选择项目</router-link>
        </a-card>
      </a-col>
      <a-col :xs="24" :md="8">
        <a-card class="dashboard-card dashboard-card--link" title="接口与审计" :bordered="false">
          <p class="muted">管理接口元数据、YAML 执行配置，并查看 Agent 调用审计。</p>
          <a-space>
            <router-link class="dashboard-action-link" to="/projects">接口管理</router-link>
            <router-link class="dashboard-action-link" to="/audit">Agent 审计</router-link>
          </a-space>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { getAdminHealth, getAgentHealth } from "@/api/health";
import { listProjects } from "@/api/projects";
import { getErrorMessage } from "@/api/request";
import { useAuthStore } from "@/stores/auth";
import type { AgentHealth } from "@/types/admin";

const auth = useAuthStore();
const loading = ref(false);
const adminStatus = ref("");
const adminHealthError = ref("");
const agentHealth = ref<AgentHealth | null>(null);
const projectTotal = ref(0);

const adminHealthy = computed(() => adminStatus.value === "ok");
const agentHealthy = computed(() => agentHealth.value?.status === "ok");

async function loadOverview() {
  loading.value = true;
  adminHealthError.value = "";
  const [adminResult, agentResult, projectResult] = await Promise.allSettled([
    getAdminHealth(),
    getAgentHealth(),
    listProjects({ page: 1, pageSize: 1 })
  ]);

  if (adminResult.status === "fulfilled") {
    adminStatus.value = adminResult.value.status;
  } else {
    adminStatus.value = "unreachable";
    adminHealthError.value = getErrorMessage(adminResult.reason);
  }

  if (agentResult.status === "fulfilled") {
    agentHealth.value = agentResult.value;
  } else {
    agentHealth.value = { status: "unreachable", admin: "unknown", model: "-" };
  }

  if (projectResult.status === "fulfilled") {
    projectTotal.value = projectResult.value.total;
  }
  loading.value = false;
}

onMounted(loadOverview);
</script>

<style scoped>
.dashboard-page {
  max-width: 1280px;
}

.dashboard-status-grid {
  align-items: stretch;
}

.dashboard-section {
  margin-top: 16px;
}

.dashboard-card {
  height: 100%;
  overflow: hidden;
}

.dashboard-card :deep(.ant-card-body) {
  min-height: 136px;
}

.dashboard-card--admin,
.dashboard-card--agent,
.dashboard-card--project {
  position: relative;
}

.dashboard-card--admin::before,
.dashboard-card--agent::before,
.dashboard-card--project::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 4px;
}

.dashboard-card--admin::before {
  background: #2563eb;
}

.dashboard-card--agent::before {
  background: #0f766e;
}

.dashboard-card--project::before {
  background: #16a34a;
}

.dashboard-health {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #475467;
  font-weight: 650;
}

.dashboard-card__note {
  min-height: 22px;
  margin: 12px 0 0;
}

.dashboard-action-link {
  display: inline-flex;
  align-items: center;
  margin-top: 12px;
  font-weight: 700;
}

.dashboard-card--link :deep(.ant-card-body) {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
</style>
