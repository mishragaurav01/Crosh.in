FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock* ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/db/package.json ./packages/db/
RUN npm install -g bun@1.3.14 && bun install --frozen-lockfile

# Build
FROM deps AS builder
COPY apps/frontend ./apps/frontend
COPY packages/db ./packages/db
WORKDIR /app/apps/frontend
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN bun run build

# Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]