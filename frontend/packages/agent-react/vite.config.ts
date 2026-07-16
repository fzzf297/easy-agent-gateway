import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.tsx"),
      name: "EasyAgentGatewayReact",
      formats: ["es", "umd"],
      fileName: (format) => (format === "es" ? "index.js" : "index.umd.cjs")
    },
    rollupOptions: {
      external: ["react", "react-dom", "@easy-agent-gateway/agent-web"],
      output: {
        exports: "named",
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "@easy-agent-gateway/agent-web": "EasyAgentGateway"
        }
      }
    }
  }
});
