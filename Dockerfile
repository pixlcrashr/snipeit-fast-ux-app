# syntax=docker/dockerfile:1

# --- Build stage ---
FROM node:22-alpine AS builder

WORKDIR /app

# Install all dependencies (including dev for build)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Copy source and build
COPY . .
ENV NODE_ENV=production
RUN npm run build

# --- Production stage ---
FROM node:22-alpine

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force

# Copy built output from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.mjs ./server.mjs

ENV NODE_ENV=production
ENV PORT=4321

EXPOSE 4321

CMD ["node", "server.mjs"]
