FROM oven/bun:1.3.14 AS base
WORKDIR /app

# Install all dependencies (monorepo root)
COPY package.json bun.lock* ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/db/package.json ./packages/db/
RUN bun install --frozen-lockfile

# Generate Prisma client
COPY packages/db/prisma ./packages/db/prisma
COPY packages/db/prisma.config.ts ./packages/db/
COPY packages/db/index.ts ./packages/db/
COPY packages/db/client.ts ./packages/db/
RUN cd packages/db && bunx prisma generate

# Copy source
COPY apps/backend ./apps/backend

WORKDIR /app/apps/backend
EXPOSE 3002
CMD ["bun", "index.ts"]
