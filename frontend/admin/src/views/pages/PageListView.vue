<template>
  <div>
    <div class="page-header">
      <div>
        <h1>页面配置</h1>
        <div class="muted">{{ projectLabel }} 下的页面路由和配置。</div>
      </div>
      <div class="toolbar">
        <router-link to="/projects">返回项目</router-link>
        <a-button type="primary" @click="openCreate">新建页面</a-button>
      </div>
    </div>

    <div class="content-card">
      <div class="toolbar">
        <a-input-search
          v-model:value="query.keyword"
          allow-clear
          placeholder="搜索 code / 名称"
          style="width: 260px"
          @search="loadPages"
        />
        <a-button @click="loadPages">刷新</a-button>
      </div>

      <a-table
        row-key="id"
        :columns="columns"
        :data-source="items"
        :loading="loading"
        :pagination="pagination"
        style="margin-top: 16px"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-switch
              :checked="record.status === 'enabled'"
              :checked-children="statusSwitchText.checked"
              :un-checked-children="statusSwitchText.unchecked"
              :loading="statusChangingId === record.id"
              @change="togglePageStatus(record, $event)"
            />
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="openVersions(record)">版本</a-button>
              <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
              <a-popconfirm title="确认删除该页面？" @confirm="removePage(record.id)">
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <a-modal
      v-model:open="modalOpen"
      :title="editing ? '编辑页面' : '新建页面'"
      :confirm-loading="saving"
      @ok="savePage"
    >
      <a-form layout="vertical" :model="form">
        <a-form-item label="页面 code" required>
          <a-input v-model:value="form.code" />
        </a-form-item>
        <a-form-item label="页面名称" required>
          <a-input v-model:value="form.name" />
        </a-form-item>
        <a-form-item label="路由" required>
          <a-input v-model:value="form.route" placeholder="/system/user" />
        </a-form-item>
        <a-form-item label="排序">
          <a-input-number v-model:value="form.sortOrder" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item label="页面 JSON 配置">
          <a-textarea v-model:value="configText" :rows="8" />
        </a-form-item>
        <a-form-item label="状态">
          <a-radio-group v-model:value="form.status">
            <a-radio-button value="enabled">启用</a-radio-button>
            <a-radio-button value="disabled">禁用</a-radio-button>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-drawer
      v-model:open="versionDrawerOpen"
      :title="versionPage ? `${versionPage.name} 版本` : '页面版本'"
      width="760"
    >
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
  </div>
</template>

<script setup lang="ts">
import type { TablePaginationConfig } from "ant-design-vue";
import { message } from "ant-design-vue";
import { computed, onMounted, reactive, ref } from "vue";

import {
  createPage,
  deletePage,
  getPage,
  getPageVersion,
  listPageVersions,
  listPages,
  updatePage,
  updatePageStatus
} from "@/api/pages";
import { getProject } from "@/api/projects";
import { getErrorMessage } from "@/api/request";
import type { AdminPage, ConfigVersion, PagePayload, Project, Status } from "@/types/admin";

const props = defineProps<{
  projectId: string;
}>();

const statusSwitchText = {
  checked: "启用",
  unchecked: "禁用"
};
const numericProjectId = computed(() => Number(props.projectId));
const loading = ref(false);
const saving = ref(false);
const modalOpen = ref(false);
const editing = ref<AdminPage | null>(null);
const items = ref<AdminPage[]>([]);
const total = ref(0);
const configText = ref("{}");
const project = ref<Project | null>(null);
const statusChangingId = ref<number | null>(null);
const versionDrawerOpen = ref(false);
const versionLoading = ref(false);
const versionPage = ref<AdminPage | null>(null);
const versionItems = ref<ConfigVersion[]>([]);
const versionTotal = ref(0);
const versionDetailOpen = ref(false);
const versionDetailLoading = ref(false);
const versionDetail = ref<ConfigVersion | null>(null);

const query = reactive({
  page: 1,
  pageSize: 20,
  keyword: ""
});

const form = reactive<PagePayload>({
  code: "",
  name: "",
  route: "",
  sortOrder: 0,
  status: "enabled",
  config: {}
});

