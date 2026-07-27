# @easy-agent-gateway/agent-vue

Easy Agent Gateway Web Component 的 Vue 3 薄适配器。

```bash
pnpm add @easy-agent-gateway/agent-vue
```

```vue
<script setup lang="ts">
import { AgentChat } from "@easy-agent-gateway/agent-vue";

function handleDone(detail: unknown) {
  console.log(detail);
}
</script>

<template>
  <AgentChat
    api-base-url="https://agent.example.com"
    user-label="demo"
    render-mode="markdown"
    :a2ui-enabled="true"
    @message-done="handleDone"
    @a2ui-action-done="handleDone"
  />
</template>
```

助手返回值默认由底层 Web Component 安全地按 Markdown 渲染；设置
`render-mode="text"` 可切换为纯文本。
`a2ui-enabled` 默认为 `true`；Vue 仅透传底层 Web Component 的共享 A2UI Runtime。
组件同时暴露 `a2ui-message`、`a2ui-action-start`、`a2ui-action-done` 和
`a2ui-error` 事件。

完整 API 调用请直接使用依赖中提供的 `@easy-agent-gateway/agent-web` 的 `AgentClient`。
