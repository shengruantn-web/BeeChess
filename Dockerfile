# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
# Match the lockfile's package-manager version across local and VPS builds.
RUN npm install --global npm@11.6.0 && npm ci --ignore-scripts
COPY . .
ENV DEPLOY_TARGET=coolify VITE_AUTH_ENABLED=false
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 VITE_AUTH_ENABLED=false
COPY --from=build --chown=node:node /app/.output/ ./.output/
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", ".output/server/index.mjs"]
