# Frontend Nguyen Binh Official — 1 Dockerfile, 2 target:
#   web   : website SSR (React Router) — node, cong 3000
#   admin : Admin CMS (file tinh) — nginx, phuc vu duoi /admin/

FROM node:22-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/admin/package.json apps/admin/
COPY packages/shared/package.json packages/shared/
RUN npm ci --no-audit --no-fund

FROM deps AS build
COPY . .
RUN npm run build -w @nb/admin && npm run build -w @nb/web

# ---------- website SSR ----------
FROM node:22-alpine AS web
WORKDIR /repo
ENV NODE_ENV=production PORT=3000
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/admin/package.json apps/admin/
COPY packages/shared/package.json packages/shared/
# Chi cai dependency chay cua web (@nb/shared da duoc bundle vao server build).
RUN npm ci --omit=dev --workspace @nb/web --no-audit --no-fund && npm cache clean --force
COPY --from=build /repo/apps/web/build apps/web/build
USER node
WORKDIR /repo/apps/web
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1
CMD ["node", "/repo/node_modules/@react-router/serve/bin.js", "./build/server/index.js"]

# ---------- admin (SPA tinh) ----------
FROM nginx:1.27-alpine AS admin
COPY deploy/admin-nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/admin/dist /usr/share/nginx/html/admin
EXPOSE 80
