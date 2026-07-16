<template>
  <a-layout class="admin-shell">
    <a-layout-sider class="admin-shell__sider" theme="light" :width="248" breakpoint="lg" collapsed-width="0">
      <div class="admin-shell__brand">
        <div class="admin-shell__brand-mark">E</div>
        <div class="admin-shell__brand-copy">
          <div class="admin-shell__brand-name">Easy Agent</div>
          <div class="admin-shell__brand-subtitle">Gateway Console</div>
        </div>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        class="admin-shell__menu"
        theme="light"
        mode="inline"
        @click="handleMenuClick"
      >
        <a-menu-item key="/dashboard">
          <template #icon><DashboardOutlined /></template>
          运行概览
        </a-menu-item>
        <a-menu-item key="/projects">
          <template #icon><ProjectOutlined /></template>
          项目管理
        </a-menu-item>
        <a-menu-item key="/audit">
          <template #icon><AuditOutlined /></template>
          Agent 审计
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout class="admin-shell__main">
      <a-layout-header class="admin-shell__header">
        <div class="admin-shell__heading">
          <div class="admin-shell__eyebrow">Admin Workspace</div>
          <div class="admin-shell__title">{{ pageTitle }}</div>
          <div class="admin-shell__subtitle">配置项目、页面和 Agent 可调用接口</div>
        </div>
        <a-dropdown>
          <button class="admin-shell__account" type="button">
            <span>{{ displayName }}</span>
            <DownOutlined />
          </button>
          <template #overlay>
            <a-menu @click="handleUserMenu">
              <a-menu-item key="logout">退出登录</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </a-layout-header>
      <a-layout-content class="admin-shell__content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { AuditOutlined, DashboardOutlined, DownOutlined, ProjectOutlined } from "@ant-design/icons-vue";
import type { MenuInfo } from "ant-design-vue/es/menu/src/interface";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const selectedKeys = computed(() => {
  if (route.path.startsWith("/projects") || route.path.startsWith("/interfaces")) return ["/projects"];
  return [route.path];
});

const displayName = computed(() => auth.user?.displayName || auth.user?.username || "Admin");
const pageTitle = computed(() => {
  if (route.path.startsWith("/projects")) return "项目工作台";
  if (route.path.startsWith("/interfaces")) return "接口配置";
  if (route.path.startsWith("/audit")) return "Agent 审计";
  return "运行概览";
});

function handleMenuClick(info: MenuInfo) {
  router.push(String(info.key));
}

async function handleUserMenu(info: MenuInfo) {
  if (info.key === "logout") {
    await auth.logout();
    router.replace({ name: "login" });
  }
}
</script>

<style scoped>
.admin-shell {
  min-height: 100vh;
  background:
    linear-gradient(180deg, #f8fbff 0%, #f4f7fb 320px),
    #f4f7fb;
}

.admin-shell__sider {
  background: rgb(255 255 255 / 92%);
  border-right: 1px solid #e6edf7;
  box-shadow: 8px 0 32px rgb(23 32 51 / 7%);
  backdrop-filter: blur(18px);
}

.admin-shell__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 78px;
  padding: 18px;
}

.admin-shell__brand-mark {
  width: 38px;
  height: 38px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  color: #fff;
  font-weight: 800;
  background: linear-gradient(145deg, #2563eb 0%, #0f766e 100%);
  border-radius: 8px;
  box-shadow: 0 12px 28px rgb(37 99 235 / 22%);
}

.admin-shell__brand-copy {
  min-width: 0;
}

.admin-shell__brand-name {
  color: #172033;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.2;
}

.admin-shell__brand-subtitle {
  margin-top: 3px;
  color: #667085;
  font-size: 12px;
  font-weight: 600;
}

.admin-shell__menu {
  padding: 6px 12px 16px;
  border-inline-end: 0 !important;
  background: transparent;
}

.admin-shell__menu :deep(.ant-menu-item) {
  margin-inline: 0;
  padding-inline: 14px !important;
  color: #475467;
  font-weight: 650;
}

.admin-shell__menu :deep(.ant-menu-item-selected) {
  color: #1d4ed8;
  background: #eaf1ff;
  box-shadow: inset 3px 0 0 #2563eb;
}

.admin-shell__main {
  min-width: 0;
}

.admin-shell__header {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 28px;
  background: rgb(255 255 255 / 82%);
  border-bottom: 1px solid #e6edf7;
  backdrop-filter: blur(18px);
}

.admin-shell__heading {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-shell__eyebrow {
  flex: 0 0 auto;
  padding: 4px 8px;
  color: #2563eb;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.admin-shell__title {
  flex: 0 0 auto;
  color: #172033;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.25;
}

.admin-shell__subtitle {
  min-width: 0;
  overflow: hidden;
  padding-left: 12px;
  color: #667085;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-shell__account {
  height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 180px;
  padding: 0 8px;
  color: #172033;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.admin-shell__account:hover {
  color: #1d4ed8;
  background: #eaf1ff;
}

.admin-shell__account span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-shell__content {
  min-width: 0;
  padding: 26px 28px 32px;
}

@media (max-width: 768px) {
  .admin-shell__header {
    padding: 0 16px;
  }

  .admin-shell__heading {
    gap: 8px;
  }

  .admin-shell__account {
    flex: 0 0 auto;
    max-width: 120px;
    padding-inline: 4px;
  }

  .admin-shell__content {
    padding: 18px 14px 24px;
  }
}
</style>
