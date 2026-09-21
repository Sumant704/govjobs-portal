# SarkariHub — project memory

Astro SSR frontend for an Indian government-jobs portal, fed by WordPress
(REST or WPGraphQL). Bilingual: English at `/`, Hindi at `/hi`. Built and
verified across several sessions starting 2026-09-21.

## Commands

| What | Command |
|---|---|
| Verify everything | `NODE_OPTIONS= node --env-file-if-exists=.env scripts/verify.mjs` |
| ACF drift check | `npm run wp:fields` |
| Deploy config | `npm run deploy:check` |
| Lighthouse | `npm run audit` (needs the server running + `CHROME_PATH`) |
| Regenerate fonts | `npm run fonts` (needs Python + fonttools for static instances) |
| Types | `npm run check` |

The dev/preview server is `node --env-file-if-exists=.env ./dist/server/entry.mjs`
on port 4321. It does not survive a restart — start it before `verify.mjs` or
`npm run audit`, both of which hit the live server.

## Conventions that were fought for

- **`NODE_OPTIONS=` prefix on every node invocation.** The environment sets a
  `NODE_OPTIONS` that breaks these scripts. Omitting it wastes a debugging cycle.
- **Fonts are self-hosted, per-subset, per-family.** `scripts/fetch-fonts.mjs`
  picks variable vs static per family by measured size (Inter: variable wins,
  5 weights; Devanagari: static wins, 2 weights). It refuses to write a subset
  below 15% of its source — that guard catches an empty-range failure mode.
- **Devanagari uses `font-display: optional`; Inter uses `swap`.** Do not
  "improve" the Devanagari face to `swap` — see below.
- **Search pages are deliberately `noindex, follow`.** Lighthouse scores them 66
  on SEO. That is the correct outcome, and `scripts/lighthouse-audit.mjs` is
  written to not flag it.
- **Claims must be measured.** Every performance number in the README came from a
  Lighthouse run, and every fix was isolated by blocking the suspected resource
  before being applied.

## Traps already hit (do not repeat)

1. **The metric-matched Devanagari fallback was built and removed.** It fixed
   `/hi/admit-card` (CLS 0.191 → 0.001) and broke `/hi/admit-card/{slug}`
   (0.001 → 0.153). A single measured `size-adjust` ratio is not a metric match —
   Devanagari line-breaking varies too much between strings. `font-display:
   optional` is the fix: CLS 0 on every Hindi page. Rationale is written into
   `src/styles/global.css` at the point where the face would otherwise go.
2. **Auditing one page per route type is not enough.** Two pages sharing every
   component measured 0.191 vs 0.001. The full 38-page sweep is what caught it.
3. **Verify translated text with curl, not screenshots.** A low-res screenshot
   made it look like ad labels were untranslated on `/hi`; they render विज्ञापन
   correctly.
4. **A validator must itself be correct.** The first `validate-deploy.mjs`
   reported a false failure because compose resolves `dockerfile` relative to the
   *context*, not the compose file's directory.

## Known-unverified (stated in the README, do not quietly claim otherwise)

- No real WordPress — all backend behaviour is against a faithful mock.
- `deploy/` is statically validated (23 checks) but never executed: needs `nginx -t`
  and a real `docker build`. No Docker or nginx on this machine.
- `.env` still holds a placeholder `REVALIDATE_SECRET`.
- Paginated (`?page=2`) and taxonomy archives unaudited — sample content too small.
