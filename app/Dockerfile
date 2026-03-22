# ── Stage 1: Build frontend ──────────────────────────────────
FROM node:22-alpine AS frontend-build

WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./

# Vite resolves @backend/* via resolve.alias, not TypeScript.
# Only run vite build (skip tsc — not needed for production bundle).
RUN npx vite build

# ── Stage 2: Build backend ───────────────────────────────────
FROM node:22-alpine AS backend-build

WORKDIR /build/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/ ./

# Backend tsconfig extends ../../tsconfig.json which is outside the
# build context. Write the base config inline — it's just compiler defaults.
RUN echo '{"compilerOptions":{"strict":true,"esModuleInterop":true,"skipLibCheck":true,"forceConsistentCasingInFileNames":true,"resolveJsonModule":true,"isolatedModules":true,"moduleDetection":"force"}}' > /build/tsconfig.json

RUN npm run build

# ── Stage 3: Production image ────────────────────────────────
FROM node:22-alpine

WORKDIR /app/backend

# Install production deps only (better-sqlite3 native addon builds here)
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# Compiled backend JS
COPY --from=backend-build /build/backend/dist ./dist

# Drizzle migrations (referenced by dist/db/index.js via ../../drizzle)
COPY --from=backend-build /build/backend/drizzle ./drizzle

# Frontend static files (served from ../frontend/dist relative to CWD)
COPY --from=frontend-build /build/frontend/dist ../frontend/dist

ENV NODE_ENV=production
ENV DB_PATH=/data/gpu-metrics.db
EXPOSE 3090

CMD ["node", "dist/index.js"]