const columns = [
  { title: "ID", dataIndex: "id", width: 80 },
  { title: "Code", dataIndex: "code" },
  { title: "名称", dataIndex: "name" },
  { title: "路由", dataIndex: "route" },
  { title: "排序", dataIndex: "sortOrder", width: 90 },
  { title: "状态", dataIndex: "status", key: "status", width: 110 },
  { title: "操作", key: "actions", width: 220 }
];

const versionColumns = [
  { title: "版本", dataIndex: "version", width: 90 },
  { title: "动作", dataIndex: "action", width: 120 },
  { title: "创建时间", dataIndex: "createdAt" },
  { title: "操作", key: "actions", width: 120 }
];

const pagination = computed<TablePaginationConfig>(() => ({
  current: query.page,
  pageSize: query.pageSize,
  total: total.value,
  showSizeChanger: true
}));

const versionQuery = reactive({
  page: 1,
  pageSize: 20
});

const versionPagination = computed<TablePaginationConfig>(() => ({
  current: versionQuery.page,
  pageSize: versionQuery.pageSize,
  total: versionTotal.value,
  showSizeChanger: true
}));

const projectLabel = computed(() => {
  if (!project.value) return `项目 #${props.projectId}`;
  return `${project.value.name} (${project.value.code})`;
});

const versionDetailTitle = computed(() =>
  versionDetail.value ? `页面版本 v${versionDetail.value.version}` : "页面版本快照"
);

function resetForm() {
  Object.assign(form, {
    code: "",
    name: "",
    route: "",
    sortOrder: 0,
    status: "enabled",
    config: {}
  });
  configText.value = "{}";
}

async function loadProject() {
  try {
    project.value = await getProject(numericProjectId.value);
  } catch (error) {
    message.error(getErrorMessage(error));
  }
}

async function loadPages() {
  loading.value = true;
  try {
    const response = await listPages(numericProjectId.value, query);
    items.value = response.items;
    total.value = response.total;
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    loading.value = false;
  }
}

function handleTableChange(pager: TablePaginationConfig) {
  query.page = pager.current || 1;
  query.pageSize = pager.pageSize || 20;
  loadPages();
}

function openCreate() {
  editing.value = null;
  resetForm();
  modalOpen.value = true;
}

async function openEdit(page: AdminPage) {
  try {
    const detail = await getPage(page.id);
    editing.value = detail;
    Object.assign(form, {
      code: detail.code,
      name: detail.name,
      route: detail.route,
      sortOrder: detail.sortOrder,
      status: detail.status,
      config: detail.config
    });
    configText.value = JSON.stringify(detail.config || {}, null, 2);
    modalOpen.value = true;
  } catch (error) {
    message.error(getErrorMessage(error));
  }
}

function parseConfig() {
  try {
    return JSON.parse(configText.value || "{}") as Record<string, unknown>;
  } catch {
    message.error("页面 JSON 配置格式不正确");
    return null;
  }
}

async function savePage() {
  const parsedConfig = parseConfig();
  if (!parsedConfig) return;

  saving.value = true;
  try {
    const payload = { ...form, config: parsedConfig };
    if (editing.value) {
      await updatePage(editing.value.id, payload);
    } else {
      await createPage(numericProjectId.value, payload);
    }
    modalOpen.value = false;
    await loadPages();
    message.success("保存成功");
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

async function removePage(pageId: number) {
  try {
    await deletePage(pageId);
    await loadPages();
    message.success("删除成功");
  } catch (error) {
    message.error(getErrorMessage(error));
  }
}

async function togglePageStatus(page: AdminPage, checked: boolean | string | number) {
  const status: Status = checked ? "enabled" : "disabled";
  statusChangingId.value = page.id;
  try {
    await updatePageStatus(page.id, status);
    page.status = status;
    message.success("状态已更新");
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    statusChangingId.value = null;
  }
}

async function openVersions(page: AdminPage) {
  versionPage.value = page;
  versionQuery.page = 1;
  versionDrawerOpen.value = true;
  await loadVersions();
}

async function loadVersions() {
  if (!versionPage.value) return;
  versionLoading.value = true;
  try {
    const response = await listPageVersions(versionPage.value.id, versionQuery);
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
  if (!versionPage.value) return;
  versionDetailOpen.value = true;
  versionDetailLoading.value = true;
  try {
    versionDetail.value = await getPageVersion(versionPage.value.id, version);
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    versionDetailLoading.value = false;
  }
}

function formatJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

onMounted(() => {
  loadProject();
  loadPages();
});
</script>
