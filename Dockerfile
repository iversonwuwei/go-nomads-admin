ARG NODE_IMAGE=node:20.18.0-alpine
ARG NPM_REGISTRY_SERVER=https://registry.yarnpkg.com

FROM ${NODE_IMAGE} AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
# Use apk on alpine, apt-get on debian/ubuntu
RUN if command -v apk >/dev/null 2>&1; then \
		apk add --no-cache libc6-compat; \
	else \
		apt-get update && apt-get install -y --no-install-recommends libc6 && rm -rf /var/lib/apt/lists/*; \
	fi
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
# Activate the project-pinned Yarn (Corepack) to match packageManager
RUN corepack enable && corepack prepare yarn@4.5.1 --activate
# 设置 yarn 网络超时和重试，使用官方源（Docker 容器内更稳定）
RUN yarn config set npmRegistryServer ${NPM_REGISTRY_SERVER} && \
	yarn install --immutable --network-timeout 600000

FROM base AS builder
ENV NODE_ENV=production
COPY --from=deps /app/.yarn ./.yarn
COPY --from=deps /app/.yarnrc.yml ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
RUN if command -v addgroup >/dev/null 2>&1; then \
			addgroup -g 1001 nodejs && adduser -D -u 1001 -G nodejs nodejs; \
		else \
			groupadd --gid 1001 nodejs && useradd --uid 1001 --gid nodejs --shell /bin/bash nodejs; \
		fi
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER nodejs
EXPOSE 3002
CMD ["node", "server.js"]
