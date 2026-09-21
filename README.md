# SarkariHub — Government Jobs & Results Portal

A fast, SEO-first portal for government job notifications, exam results, admit
cards, answer keys, syllabi and admission notices.

**Architecture:** headless WordPress as the CMS, Astro as the frontend.
Editors work in a normal `wp-admin`; readers get server-rendered HTML from a
cached edge, not from WordPress.

```
┌──────────────┐   REST /wp-json/wp/v2    ┌────────────────────┐
│  WordPress   │ ◄─────────────────────── │   Astro (SSR)      │
│  wp-admin    │ ───────────────────────► │   src/lib/wp.ts    │
│  ACF + CPTs  │   webhook on publish     │   TTL cache 90s    │
└──────────────┘ ───────────────────────► └─────────┬──────────┘
                                                     │
                                          CDN / edge │ s-maxage=300
                                                     ▼
                                                  Reader
```

WordPress never renders a page a reader sees. It is a content store with a good
admin UI. That split is what keeps result-day traffic off the CMS.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:4321 — runs on bundled sample content
```

No WordPress needed to start. With `WP_API_URL` empty the site serves the
snapshot in `src/content/snapshot.ts`, so frontend work is never blocked on
backend setup.

### Point it at a real WordPress

```bash
cp .env.example .env
# set WP_API_URL=https://admin.yoursite.com
npm run dev
```

### Or at the mock WordPress (no install required)

```bash
npm run mock:wp                                   # terminal 1 — port 4399
WP_API_URL=http://127.0.0.1:4399 npm run dev      # terminal 2
```

The mock serves the awkward payload shapes real WordPress produces — ACF file
fields as objects, empty repeaters returning `false`, alternative repeater key
names, Yoast on one post and RankMath on another. It exists so the normaliser
gets tested against reality rather than tidy fixtures.

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm start` | Run the built server (`--env-file-if-exists=.env`) |
| `npm run check` | Type-check `.astro` + `.ts` — **run this before every commit** |
| `npm run verify` | `check` + `build` |
| `npm run mock:wp` | Start the mock WordPress API on port 4399 |
| `npm run wp:fields` | Detect ACF/CPT drift between WordPress and the frontend |
| `npm run wp:routes` | Dump Astro's built route table |
| `node scripts/verify.mjs` | End-to-end test against a running server |

> **`npm run check` is not optional.** `astro build` does not type-check. During
> development a missing import shipped to a running server, returned HTTP 200,
> and rendered a 21-byte "Internal server error" body — every route reported
> green in a status-code-only test. `npm run check` catches that class of bug at
> build time; `scripts/verify.mjs` catches it at runtime by asserting on bodies.

---

## Environment

Runtime environment variables override build-time ones. This matters: a secret
read through `import.meta.env` gets inlined into `dist/` as plaintext. See the
header comment in `src/lib/env.ts` — that is not hypothetical, it happened here
and is why `readSecret()` exists.

| Variable | Default | Notes |
|---|---|---|
| `SITE_URL` | `https://example-govjobs.com` | Canonical origin for sitemap, hreflang, OG |
| `WP_API_URL` | *(empty)* | Empty = snapshot mode. No trailing slash. |
| `WP_API_MODE` | `rest` | `rest` or `graphql` |
| `WP_APP_USER` / `WP_APP_PASSWORD` | *(empty)* | Application password, for draft previews |
| `WP_CACHE_TTL` | `90` | Seconds an API response is cached in memory |
| `WP_FALLBACK_TO_SNAPSHOT` | `true` | Serve the snapshot instead of a 500 when WordPress is down |
| `REVALIDATE_SECRET` | — | **Change before deploying.** Shared with the WordPress webhook. |
| `DEPLOY_HOOK_URL` | *(empty)* | Optional host deploy hook, called on revalidation |
| `CDN_PURGE_URL` / `CDN_PURGE_TOKEN` | *(empty)* | Optional edge cache purge |
| `PUBLIC_ADSENSE_CLIENT` | placeholder | AdSense publisher id |
| `PUBLIC_ADSENSE_ENABLED` | `true` | `false` renders reserved placeholders instead |
| `PUBLIC_GA_MEASUREMENT_ID` | *(empty)* | Enables GA if set |

