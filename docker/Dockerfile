FROM node:20-alpine AS base

# Install dependencies for native modules (better-sqlite3, duckdb)
RUN apk add --no-cache python3 make g++ libc6-compat

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/templates ./templates

# Data directory for SQLite + DuckDB (mount as volume)
RUN mkdir -p /app/data /app/uploads && chown nextjs:nodejs /app/data /app/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV DATA_DIR=/app/data

CMD ["node", "server.js"]
