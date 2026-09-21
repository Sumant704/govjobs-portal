# ---------------------------------------------------------------------------
# SarkariHub frontend — production image
# ---------------------------------------------------------------------------
# Multi-stage: the build stage carries devDependencies and the full source; the
# runtime stage carries only what the server needs to run.
#
# Two things worth knowing before you change this:
#
#   1. PUBLIC_* variables are BUILD arguments, not runtime ones. Vite inlines
#      them into the client bundle, so changing AdSense or GA requires a
#      rebuild — not just a container restart.
#
#   2. Everything else (WP_API_URL, REVALIDATE_SECRET, SITE_URL) is read at
#      RUNTIME via process.env. Never pass secrets as build args: build args
#      are recorded in image history and visible to anyone who can pull it.
#      See the header of src/lib/env.ts.
# ---------------------------------------------------------------------------

# ===========================================================================
# Stage 1 — build
# ===========================================================================
FROM node:22-alpine AS build

WORKDIR /app

# Dependencies first, so a source-only change reuses this layer.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Public, browser-visible values. Safe to bake in — they ship in the HTML.
ARG SITE_URL="https://example-govjobs.com"
ARG PUBLIC_ADSENSE_CLIENT=""
ARG PUBLIC_ADSENSE_ENABLED="false"
ARG PUBLIC_GA_MEASUREMENT_ID=""

ENV SITE_URL=$SITE_URL \
    PUBLIC_ADSENSE_CLIENT=$PUBLIC_ADSENSE_CLIENT \
    PUBLIC_ADSENSE_ENABLED=$PUBLIC_ADSENSE_ENABLED \
    PUBLIC_GA_MEASUREMENT_ID=$PUBLIC_GA_MEASUREMENT_ID

# `npm run build` alone skips type checking. Run the check too — a missing
# import renders as HTTP 200 with a 21-byte "Internal server error" body, which
# no status-code test will catch.
RUN npm run check && npm run build

# ===========================================================================
# Stage 2 — runtime
# ===========================================================================
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321

# Production dependencies only. Astro's SSR build leaves its dependencies
# external, so node_modules is genuinely required at runtime — this is not a
# mistake to "optimise away".
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public

# Run unprivileged. The node image ships a `node` user for exactly this.
USER node

EXPOSE 4321

# Uses the app's own health endpoint, which also reports whether it is reading
# from WordPress or has fallen back to the bundled snapshot.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4321/api/health >/dev/null 2>&1 || exit 1

CMD ["node", "./dist/server/entry.mjs"]
