<template>
  <main>
    <h1>Vue Agent Demo</h1>
    <AgentChat
      api-base-url="http://localhost:8001"
      user-label="vue-demo"
      title="业务助手"
      @message-done="handleDone"
    />
  </main>
</template>

<script setup lang="ts">
import { AgentChat } from "@easy-agent-gateway/agent-vue";

function handleDone(detail: unknown) {
  console.log("done", detail);
}
</script>
