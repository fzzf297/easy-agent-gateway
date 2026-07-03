#!/usr/bin/env sh
set -eu

# Load Docker images on the target (internal network) machine.
# Run after copying deploy/*.tar from the build machine.
# Does not download anything from the internet.

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/deploy"

for tar_file in \
    "$DEPLOY_DIR/easy-agent-gateway-admin.tar" \
    "$DEPLOY_DIR/easy-agent-gateway-agent.tar" \
    "$DEPLOY_DIR/easy-agent-gateway-nginx.tar"
do
    if [ ! -f "$tar_file" ]; then
        echo "Error: missing $tar_file" >&2
        exit 1
    fi
done

echo "Loading images (offline)..."
docker load -i "$DEPLOY_DIR/easy-agent-gateway-admin.tar"
docker load -i "$DEPLOY_DIR/easy-agent-gateway-agent.tar"
docker load -i "$DEPLOY_DIR/easy-agent-gateway-nginx.tar"

echo "Loaded images:"
docker images | grep easy-agent-gateway || true