---

## Routes

Both locales are served from the same components; `/hi` is a thin wrapper, so the
two cannot drift apart.

| Route | Purpose |
|---|---|
| `/` · `/hi` | Homepage — hero, category tiles, latest across all types |
| `/latest-jobs` · `/jobs` | Category listing (both the pretty slug and the REST base resolve) |
| `/results` `/admit-card` `/answer-key` `/syllabus` `/admission` `/notification` | Category listings |
| `/{category}/{slug}` | Single post — ACF tables, PDF, apply link, related posts |
| `/search?q=` | Search, `noindex` |
| `/about` `/contact` `/privacy-policy` `/disclaimer` `/terms` | Static pages (AdSense needs these) |
| `/sitemap.xml` | Sitemap with hreflang alternates for every URL |
| `/robots.txt` | Generated from the configured origin |
| `/api/health` | Source, cache stats, last WordPress error. `POST` flushes the cache. |
| `/api/revalidate` | WordPress webhook receiver |
| `/api/cover/{slug}` | Generated SVG cover — a placeholder until real media exists |

All category and post routes are **server-rendered on demand** with
`Cache-Control: s-maxage=300, stale-while-revalidate=86400`. A published post is
live within seconds; a visitor never waits on WordPress.

---

## Project layout

```
src/
├── lib/
│   ├── wp.ts           ← the only file that knows WordPress' payload shape
│   ├── env.ts          ← runtime vs build-time env (read this before changing)
│   ├── post-types.ts   ← post type registry; add a category here + in WP
│   ├── format.ts       ← date/currency/relative-time, hi-IN aware
│   └── types.ts        ← the normalised domain model
├── i18n/               ← UI strings (en + hi) and locale routing helpers
├── layouts/BaseLayout  ← head, SEO, theme bootstrap, chrome
├── components/
│   ├── pages/          ← HomePage, CategoryPage, PostPage, SearchPage, StaticPage
│   └── *.astro         ← Header, Footer, PostCard, PostTables, AdSlot, …
├── content/
│   ├── snapshot.ts     ← offline fallback content
│   └── static-pages.ts ← about/contact/privacy/disclaimer/terms, bilingual
├── pages/              ← routes (en), plus hi/ mirrors and api/ endpoints
├── styles/global.css   ← design tokens, dark mode, component classes
└── middleware.ts       ← locale resolution, security headers, cache headers

wordpress/
├── README-SETUP.md          ← step-by-step backend setup
├── plugin-list.md           ← what to install and why (and what not to)
├── acf-field-groups.json    ← importable ACF field groups
├── cptui-post-types.json    ← importable post types
├── cptui-taxonomies.json    ← importable taxonomies
└── functions-snippets.php   ← settings endpoint, webhook, hardening

scripts/
├── mock-wordpress.mjs       ← fake WP API for offline development
├── verify.mjs               ← end-to-end route + SEO + webhook tests
├── validate-wp-config.mjs   ← ACF/CPT drift detector
└── inspect-routes.mjs       ← dump Astro's built route table

deploy/
├── README.md                ← VPS runbook (PM2 and Docker paths)
├── Dockerfile               ← multi-stage production image
├── docker-compose.yml       ← app container, nginx on the host
├── nginx.conf               ← TLS, rate limiting, edge cache, static assets
└── ecosystem.config.cjs     ← PM2 alternative

.github/workflows/ci.yml     ← check + build + secret-leak + end-to-end verify
```

---

## Measured performance

Lighthouse, mobile preset with simulated throttling (≈4× CPU slowdown, Slow 4G),
against the production build. **All 38 pages audited — every category at or above
90 on every page, and CLS 0 everywhere.**

