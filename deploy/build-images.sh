#!/usr/bin/env sh
set -eu

# Build and package Docker images for offline / internal network deployment.
# Run on a machine with internet access and Docker installed.
#
# Output:
#   deploy/easy-agent-gateway-admin.tar
#   deploy/easy-agent-gateway-agent.tar
#   deploy/easy-agent-gateway-nginx.tar

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/deploy"
NGINX_IMAGE="${NGINX_BASE_IMAGE:-nginx:1.27-alpine}"

cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
    echo "Error: docker not found. Install Docker on this build machine first." >&2
    exit 1
fi

# Target servers are typically linux/amd64; override with BUILD_PLATFORM if needed.
BUILD_PLATFORM="${BUILD_PLATFORM:-linux/amd64}"
export DOCKER_DEFAULT_PLATFORM="$BUILD_PLATFORM"

echo "Building application images for ${BUILD_PLATFORM}..."
docker compose -f docker-compose.yml build

echo "Pulling nginx base image (tagged for offline load)..."
docker pull --platform "$BUILD_PLATFORM" "$NGINX_IMAGE"
docker tag "$NGINX_IMAGE" easy-agent-gateway/nginx:latest

echo "Saving images..."
docker save easy-agent-gateway/admin:latest > "$DEPLOY_DIR/easy-agent-gateway-admin.tar"
docker save easy-agent-gateway/agent:latest > "$DEPLOY_DIR/easy-agent-gateway-agent.tar"
docker save easy-agent-gateway/nginx:latest > "$DEPLOY_DIR/easy-agent-gateway-nginx.tar"

for image in easy-agent-gateway/admin:latest easy-agent-gateway/agent:latest easy-agent-gateway/nginx:latest; do
    arch="$(docker image inspect "$image" --format '{{.Architecture}}')"
    if [ "$arch" != "amd64" ]; then
        echo "Error: $image is $arch, expected amd64." >&2
        echo "Build on an x86_64 machine, or: colima start --arch x86_64 (needs qemu)." >&2
        exit 1
    fi
done

echo "Done. Output files:"
ls -lh "$DEPLOY_DIR"/*.tar
