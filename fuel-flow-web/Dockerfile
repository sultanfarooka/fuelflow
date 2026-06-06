# syntax=docker/dockerfile:1

# ───────────────────────── Build stage ─────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Install deps (no lockfile in repo → npm install, not npm ci).
COPY package.json ./
RUN npm install

# Build. VITE_API_BASE_URL is inlined at BUILD time; default to the same-origin
# relative path so the browser calls nginx, which reverse-proxies /api → backend.
COPY . .
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ──────────────────────── Runtime stage ────────────────────────
FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
