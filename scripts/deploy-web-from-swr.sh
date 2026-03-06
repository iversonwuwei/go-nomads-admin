#!/usr/bin/env bash

# Pull image from Huawei Cloud SWR and deploy with docker compose
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose-swr.yml"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Compose file not found: $COMPOSE_FILE" >&2
  exit 1
fi

echo "Using compose file: $COMPOSE_FILE"
echo "Registry: ${SWR_REGISTRY:-swr.ap-southeast-3.myhuaweicloud.com}"
echo "Org: ${SWR_ORGANIZATION:-go-nomads}"
echo "Tag: ${IMAGE_TAG:-latest}"

docker compose -f "$COMPOSE_FILE" pull web
docker compose -f "$COMPOSE_FILE" up -d web

echo "✅ Deployed from SWR"
