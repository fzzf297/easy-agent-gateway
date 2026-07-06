<template>
  <div>
    <div class="page-header">
      <div>
        <h1>接口 YAML 配置</h1>
        <div class="muted">{{ interfaceLabel }} 的 Agent 声明式执行配置。</div>
      </div>
      <div class="toolbar">
        <a-button @click="router.back()">返回</a-button>
        <a-button @click="openVersions">版本</a-button>
        <a-button @click="openTestDrawer">接口试运行</a-button>
        <a-button :loading="validating" @click="validateYaml">校验 YAML</a-button>
        <a-button type="primary" :loading="saving" @click="saveYaml">保存</a-button>
      </div>
    </div>

    <div class="content-card interface-summary">
      <a-spin :spinning="metadataLoading">
        <a-descriptions size="small" :column="{ xs: 1, md: 2, xl: 4 }">
          <a-descriptions-item label="项目">{{ project?.code || interfaceDetail?.projectId || "-" }}</a-descriptions-item>
          <a-descriptions-item label="接口">{{ interfaceDetail?.code || interfaceId }}</a-descriptions-item>
          <a-descriptions-item label="方法">
            <a-tag v-if="interfaceDetail" color="blue">{{ interfaceDetail.method }}</a-tag>
            <span v-else>-</span>
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="interfaceDetail?.status === 'enabled' ? 'green' : 'default'">
              {{ interfaceDetail?.status || "-" }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="路径">{{ interfaceDetail?.path || "-" }}</a-descriptions-item>
          <a-descriptions-item label="认证模式">{{ interfaceDetail?.authMode || "-" }}</a-descriptions-item>
        </a-descriptions>
      </a-spin>
    </div>

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="14">
        <div class="content-card">
          <a-textarea v-model:value="yamlText" class="yaml-editor" :rows="28" />
        </div>
      </a-col>
      <a-col :xs="24" :lg="10">
        <div class="content-card">
          <h3>解析结果</h3>
          <a-spin :spinning="loading">
            <pre class="parsed-preview">{{ parsedPreview }}</pre>
          </a-spin>
        </div>
      </a-col>
    </a-row>

    <a-drawer v-model:open="versionDrawerOpen" title="接口配置版本" width="760">
      <a-table
        row-key="id"
        :columns="versionColumns"
        :data-source="versionItems"
        :loading="versionLoading"
        :pagination="versionPagination"
        @change="handleVersionTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'actions'">
            <a-button type="link" size="small" @click="openVersionDetail(record.version)">查看快照</a-button>
          </template>
        </template>
      </a-table>
    </a-drawer>

    <a-modal v-model:open="versionDetailOpen" :title="versionDetailTitle" width="760px" :footer="null">
      <a-spin :spinning="versionDetailLoading">
        <a-descriptions v-if="versionDetail" size="small" :column="2" bordered>
          <a-descriptions-item label="版本">{{ versionDetail.version }}</a-descriptions-item>
          <a-descriptions-item label="动作">{{ versionDetail.action }}</a-descriptions-item>
          <a-descriptions-item label="实体 ID">{{ versionDetail.entityId }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ versionDetail.createdAt }}</a-descriptions-item>
        </a-descriptions>
        <pre class="json-preview">{{ formatJson(versionDetail?.snapshot) }}</pre>
      </a-spin>
    </a-modal>

    <a-drawer v-model:open="testDrawerOpen" title="接口试运行" width="760">
      <a-form layout="vertical" :model="testForm">
        <a-form-item label="项目 code" required>
          <a-input v-model:value="testForm.projectCode" placeholder="demo" />
        </a-form-item>
        <a-form-item label="接口 code" required>
          <a-input v-model:value="testForm.interfaceCode" placeholder="user_list" />
        </a-form-item>
        <a-form-item label="参数 JSON">
          <a-textarea v-model:value="testForm.paramsText" :rows="8" placeholder="{&quot;pageNum&quot;:&quot;1&quot;}" />
        </a-form-item>
        <a-button type="primary" :loading="testRunning" @click="runInterfaceTest">运行</a-button>
      </a-form>

      <div v-if="testResult" class="test-result">
        <a-alert
          show-icon
          :type="testResult.ok ? 'success' : 'error'"
          :message="testResult.ok ? '试运行成功' : '试运行失败'"
          :description="testResult.error?.code || `耗时 ${testResult.durationMs}ms`"
        />
        <a-descriptions size="small" :column="2" bordered class="test-result__meta">
          <a-descriptions-item label="项目">{{ testResult.projectCode }}</a-descriptions-item>
          <a-descriptions-item label="接口">{{ testResult.interfaceCode }}</a-descriptions-item>
          <a-descriptions-item label="耗时">{{ testResult.durationMs }}ms</a-descriptions-item>
          <a-descriptions-item label="使用认证">{{ testResult.authUsed ? "是" : "否" }}</a-descriptions-item>
        </a-descriptions>
        <h3>预览</h3>
        <pre class="json-preview">{{ testResult.preview || formatJson(testResult.error || testResult.data) }}</pre>
      </div>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import type { TablePaginationConfig } from "ant-design-vue";
import { message } from "ant-design-vue";
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";

import {
  getInterface,
  getInterfaceConfig,
  getInterfaceVersion,
  listInterfaceVersions,
  saveInterfaceYaml,
  testInterface,
  validateInterfaceYaml
} from "@/api/interfaces";
import { getProject } from "@/api/projects";
import { getErrorMessage } from "@/api/request";
import type { AppInterface, ConfigVersion, InterfaceTestResult, Project } from "@/types/admin";

