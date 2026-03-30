# Stage 1: Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY patches/ ./patches/
RUN npm ci

# Stage 2: Build TypeScript
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY patches/ ./patches/
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY config/config.json ./config/
COPY config/default.textrules.json ./config/
COPY config/lang.json ./config/

USER node
CMD ["node", "dist/src/index.js"]
