# Base image (Debian slim for full compatibility with Prisma and native bcrypt)
FROM node:22-slim AS base

WORKDIR /app

# OpenSSL is required by Prisma Client at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Generate Prisma Client and compile TypeScript to JavaScript
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres" npx prisma generate
RUN npm run build

# Production runtime
FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/package-lock.json ./package-lock.json
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/app.js"]
