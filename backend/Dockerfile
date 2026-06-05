# ---- Stage 1: build ----
FROM node:22-alpine AS builder

WORKDIR /app

# bcrypt is a native addon (needs a toolchain); openssl is required by Prisma engines.
RUN apk add --no-cache python3 make g++ openssl

# Install deps first for better layer caching.
COPY package*.json ./
RUN npm ci

# Generate the Prisma client, then compile TypeScript -> dist/.
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

# ---- Stage 2: runtime ----
FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

# Prisma's query engine needs the OpenSSL shared library at runtime.
RUN apk add --no-cache openssl

# Copy only what we need to run. node_modules is copied from the builder so the
# compiled bcrypt addon + generated Prisma client + Prisma CLI come along
# (the CLI is needed for `migrate deploy` at startup).
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Apply pending migrations, then start the API.
# Entry is dist/src/main.js because Prisma's source root makes Nest preserve the
# src/ folder under dist/.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/src/main"]
