#!/usr/bin/env sh
set -eu

# Re-export images into a full offline bundle (includes Docker engine for first-time air-gap install).
# Requires deploy/docker-static.tgz — run fetch-docker-static.sh on build machine if missing.
#
# For a complete first-time air-gap bundle, prefer: sh deploy/prepare-offline-bundle.sh

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/deploy"

cd "$ROOT_DIR"

if [ ! -f "$DEPLOY_DIR/docker-static.tgz" ] || [ ! -f "$DEPLOY_DIR/docker-compose-linux-x86_64" ]; then
    echo "Fetching Docker static binaries for air-gap first deploy..."
    sh "$DEPLOY_DIR/fetch-docker-static.sh"
fi

for image in easy-agent-gateway/admin:latest easy-agent-gateway/agent:latest easy-agent-gateway/nginx:latest; do
    if ! docker image inspect "$image" >/dev/null 2>&1; then
        echo "Error: missing image $image." >&2
        exit 1
    fi
    arch="$(docker image inspect "$image" --format '{{.Architecture}}')"
    if [ "$arch" != "amd64" ]; then
        echo "Error: $image is $arch, expected amd64." >&2
        exit 1
    fi
done

echo "Saving images..."
docker save easy-agent-gateway/admin:latest > "$DEPLOY_DIR/easy-agent-gateway-admin.tar"
docker save easy-agent-gateway/agent:latest > "$DEPLOY_DIR/easy-agent-gateway-agent.tar"
docker save easy-agent-gateway/nginx:latest > "$DEPLOY_DIR/easy-agent-gateway-nginx.tar"

SKIP_BUILD=1 sh "$DEPLOY_DIR/prepare-offline-bundle.sh"
