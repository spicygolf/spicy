# Spicy Golf API - Dockerfile for Fly.io
#
# Simple approach: run Bun directly (no compilation)
# Image size: ~150MB | Startup: ~175ms (Bun + Firecracker)

FROM oven/bun:1.3-alpine

WORKDIR /app

# Copy workspace config for dependency resolution
COPY package.json bun.lock ./
COPY patches ./patches
COPY packages/api/package.json ./packages/api/
COPY packages/lib/package.json ./packages/lib/
COPY packages/app/package.json ./packages/app/
COPY packages/web/package.json ./packages/web/

# Install production dependencies only
# --omit=optional skips better-sqlite3 (optional peer of jazz-tools via better-auth)
# --ignore-scripts skips husky prepare hook (devDependency not available)
RUN bun install --frozen-lockfile --production --omit=optional --ignore-scripts

# Copy source code
COPY packages/api ./packages/api
COPY packages/lib ./packages/lib

# Copy runtime data
COPY packages/api/data ./packages/api/data
COPY data/seed ./data/seed

WORKDIR /app/packages/api

# Fly.io sets PORT env var
ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
