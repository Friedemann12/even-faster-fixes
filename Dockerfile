# syntax=docker/dockerfile:1

FROM oven/bun:1.4-alpine AS base
WORKDIR /app

# --- dependencies -----------------------------------------------------------
# Manifests only, so a source change does not invalidate the install layer.
FROM base AS deps
COPY package.json bun.lock bunfig.toml ./
COPY apps/web/package.json apps/web/
COPY packages/database/package.json packages/database/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/mcp/package.json packages/mcp/
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/ui/package.json packages/ui/
COPY packages/widget/package.json packages/widget/
COPY packages/widget-core/package.json packages/widget-core/
COPY packages/widget-react/package.json packages/widget-react/
RUN --mount=type=cache,target=/root/.bun/install/cache bun install --frozen-lockfile

# --- build ------------------------------------------------------------------
FROM base AS builder
# Real Node for `next build`: without it Bun stands in for the `node` shebang
# and Bun 1.3.14 segfaults on exit after a successful build (exit code 132).
RUN apk add --no-cache nodejs
# The whole tree, not just /app/node_modules: bunfig.toml pins the isolated linker,
# which puts each workspace package's binaries in its own node_modules/.bin.
COPY --from=deps /app ./
COPY . .

# Built explicitly instead of via `turbo run build`: apps/web/turbo.json overrides
# the root build task and loses its `^build` dependency, so nothing would order these.
RUN bun run --filter @fasterfixes/core build \
 && bun run --filter @fasterfixes/widget build \
 && bun run --filter @fasterfixes/react build \
 && bun run --filter @workspace/db db:gen

# No deployment-specific build args: every URL, key and secret is read at runtime,
# so this image carries nothing about the instance it will run on.
ARG DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run --filter web build

# --- migrations (one-shot, runs before web starts) --------------------------
# Own stage rather than the builder: this image only needs the Prisma CLI plus
# the schema, ~250 MB instead of the multi-GB build tree the server would pull.
FROM base AS migrator
WORKDIR /app
COPY packages/database/schema ./schema
COPY packages/database/migrations ./migrations
COPY packages/database/prisma.config.ts ./
RUN bun add prisma@7 dotenv
CMD ["bunx", "prisma", "migrate", "deploy"]

# --- runtime ----------------------------------------------------------------
# Node, not Bun: Next.js standalone output is built and tested against the Node
# runtime. Bun stays on the install/build side.
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 \
    STORAGE_PROVIDER=local STORAGE_LOCAL_PATH=/app/storage
# Created here so a fresh named volume mounted on it inherits the node owner;
# otherwise the non-root server could not write uploads.
RUN mkdir -p /app/storage && chown node:node /app/storage
USER node

COPY --from=builder --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=node:node /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