| Page | Perf | A11y | Best practices | SEO |
|---|---|---|---|---|
| Homepage | 95 | **100** | **100** | **100** |
| Category listing (`/results`) | 99 | **100** | **100** | **100** |
| Post page | 94 | **100** | **100** | **100** |
| Search results | 98 | **100** | **100** | 66 ¹ |
| Static page (`/about`) | 99 | **100** | **100** | **100** |
| Hindi homepage (`/hi`) | 95 | **100** | **100** | **100** |
| Hindi category (`/hi/admit-card`) | 97 | **100** | **100** | **100** |
| Hindi post | 90 | **100** | **100** | **100** |
| | **mean 96** | **100** | **100** | **98** |

¹ **Intentional.** The search page carries `<meta name="robots" content="noindex, follow">`.
Query-driven result pages are effectively infinite; indexing them wastes crawl
budget and produces near-duplicate pages. Lighthouse's `is-crawlable` audit
cannot tell a deliberate exclusion from an accidental one, so the low score is
the correct outcome. `scripts/lighthouse-audit.mjs` knows this and does not
report it as a regression.

Reproduce it:

```bash
node --env-file-if-exists=.env ./dist/server/entry.mjs &
npm run audit                       # 8 representative page types
CHROME_PATH="/path/to/chrome" npm run audit / /hi /results   # or specific paths
```

### The four fixes that mattered

**1. Self-hosted fonts** (+11 Performance on the homepage). The first measurement
was Perf **87**, LCP **3.6 s**. Isolating it by blocking `fonts.gstatic.com` gave
Perf **98**, LCP **2.0 s** — the entire gap was the third-party font origin, and
not only latency: the hero `<h1>` is the LCP element, it paints in the fallback
face, and the repaint when the web font arrives is recorded as a *later* LCP
candidate. `npm run fonts` downloads only the Latin and Devanagari subsets,
preloads the one on the LCP path, and generates the preload paths so a rename
cannot leave a stale `<link rel="preload">` behind.

**2. Static font instances for Devanagari** (+6 Performance on Hindi pages). A
variable font carries every weight plus a `gvar` table of deltas — a win when
many weights are used, a loss when two are. Measured: Inter uses five weights, so
the variable file (47 KB) beats five static ones (~60 KB); Hindi uses two, so two
static files (96 KB) beat the variable file (118 KB) by 19%. Hindi homepage
Performance went **89 → 95** and TBT **300 ms → 10 ms**, because static faces
skip the delta work at render time.

**3. `font-display: optional` for Devanagari** (fixed the worst CLS on the site).
Auditing all 38 pages — rather than one per route type — surfaced
`/hi/admit-card` at **CLS 0.191**, well past the 0.1 "poor" threshold. Blocking
the fonts took it to CLS 0 and Perf 99, pinning the cause to the swap.

The textbook fix is a metric-matched fallback, and one was built: `size-adjust`
measured in the browser (Nirmala UI renders Hindi 10% wider than Noto Sans
Devanagari) with overrides derived from the font's own hhea metrics. It fixed the
listing page — **0.191 → 0.001** — and then left the sibling *post* page shifting
at **0.153**. A single measured ratio is not a metric match: Devanagari
line-breaking varies enough between strings that some pages still reflow.

So the Devanagari faces use `font-display: optional` instead, which removes the
reflow rather than shrinking it — the browser uses the fallback for the whole
page load and never swaps. **CLS 0 on every Hindi page.** The font is still
downloaded and cached, so it applies from the second page onward, and readers of
a jobs portal are repeat visitors. Inter keeps `swap`, because its metric-matched
fallback *is* verified (the homepage holds CLS 0 with Inter swapping).

**4. Accessibility, 83 → 100.** Lighthouse found five real defects, all fixed:
an unnamed mobile search button (the visible label is `hidden` below `sm` and the
icon is `aria-hidden`); three contrast failures, including a dark-mode one where
white sat on a light orange at **2.07:1**; invalid `<dl>` markup (a decorative
`<span>` inside the `dt`/`dd` wrapper, which the HTML content model forbids); and
an `h2 → h4` heading skip in the sidebar.

