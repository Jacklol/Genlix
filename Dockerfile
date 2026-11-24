FROM node:22-bookworm-slim AS build

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .

# The URL and image hosts are needed at build time. The Supabase key is runtime-only.
ARG SUPABASE_URL
ARG CMS_ALLOWED_MEDIA_HOSTS
ARG SITE_URL=https://vmi3708522.contaboserver.net:8446
ARG BUILD_HEAP_MB=1024
ENV GENLIX_STANDALONE=1 NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--max-old-space-size=${BUILD_HEAP_MB}
RUN nice -n 10 pnpm build
ARG GENLIX_REVISION
RUN if [ -n "$GENLIX_REVISION" ]; then \
      echo "$GENLIX_REVISION" | grep -Eq '^[0-9a-f]{40}$' && \
      printf '{"sha":"%s"}\n' "$GENLIX_REVISION" > public/_genlix_release.json; \
    fi

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

USER node
EXPOSE 3000
CMD ["node", "server.js"]
