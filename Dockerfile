# Imagem SÓ para testes (DAST no cluster kind do CI).
# Produção roda no Cloudflare Workers; aqui o Worker roda no workerd local
# (o mesmo runtime da Cloudflare) via `vite preview`, com D1 local em SQLite.

FROM node:25-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:25-bookworm-slim
ENV HOME=/tmp \
    CI=true \
    WRANGLER_SEND_METRICS=false \
    CLOUDFLARE_CF_FETCH_ENABLED=false
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/.wrangler/deploy ./.wrangler/deploy
COPY package.json wrangler.jsonc vite.config.ts ./
COPY worker ./worker
COPY migrations ./migrations
# Único diretório gravável da app: o estado do D1 local (montado como emptyDir no k8s)
RUN mkdir -p .wrangler/state && chown node:node .wrangler/state
USER node
EXPOSE 8787
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s \
  CMD ["node", "-e", "fetch('http://127.0.0.1:8787/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["sh", "-c", "./node_modules/.bin/wrangler d1 migrations apply DB --local && exec ./node_modules/.bin/vite preview --host 0.0.0.0 --port 8787 --strictPort --configLoader runner"]
