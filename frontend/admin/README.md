# Admin Frontend

Vue 3 + TypeScript + Vite management console for the Easy Agent Gateway admin API.

## Scripts

```bash
pnpm --filter @easy-agent-gateway/admin dev
pnpm --filter @easy-agent-gateway/admin lint
pnpm --filter @easy-agent-gateway/admin typecheck
pnpm --filter @easy-agent-gateway/admin build
```

The dev server proxies admin and agent API requests to `http://118.196.83.236` by default.
Override the backend with `VITE_ADMIN_PROXY_TARGET` and `VITE_AGENT_PROXY_TARGET`.
