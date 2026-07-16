<template>
  <div>
    <div class="page-header">
      <div>
        <h1>接口配置</h1>
        <div class="muted">{{ projectLabel }} 下的接口元数据和 Agent YAML 配置。</div>
      </div>
      <div class="toolbar">
        <router-link to="/projects">返回项目</router-link>
        <a-button type="primary" @click="openCreate">新建接口</a-button>
      </div>
    </div>

    <div class="content-card">
      <div class="toolbar">
        <a-input-search
          v-model:value="query.keyword"
          allow-clear
          placeholder="搜索 code / 名称"
          style="width: 260px"
          @search="loadInterfaces"
        />
        <a-button @click="loadInterfaces">刷新</a-button>
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
          <template v-if="column.key === 'method'">
            <a-tag color="blue">{{ record.method }}</a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-switch
              :checked="record.status === 'enabled'"
              :checked-children="statusSwitchText.checked"
              :un-checked-children="statusSwitchText.unchecked"
              :loading="statusChangingId === record.id"
              @change="toggleInterfaceStatus(record, $event)"
            />
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <router-link :to="`/interfaces/${record.id}/config`">YAML</router-link>
              <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
              <a-popconfirm title="确认删除该接口？" @confirm="removeInterface(record.id)">
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <a-modal
      v-model:open="modalOpen"
      :title="editing ? '编辑接口' : '新建接口'"
      :confirm-loading="saving"
      @ok="saveInterface"
    >
      <a-form layout="vertical" :model="form">
        <a-form-item label="接口 code" required>
          <a-input v-model:value="form.code" />
        </a-form-item>
        <a-form-item label="接口名称" required>
          <a-input v-model:value="form.name" />
        </a-form-item>
        <a-form-item label="方法">
          <a-select v-model:value="form.method">
            <a-select-option value="GET">GET</a-select-option>
            <a-select-option value="POST">POST</a-select-option>
            <a-select-option value="PUT">PUT</a-select-option>
            <a-select-option value="PATCH">PATCH</a-select-option>
            <a-select-option value="DELETE">DELETE</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="路径" required>
          <a-input v-model:value="form.path" placeholder="/system/user/list" />
        </a-form-item>
        <a-form-item label="认证模式">
          <a-select v-model:value="form.authMode">
            <a-select-option value="none">none</a-select-option>
            <a-select-option value="bearer">bearer</a-select-option>
            <a-select-option value="api_key">api_key</a-select-option>
            <a-select-option value="signature">signature</a-select-option>
          </a-select>
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

import {
  createInterface,
  deleteInterface,
  getInterface,
  listInterfaces,
  updateInterface,
  updateInterfaceStatus
} from "@/api/interfaces";
import { getProject } from "@/api/projects";
import { getErrorMessage } from "@/api/request";
import type { AppInterface, InterfacePayload, Project, Status } from "@/types/admin";

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
const editing = ref<AppInterface | null>(null);
const items = ref<AppInterface[]>([]);
const total = ref(0);
const project = ref<Project | null>(null);
const statusChangingId = ref<number | null>(null);

const query = reactive({
  page: 1,
  pageSize: 20,
  keyword: ""
});

const form = reactive<InterfacePayload>({
  code: "",
  name: "",
  method: "GET",
  path: "",
  authMode: "none",
  status: "enabled",
  description: ""
});

const columns = [
  { title: "ID", dataIndex: "id", width: 80 },
  { title: "Code", dataIndex: "code" },
  { title: "名称", dataIndex: "name" },
  { title: "方法", dataIndex: "method", key: "method", width: 100 },
  { title: "路径", dataIndex: "path", ellipsis: true },
  { title: "认证", dataIndex: "authMode", width: 110 },
  { title: "状态", dataIndex: "status", key: "status", width: 110 },
  { title: "操作", key: "actions", width: 220 }
];

const pagination = computed<TablePaginationConfig>(() => ({
  current: query.page,
  pageSize: query.pageSize,
  total: total.value,
  showSizeChanger: true
}));

const projectLabel = computed(() => {
  if (!project.value) return `项目 #${props.projectId}`;
  return `${project.value.name} (${project.value.code})`;
});

function resetForm() {
  Object.assign(form, {
    code: "",
    name: "",
    method: "GET",
    path: "",
    authMode: "none",
    status: "enabled",
    description: ""
  });
}

async function loadProject() {
  try {
    project.value = await getProject(numericProjectId.value);
  } catch (error) {
    message.error(getErrorMessage(error));
  }
}

async function loadInterfaces() {
  loading.value = true;
  try {
    const response = await listInterfaces(numericProjectId.value, query);
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
  loadInterfaces();
}

function openCreate() {
  editing.value = null;
  resetForm();
  modalOpen.value = true;
}

async function openEdit(item: AppInterface) {
  try {
    const detail = await getInterface(item.id);
    editing.value = detail;
    Object.assign(form, {
      code: detail.code,
      name: detail.name,
      method: detail.method,
      path: detail.path,
      authMode: detail.authMode,
      status: detail.status,
      description: detail.description
    });
    modalOpen.value = true;
  } catch (error) {
    message.error(getErrorMessage(error));
  }
}

async function saveInterface() {
  saving.value = true;
  try {
    if (editing.value) {
      await updateInterface(editing.value.id, form);
    } else {
      await createInterface(numericProjectId.value, form);
    }
    modalOpen.value = false;
    await loadInterfaces();
    message.success("保存成功");
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

async function removeInterface(interfaceId: number) {
  try {
    await deleteInterface(interfaceId);
    await loadInterfaces();
    message.success("删除成功");
  } catch (error) {
    message.error(getErrorMessage(error));
  }
}

async function toggleInterfaceStatus(item: AppInterface, checked: boolean | string | number) {
  const status: Status = checked ? "enabled" : "disabled";
  statusChangingId.value = item.id;
  try {
    await updateInterfaceStatus(item.id, status);
    item.status = status;
    message.success("状态已更新");
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    statusChangingId.value = null;
  }
}

onMounted(() => {
  loadProject();
  loadInterfaces();
});
</script>
