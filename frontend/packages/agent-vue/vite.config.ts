import { resolve } from "node:path";

import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "EasyAgentGatewayVue",
      formats: ["es", "umd"],
      fileName: (format) => (format === "es" ? "index.js" : "index.umd.cjs")
    },
    rollupOptions: {
      external: ["vue", "@easy-agent-gateway/agent-web"],
      output: {
        exports: "named",
        globals: {
          vue: "Vue",
          "@easy-agent-gateway/agent-web": "EasyAgentGateway"
        }
      }
    }
  }
});