> Auditing **one page per route type** was not enough. `/hi/admit-card` and
> `/hi/admit-card/{slug}` share every component and differ only in content — one
> had CLS 0.191 and the other 0.001. Both were below target in different ways,
> and only the full sweep found them.

### Also measured, and rejected

`inlineStylesheets: 'always'` removes the render-blocking CSS request — which
sounds like a win. Measured: Performance **95** with it, **96** without, and HTML
grew from 98 KB to 152 KB. Reverted; the numbers are recorded in
`astro.config.mjs` so nobody re-tries it on intuition.

Two main-thread anti-patterns were removed as well: `will-change: transform` on
every card (promotes ~40 elements to compositor layers, which Chrome then caps
and silently ignores), and a reading-progress bar that transitioned `width`
instead of `transform: scaleX()` — the latter re-runs document layout on every
scroll frame.

---

## What is actually verified

Not "should work" — measured, with `scripts/verify.mjs`, `scripts/validate-wp-config.mjs`,
and the mock API:

- **81 end-to-end assertions pass** against the production build, covering every
  route, both locales, SEO tags, JSON-LD, webhook auth, and response headers.
- **WordPress integration tested against the awkward payloads**: ACF file fields
  returned as objects *and* as URL strings; repeaters returned as `false` when
  empty; alternative repeater key names (`event`/`value`, `label`/`fee`,
  `post`/`posts`); Yoast on one post, RankMath on another, no SEO plugin on a
  third. All normalise correctly, and the whole suite re-passes in WordPress mode.
- **Resilience tested by killing WordPress mid-run**: the site returns HTTP 200
  with real content from the snapshot and shows a visible "cached snapshot"
  banner. `/api/health` reports `degraded: true` and the underlying error.
- **`astro check` is clean** — 0 errors, 0 warnings across 61 files.
- **No secret in the build output** — verified by grepping `dist/`.
- **ACF/CPT drift detector passes** — every field the normaliser reads exists in
  the importable field-group JSON.
- **Lighthouse measured on all 38 pages** (every route template in both
  languages), mobile with simulated throttling: mean Performance 96,
  Accessibility 100, Best Practices 100, SEO 98 — and **CLS 0 on every page**.
  See the table above.

### What is *not* verified

- **No real WordPress was available in this environment.** Everything WordPress-side
  is validated against a faithful mock, not a live install. The ACF/CPT JSON files
  are written to ACF's and CPT UI's documented import formats but have not been
  imported into a real site. Budget an hour for that first import.
- **Lighthouse covers every route template in both languages** (38 pages), but
  not every URL. Paginated archives (`?page=2`) and taxonomy archives have not
  been individually audited — the sample content is too small to produce them.
  They share the same components as the pages that were measured.
- **`npm run fonts` needs Python** (`fonttools` + `brotli`) for the static
  Devanagari instances. Without it the script falls back to the variable font —
  the site still works, Hindi pages are just ~22 KB heavier.
- **WPGraphQL is not implemented.** REST is used (reasoning in `src/lib/wp.ts`).
  The migration path is documented; the code is not written.
- **The `deploy/` config has not been executed** — no Docker or nginx was
  available here. It *is* statically validated (`npm run deploy:check`, 23
  checks): every Dockerfile `COPY` source exists, `.dockerignore` excludes
  secrets, every nginx path resolves to output the build actually produces, and
  the PM2 and compose paths resolve. That check found two real bugs — an nginx
  alias one directory above the assets, and a missing `.dockerignore` that would
  have sent `.env` into the build context. It does **not** prove the config
  works: run `nginx -t` and a real `docker build` before relying on it.
- **Hindi content quality**: the UI strings and sample content are translated, but
  a native speaker should review the Hindi legal pages before launch.
