# syntax=docker/dockerfile:1

# The demo site, lightbox.gullberg.no. Node builds it, nginx serves it; the
# same setup as gullberg.no. Built from the repository root, because the demo
# uses the package's source in ../src:
#
#   docker compose -f demo/docker-compose.yml up -d --build

FROM node:22-alpine AS build
WORKDIR /app

# Manifests first, so `npm ci` only runs again when dependencies change.
COPY package.json package-lock.json ./
RUN npm ci
COPY demo/package.json demo/package-lock.json demo/
RUN cd demo && npm ci

COPY . .
RUN cd demo && npm run build


FROM nginx:1.27-alpine AS runtime

# The nginx entrypoint runs envsubst over templates/, which is how ${PORT}
# reaches `listen`. The headers snippet isn't under conf.d, which is a tmpfs.
COPY demo/docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY demo/docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/demo/dist /usr/share/nginx/html

ENV PORT=3545
EXPOSE 3545

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --spider -q "http://127.0.0.1:${PORT}/" || exit 1
