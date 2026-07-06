<template>
  <div>
    <div class="page-header">
      <div>
        <h1>项目管理</h1>
        <div class="muted">配置 Agent 可读取的项目和三方业务 baseUrl。</div>
      </div>
      <a-button type="primary" @click="openCreate">新建项目</a-button>
    </div>

    <div class="content-card">
      <div class="toolbar">
        <a-input-search
          v-model:value="query.keyword"
          allow-clear
          placeholder="搜索 code / 名称"
          style="width: 260px"
          @search="loadProjects"
        />
        <a-button @click="loadProjects">刷新</a-button>
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
              @change="toggleProjectStatus(record, $event)"
            />
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="openPages(record.id)">页面</a-button>
              <a-button type="link" size="small" @click="openInterfaces(record.id)">接口</a-button>
              <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
              <a-popconfirm title="确认删除该项目？" @confirm="removeProject(record.id)">
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <a-modal
      v-model:open="modalOpen"
      :title="editing ? '编辑项目' : '新建项目'"
      :confirm-loading="saving"
      @ok="saveProject"
    >
      <a-form layout="vertical" :model="form">
        <a-form-item label="项目 code" required>
          <a-input v-model:value="form.code" placeholder="ruoyi-classic" />
        </a-form-item>
        <a-form-item label="项目名称" required>
          <a-input v-model:value="form.name" />
        </a-form-item>
        <a-form-item label="业务 baseUrl">
          <a-input v-model:value="form.baseUrl" placeholder="http://host.docker.internal:8080" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="form.description" :rows="3" />
        </a-form-item>
        <a-form-item label="状态">
          <a-radio-group v-model:value="form.status">
            <a-radio-button value="enabled">启用</a-radio-button>
            <a-radio-button value="disabled">禁用</a-radio-button>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import type { TablePaginationConfig } from "ant-design-vue";
import { message } from "ant-design-vue";
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";

import { createProject, deleteProject, getProject, listProjects, patchProjectStatus, updateProject } from "@/api/projects";
import { getErrorMessage } from "@/api/request";
import type { Project, ProjectPayload, Status } from "@/types/admin";

const router = useRouter();
const statusSwitchText = {
  checked: "启用",
  unchecked: "禁用"
};
const loading = ref(false);
const saving = ref(false);
const modalOpen = ref(false);
const editing = ref<Project | null>(null);
const items = ref<Project[]>([]);
const total = ref(0);
const statusChangingId = ref<number | null>(null);

const query = reactive({
  page: 1,
  pageSize: 20,
  keyword: ""
});

const form = reactive<ProjectPayload>({
  code: "",
  name: "",
  description: "",
  baseUrl: "",
  status: "enabled"
});

const columns = [
  { title: "ID", dataIndex: "id", width: 80 },
  { title: "Code", dataIndex: "code" },
  { title: "名称", dataIndex: "name" },
  { title: "Base URL", dataIndex: "baseUrl", ellipsis: true },
  { title: "状态", dataIndex: "status", key: "status", width: 110 },
  { title: "更新时间", dataIndex: "updatedAt", width: 220 },
  { title: "操作", key: "actions", width: 260 }
];

const pagination = computed<TablePaginationConfig>(() => ({
  current: query.page,
  pageSize: query.pageSize,
  total: total.value,
  showSizeChanger: true
}));

function resetForm() {
  Object.assign(form, {
    code: "",
    name: "",
    description: "",
    baseUrl: "",
    status: "enabled"
  });
}

async function loadProjects() {
  loading.value = true;
  try {
    const response = await listProjects(query);
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
  loadProjects();
}

function openCreate() {
  editing.value = null;
  resetForm();
  modalOpen.value = true;
}

function openPages(projectId: number) {
  router.push(`/projects/${projectId}/pages`);
}

function openInterfaces(projectId: number) {
  router.push(`/projects/${projectId}/interfaces`);
}

async function openEdit(project: Project) {
  try {
    const detail = await getProject(project.id);
    editing.value = detail;
    Object.assign(form, {
      code: detail.code,
      name: detail.name,
      description: detail.description,
      baseUrl: detail.baseUrl,
      status: detail.status
    });
    modalOpen.value = true;
  } catch (error) {
    message.error(getErrorMessage(error));
  }
}

async function saveProject() {
  saving.value = true;
  try {
    if (editing.value) {
      await updateProject(editing.value.id, form);
    } else {
      await createProject(form);
    }
    modalOpen.value = false;
    await loadProjects();
    message.success("保存成功");
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

async function removeProject(projectId: number) {
  try {
    await deleteProject(projectId);
    await loadProjects();
    message.success("删除成功");
  } catch (error) {
    message.error(getErrorMessage(error));
  }
}

async function toggleProjectStatus(project: Project, checked: boolean | string | number) {
  const status: Status = checked ? "enabled" : "disabled";
  statusChangingId.value = project.id;
  try {
    await patchProjectStatus(project.id, status);
    project.status = status;
    message.success("状态已更新");
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    statusChangingId.value = null;
  }
}

onMounted(loadProjects);
</script>
