ARG NODE_IMAGE=node:22-alpine
ARG NGINX_BASE_IMAGE=nginx:1.27-alpine

FROM ${NODE_IMAGE} AS frontend-build
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/admin/package.json frontend/admin/package.json
COPY frontend/packages/agent-web/package.json frontend/packages/agent-web/package.json
COPY frontend/packages/agent-react/package.json frontend/packages/agent-react/package.json
COPY frontend/packages/agent-vue/package.json frontend/packages/agent-vue/package.json
COPY frontend/examples/vanilla/package.json frontend/examples/vanilla/package.json
COPY frontend/examples/react/package.json frontend/examples/react/package.json
COPY frontend/examples/vue/package.json frontend/examples/vue/package.json

RUN pnpm install --frozen-lockfile

COPY frontend frontend

RUN pnpm --filter @easy-agent-gateway/admin build

FROM ${NGINX_BASE_IMAGE}
COPY --from=frontend-build /app/frontend/admin/dist /usr/share/nginx/html/admin
