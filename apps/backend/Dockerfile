FROM oven/bun:1.3.14 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock* ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/db/package.json ./packages/db/
RUN bun install --frozen-lockfile

# Generate Prisma client
FROM deps AS prisma
COPY packages/db/prisma ./packages/db/prisma
COPY packages/db/prisma.config.ts ./packages/db/
RUN cd packages/db && bunx prisma generate

# Build and run
FROM prisma AS runner
COPY apps/backend ./apps/backend
COPY packages/db ./packages/db
WORKDIR /app/apps/backend
EXPOSE 3002
CMD ["bun", "index.ts"]