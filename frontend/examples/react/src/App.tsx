import { AgentChat } from "@easy-agent-gateway/agent-react";

export function App() {
  return (
    <main>
      <h1>React Agent Demo</h1>
      <AgentChat
        apiBaseUrl="http://localhost:8001"
        userLabel="react-demo"
        title="业务助手"
        onMessageDone={(detail) => console.log("done", detail)}
      />
    </main>
  );
}
