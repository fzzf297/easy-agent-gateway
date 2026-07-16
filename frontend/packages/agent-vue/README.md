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
    @message-done="handleDone"
  />
</template>
```

完整 API 调用请直接使用依赖中提供的 `@easy-agent-gateway/agent-web` 的 `AgentClient`。