const props = defineProps<{
  interfaceId: string;
}>();

const router = useRouter();
const numericInterfaceId = computed(() => Number(props.interfaceId));
const yamlText = ref("");
const parsedConfig = ref<Record<string, unknown>>({});
const loading = ref(false);
const metadataLoading = ref(false);
const validating = ref(false);
const saving = ref(false);
const interfaceDetail = ref<AppInterface | null>(null);
const project = ref<Project | null>(null);
const versionDrawerOpen = ref(false);
const versionLoading = ref(false);
const versionItems = ref<ConfigVersion[]>([]);
const versionTotal = ref(0);
const versionDetailOpen = ref(false);
const versionDetailLoading = ref(false);
const versionDetail = ref<ConfigVersion | null>(null);
const testDrawerOpen = ref(false);
const testRunning = ref(false);
const testResult = ref<InterfaceTestResult | null>(null);

const testForm = reactive({
  projectCode: "",
  interfaceCode: "",
  paramsText: "{}"
});

const versionQuery = reactive({
  page: 1,
  pageSize: 20
});

const versionColumns = [
  { title: "版本", dataIndex: "version", width: 90 },
  { title: "动作", dataIndex: "action", width: 120 },
  { title: "创建时间", dataIndex: "createdAt" },
  { title: "操作", key: "actions", width: 120 }
];

const parsedPreview = computed(() => JSON.stringify(parsedConfig.value, null, 2));
const interfaceLabel = computed(() => {
  if (!interfaceDetail.value) return `接口 #${props.interfaceId}`;
  return `${interfaceDetail.value.name} (${interfaceDetail.value.code})`;
});
const versionPagination = computed<TablePaginationConfig>(() => ({
  current: versionQuery.page,
  pageSize: versionQuery.pageSize,
  total: versionTotal.value,
  showSizeChanger: true
}));
const versionDetailTitle = computed(() =>
  versionDetail.value ? `接口配置版本 v${versionDetail.value.version}` : "接口配置版本快照"
);

async function loadMetadata() {
  metadataLoading.value = true;
  try {
    const detail = await getInterface(numericInterfaceId.value);
    interfaceDetail.value = detail;
    testForm.interfaceCode = detail.code;
    project.value = await getProject(detail.projectId);
    testForm.projectCode = project.value.code;
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    metadataLoading.value = false;
  }
}

async function loadConfig() {
  loading.value = true;
  try {
    const response = await getInterfaceConfig(numericInterfaceId.value);
    yamlText.value = response.yamlText;
    parsedConfig.value = response.parsedConfig || {};
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    loading.value = false;
  }
}

async function validateYaml() {
  validating.value = true;
  try {
    const response = await validateInterfaceYaml(yamlText.value);
    parsedConfig.value = response.parsedConfig || {};
    message.success("YAML 校验通过");
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    validating.value = false;
  }
}

async function saveYaml() {
  saving.value = true;
  try {
    const response = await saveInterfaceYaml(numericInterfaceId.value, yamlText.value);
    parsedConfig.value = response.parsedConfig || {};
    message.success("保存成功");
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

async function openVersions() {
  versionQuery.page = 1;
  versionDrawerOpen.value = true;
  await loadVersions();
}

async function loadVersions() {
  versionLoading.value = true;
  try {
    const response = await listInterfaceVersions(numericInterfaceId.value, versionQuery);
    versionItems.value = response.items;
    versionTotal.value = response.total;
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    versionLoading.value = false;
  }
}

function handleVersionTableChange(pager: TablePaginationConfig) {
  versionQuery.page = pager.current || 1;
  versionQuery.pageSize = pager.pageSize || 20;
  loadVersions();
}

async function openVersionDetail(version: number) {
  versionDetail.value = null;
  versionDetailOpen.value = true;
  versionDetailLoading.value = true;
  try {
    versionDetail.value = await getInterfaceVersion(numericInterfaceId.value, version);
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    versionDetailLoading.value = false;
  }
}

function openTestDrawer() {
  testResult.value = null;
  if (project.value) testForm.projectCode = project.value.code;
  if (interfaceDetail.value) testForm.interfaceCode = interfaceDetail.value.code;
  testDrawerOpen.value = true;
}

function parseParams() {
  try {
    return JSON.parse(testForm.paramsText || "{}") as Record<string, unknown>;
  } catch {
    message.error("参数 JSON 格式不正确");
    return null;
  }
}

async function runInterfaceTest() {
  const params = parseParams();
  if (!params) return;
  testRunning.value = true;
  try {
    testResult.value = await testInterface({
      projectCode: testForm.projectCode,
      interfaceCode: testForm.interfaceCode,
      params
    });
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    testRunning.value = false;
  }
}

function formatJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

onMounted(() => {
  loadMetadata();
  loadConfig();
});
</script>

<style scoped>
.interface-summary {
  margin-bottom: 16px;
}

.yaml-editor {
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
}

.parsed-preview {
  min-height: 640px;
  margin: 0;
  padding: 12px;
  overflow: auto;
  color: #111827;
  background: #f8fafc;
  border: 1px solid #edf0f5;
  border-radius: 6px;
  white-space: pre-wrap;
}

.test-result {
  margin-top: 20px;
}

.test-result__meta {
  margin-top: 16px;
}
</style>
