#!/usr/bin/env bash

# ============================================================
# Go-Nomads Admin - Local Docker Deploy (compose)
# Usage: bash deploy-web-local.sh [--skip-build] [--force-recreate] [--help]
# ============================================================
set -euo pipefail

SKIP_BUILD=false
FORCE_RECREATE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --force-recreate)
      FORCE_RECREATE=true
      shift
      ;;
    --help|-h)
      cat <<'EOF'
Usage: ./deploy-web-local.sh [options]

Options:
  --skip-build        Do not rebuild the image, reuse existing local image
  --force-recreate    Force container recreation even if config unchanged
  --help, -h          Show this help
EOF
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"

# select docker or podman
select_runtime() {
  local docker_bin podman_bin
  docker_bin="${DOCKER_BINARY:-$(command -v docker || true)}"
  podman_bin="${PODMAN_BINARY:-$(command -v podman || true)}"

  if [[ -n "$docker_bin" ]]; then
    echo "$docker_bin compose"
    return
  fi

  if [[ -n "$podman_bin" ]]; then
    echo "$podman_bin compose"
    return
  fi

  echo "Error: docker or podman not found" >&2
  exit 1
}

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Error: docker-compose.yml not found at $COMPOSE_FILE" >&2
  exit 1
fi

COMPOSE_CMD="$(select_runtime)"

cd "$ROOT_DIR"

echo "Using compose: $COMPOSE_CMD"
echo "Project root: $ROOT_DIR"

cmd=( $COMPOSE_CMD -f "$COMPOSE_FILE" up -d )
[[ "$SKIP_BUILD" == true ]] || cmd+=(--build)
[[ "$FORCE_RECREATE" == true ]] && cmd+=(--force-recreate)
"${cmd[@]}"

ps_cmd=( $COMPOSE_CMD -f "$COMPOSE_FILE" ps )
"${ps_cmd[@]}"

echo "✅ go-nomads-admin is running at http://localhost:3002"