- **AdSense approval** is out of scope; the slots and the required legal pages
  are in place.

---

## Design decisions worth knowing

**REST, not WPGraphQL.** REST needs no extra plugin, maps 1:1 to WordPress' own
object cache, and every CDN understands query-string caching. GraphQL's advantage
— one round trip for deeply nested fields — does not apply here: this content
model has exactly one expensive relation (featured media + terms), and `?_embed`
resolves it in the same request. GraphQL would add a plugin, a schema to maintain,
and a second cache layer to debug. Reasoning is at the top of `src/lib/wp.ts`.

**Deadlines live in the Important Dates repeater, not a dedicated field.** That is
how these posts are actually written in wp-admin. The frontend finds the row
labelled "last date" (excluding "fee payment last date") and derives the countdown
badge, the sidebar countdown card and schema.org `validThrough` from it. One row
of truth, and editors do not have to fill the same date in twice.

**JobPosting schema only on `jobs`.** Emitting `JobPosting` on a result or admit
card page is a schema violation that gets rich results suppressed sitewide, so
`PostPage.astro` picks `JobPosting` or `NewsArticle` per post type.

**Ad slots are reserved from day one.** Every slot renders a fixed-ratio
placeholder with the exact dimensions of the real unit, so enabling AdSense moves
zero pixels. Dropping ads into unpreserved space is the classic way to lose the
CLS half of a Lighthouse score.

**Local static pages, not WordPress pages.** About / Contact / Privacy /
Disclaimer / Terms are in `src/content/static-pages.ts`. AdSense requires them to
be reachable, and putting them in the repo means they cannot be accidentally
drafted or unpublished by an editor mid-review.

**Theme is client-side, no cookie.** The dark/light choice lives in
`localStorage`, applied by an inline script before first paint. This is deliberate:
a cookie-based theme would force `Vary: Cookie` on every response and fragment the
edge cache for every visitor.

---

## Deployment

Full runbook — server sizing, TLS, firewall, backups, monitoring, load testing —
is in **[`deploy/README.md`](deploy/README.md)**. Summary:

### VPS (PM2 + nginx, or Docker)

```bash
# PM2 path
npm ci && npm run check && npm run build
pm2 start deploy/ecosystem.config.cjs && pm2 save && pm2 startup

# Docker path
docker compose -f deploy/docker-compose.yml up -d --build
```

`deploy/nginx.conf` handles TLS termination, rate limiting, immutable caching for
hashed assets, and — most importantly — **edge caching of the rendered HTML** with
`stale-while-revalidate`. That cache is what keeps WordPress load near zero on
result day. If you find yourself wanting a bigger server, check the cache hit rate
first: the cache is almost certainly the thing that is misconfigured.

The container publishes on `127.0.0.1:4321` only, so the Node server is never
directly reachable. Going straight to it would bypass TLS, rate limiting and the
cache.

### Frontend — Vercel or Netlify

Swapping the adapter is two lines in `astro.config.mjs`:

```js
import vercel from '@astrojs/vercel';
// ...
adapter: vercel(),
```

Then set the environment variables from the table above. `REVALIDATE_SECRET` must
be a real secret and must match WordPress.

### WordPress

Managed hosting to start, VPS later — as the brief specifies. The migration is
mostly DNS and restoring a backup; nothing in the frontend depends on where
WordPress is hosted, only on `WP_API_URL`.

Do not co-host WordPress and the frontend on the same box. A traffic spike on the
portal should never be able to take down the CMS, and vice versa.

---

## The daily workflow

1. Editor adds a post in wp-admin, fills both ACF groups, publishes.
2. `save_post` fires the webhook → frontend drops the affected cache entries.
3. Next request re-renders from WordPress and caches at the edge for 5 minutes.

An edit is visible in seconds. If the webhook fails, the TTL still catches it
within 90 seconds. If WordPress goes down entirely, readers get the bundled
snapshot with a banner instead of an error page — a stale page beats no page on
the day everyone is refreshing for a result.
