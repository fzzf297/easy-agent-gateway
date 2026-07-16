# @easy-agent-gateway/agent-react

Easy Agent Gateway Web Component 的 React 薄适配器。

```bash
pnpm add @easy-agent-gateway/agent-react
```

```tsx
import { AgentChat } from "@easy-agent-gateway/agent-react";

export function App() {
  return (
    <AgentChat
      apiBaseUrl="https://agent.example.com"
      userLabel="demo"
      renderMode="markdown"
      onMessageDone={console.log}
    />
  );
}
```

助手返回值默认由底层 Web Component 安全地按 Markdown 渲染；设置
`renderMode="text"` 可切换为纯文本。

完整 API 调用请直接使用依赖中提供的 `@easy-agent-gateway/agent-web` 的 `AgentClient`。
