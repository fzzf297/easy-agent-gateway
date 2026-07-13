<template>
  <a-config-provider :locale="zhCN" :theme="theme">
    <router-view />
  </a-config-provider>
  <AgentChat api-base-url="" title="业务助手" />
</template>

<script setup lang="ts">
import { AgentChat } from "@easy-agent-gateway/agent-vue";
import zhCN from "ant-design-vue/es/locale/zh_CN";

const theme = {
  token: {
    borderRadius: 8,
    colorBgContainer: "#ffffff",
    colorBgLayout: "#f4f7fb",
    colorBorder: "#dfe6f1",
    colorInfo: "#2563eb",
    colorPrimary: "#2563eb",
    colorSuccess: "#16a34a",
    colorText: "#172033",
    colorTextSecondary: "#667085",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    wireframe: false
  },
  components: {
    Button: {
      controlHeight: 36,
      fontWeight: 600
    },
    Card: {
      headerBg: "transparent"
    },
    Menu: {
      itemBorderRadius: 8,
      itemHeight: 42,
      itemMarginBlock: 4,
      itemSelectedBg: "#eaf1ff",
      itemSelectedColor: "#1d4ed8"
    },
    Table: {
      headerBg: "#f8fafc",
      headerColor: "#475467",
      rowHoverBg: "#f7fbff"
    }
  }
};
</script>
