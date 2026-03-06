#!/usr/bin/env bash

# Build and push go-nomads-admin image to Huawei Cloud SWR
set -euo pipefail

SWR_REGISTRY="${SWR_REGISTRY:-swr.ap-southeast-3.myhuaweicloud.com}"
SWR_ORGANIZATION="${SWR_ORGANIZATION:-go-nomads}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
IMAGE_NAME="$SWR_REGISTRY/$SWR_ORGANIZATION/go-nomads-admin:$IMAGE_TAG"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_PLATFORM="${BUILD_PLATFORM:-linux/amd64}" # set empty to use host default
DO_LOGIN=false
BUILD_ONLY=false
PUSH_ONLY=false

print_help() {
  cat <<EOF
Usage: ./build-and-push-to-swr.sh [options]
  -h, --help           Show help
  -l, --login          Login to SWR (requires SWR_AK and SWR_SK)
  -b, --build-only     Build image only
  -p, --push-only      Push image only (requires existing tag)
  -t, --tag <tag>      Image tag (default: latest)

Env vars:
  SWR_REGISTRY         Registry (default: $SWR_REGISTRY)
  SWR_ORGANIZATION     Org (default: $SWR_ORGANIZATION)
  SWR_AK / SWR_SK      Huawei Cloud access keys for login
  SWR_REGION           Region for login username (default: ap-southeast-3)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) print_help; exit 0 ;;
    -l|--login) DO_LOGIN=true; shift ;;
    -b|--build-only) BUILD_ONLY=true; shift ;;
    -p|--push-only) PUSH_ONLY=true; shift ;;
    -t|--tag) IMAGE_TAG="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

IMAGE_NAME="$SWR_REGISTRY/$SWR_ORGANIZATION/go-nomads-admin:$IMAGE_TAG"

login_swr() {
  local region="${SWR_REGION:-ap-southeast-3}"
  if [[ -z "${SWR_AK:-}" || -z "${SWR_SK:-}" ]]; then
    echo "SWR_AK and SWR_SK are required for login" >&2
    exit 1
  fi
  local user="${region}@${SWR_AK}"
  echo "Logging in to $SWR_REGISTRY as $user"
  echo "$SWR_SK" | docker login -u "$user" --password-stdin "$SWR_REGISTRY"
}

build_image() {
  echo "Building image: $IMAGE_NAME"
  cd "$PROJECT_ROOT"
  local platform_flag=()
  if [[ -n "${BUILD_PLATFORM:-}" ]]; then
    platform_flag=(--platform "$BUILD_PLATFORM")
  fi
  docker build \
    "${platform_flag[@]}" \
    --provenance=false \
    --sbom=false \
    --pull=false \
    -t "$IMAGE_NAME" \
    -f "$PROJECT_ROOT/Dockerfile" \
    .
  echo "✅ Build complete"
}

push_image() {
  echo "Pushing image: $IMAGE_NAME"
  docker push "$IMAGE_NAME"
  echo "✅ Push complete"
}

if [[ "$DO_LOGIN" == true ]]; then
  login_swr
fi

if [[ "$PUSH_ONLY" == true ]]; then
  push_image
  exit 0
fi

build_image

if [[ "$BUILD_ONLY" == true ]]; then
  exit 0
fi

push_image
