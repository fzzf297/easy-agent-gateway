import "@easy-agent-gateway/agent-web";

import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch, type PropType } from "vue";
import type {
  AgentChatEventDetailMap,
  AgentHeaders,
  AgentRenderMode,
  AgentTheme
} from "@easy-agent-gateway/agent-web";

type EasyAgentElement = HTMLElement & {
  headers?: AgentHeaders;
};
type AgentChatEventName = Extract<keyof AgentChatEventDetailMap, string>;

export const AgentChat = defineComponent({
  name: "AgentChat",
  props: {
    apiBaseUrl: { type: String, required: true },
    sessionId: { type: String, default: "" },
    userLabel: { type: String, default: "" },
    title: { type: String, default: "" },
    placeholder: { type: String, default: "" },
    theme: { type: String as PropType<AgentTheme>, default: "light" },
    renderMode: { type: String as PropType<AgentRenderMode>, default: "markdown" },
    a2uiEnabled: { type: Boolean, default: true },
    headers: { type: Object as PropType<AgentHeaders>, default: () => ({}) }
  },
  emits: [
    "session-created",
    "message-start",
    "message-delta",
    "message-done",
    "a2ui-message",
    "a2ui-action-start",
    "a2ui-action-done",
    "a2ui-error",
    "agent-error"
  ],
  setup(props, { emit }) {
    const elementRef = ref<EasyAgentElement | null>(null);
    const listeners: Array<[AgentChatEventName, EventListener]> = [
      ["session-created", (event) => emit("session-created", (event as CustomEvent).detail)],
      ["message-start", (event) => emit("message-start", (event as CustomEvent).detail)],
      ["message-delta", (event) => emit("message-delta", (event as CustomEvent).detail)],
      ["message-done", (event) => emit("message-done", (event as CustomEvent).detail)],
      ["a2ui-message", (event) => emit("a2ui-message", (event as CustomEvent).detail)],
      ["a2ui-action-start", (event) => emit("a2ui-action-start", (event as CustomEvent).detail)],
      ["a2ui-action-done", (event) => emit("a2ui-action-done", (event as CustomEvent).detail)],
      ["a2ui-error", (event) => emit("a2ui-error", (event as CustomEvent).detail)],
      ["agent-error", (event) => emit("agent-error", (event as CustomEvent).detail)]
    ];

    const syncHeaders = () => {
      if (elementRef.value) {
        elementRef.value.headers = props.headers || {};
      }
    };

    onMounted(() => {
      syncHeaders();
      for (const [name, listener] of listeners) {
        elementRef.value?.addEventListener(name, listener);
      }
    });

    onBeforeUnmount(() => {
      for (const [name, listener] of listeners) {
        elementRef.value?.removeEventListener(name, listener);
      }
    });

    watch(() => props.headers, syncHeaders, { deep: true });

    return () =>
      h("easy-agent-chat", {
        ref: elementRef,
        "api-base-url": props.apiBaseUrl,
        "session-id": props.sessionId,
        "user-label": props.userLabel,
        title: props.title,
        placeholder: props.placeholder,
        theme: props.theme,
        "render-mode": props.renderMode,
        "a2ui-mode": props.a2uiEnabled ? "auto" : "off"
      });
  }
});

export default AgentChat;
