import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_ADMIN_PROXY_TARGET || "http://118.196.83.236";
  const agentProxyTarget = env.VITE_AGENT_PROXY_TARGET || "http://118.196.83.236";

  return {
    base: "/admin/",
    plugins: [vue()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url))
      }
    },
    server: {
      port: Number(env.VITE_ADMIN_PORT || 5173),
      proxy: {
        "/api/agent": {
          target: agentProxyTarget,
          changeOrigin: true
        },
        "/api": {
          target: proxyTarget,
          changeOrigin: true
        },
        "/agent": {
          target: agentProxyTarget,
          changeOrigin: true
        },
        "/health": {
          target: proxyTarget,
          changeOrigin: true
        }
      }
    }
  };
});
