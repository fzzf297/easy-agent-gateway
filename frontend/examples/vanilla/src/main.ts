import "@easy-agent-gateway/agent-web";
import "./style.css";

const chat = document.querySelector("easy-agent-chat");

chat?.addEventListener("message-done", (event) => {
  console.log("Agent response completed:", (event as CustomEvent).detail);
});
