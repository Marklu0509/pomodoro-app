# ---- Stage 1: build ----
FROM node:22-alpine AS builder

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm ci

COPY . .
# API base URLs default to same-origin (/api, /stats-api) in code, so no
# build-time API env is required — Nginx/Caddy routes them on one domain.
RUN npm run build

# ---- Stage 2: runtime ----
FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the standalone server + static assets only.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
# server.js is produced by Next's standalone output; it listens on PORT (default 3000).
CMD ["node", "server.js"]
