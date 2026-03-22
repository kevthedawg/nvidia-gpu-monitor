# Build context must be the repo root (not app/).
# Build with: docker build -f app/Dockerfile .

# ── Stage 1: Build frontend ──────────────────────────────────
FROM node:alpine AS frontend-build

WORKDIR /build
COPY tsconfig.json ./
COPY app/frontend/ ./app/frontend/
COPY app/backend/src/ ./app/backend/src/

WORKDIR /build/app/frontend
RUN npm ci
RUN npx vite build

# ── Stage 2: Build backend ───────────────────────────────────
FROM node:alpine AS backend-build

WORKDIR /build
COPY tsconfig.json ./
COPY app/backend/ ./app/backend/

WORKDIR /build/app/backend
RUN npm ci
RUN npm run build

# ── Stage 3: Production image ────────────────────────────────
FROM node:alpine

WORKDIR /app/backend

COPY app/backend/package.json app/backend/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=backend-build /build/app/backend/dist ./dist
COPY --from=backend-build /build/app/backend/drizzle ./drizzle
COPY --from=frontend-build /build/app/frontend/dist ../frontend/dist

ENV NODE_ENV=production
ENV DB_PATH=/data/gpu-metrics.db
EXPOSE 3090

CMD ["node", "dist/index.js"]
