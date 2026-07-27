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
      a2uiEnabled
      onMessageDone={console.log}
      onA2UIActionDone={console.log}
      onA2UIError={console.error}
    />
  );
}
```

助手返回值默认由底层 Web Component 安全地按 Markdown 渲染；设置
`renderMode="text"` 可切换为纯文本。
`a2uiEnabled` 默认为 `true`；React 仅透传底层 Web Component 的共享 A2UI Runtime，
不会创建第二份协议状态。可监听 `onA2UIMessage`、`onA2UIActionStart`、
`onA2UIActionDone` 和 `onA2UIError`。

完整 API 调用请直接使用依赖中提供的 `@easy-agent-gateway/agent-web` 的 `AgentClient`。
