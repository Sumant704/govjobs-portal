#!/usr/bin/env node
/**
 * ---------------------------------------------------------------------------
 * Lighthouse audit across the site's page types
 * ---------------------------------------------------------------------------
 * Runs Lighthouse against one representative page per route type and prints a
 * table. Exists because auditing a single page tells you almost nothing: the
 * homepage and a post page have very different DOM sizes, and a category
 * listing with 15 cards plus pagination is a different shape again.
 *
 *   node --env-file-if-exists=.env ./dist/server/entry.mjs &
 *   node scripts/lighthouse-audit.mjs                 # all pages
 *   node scripts/lighthouse-audit.mjs /results /hi    # specific pages
 *
 * Requires a Chrome binary. Set CHROME_PATH if Lighthouse cannot find one:
 *   CHROME_PATH="/c/Program Files/Google/Chrome/Application/chrome.exe" \
 *     node scripts/lighthouse-audit.mjs
 *
 * Reports are written to .lighthouse/ (gitignored) so they can be diffed
 * between runs.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.AUDIT_BASE || 'http://127.0.0.1:4321';
const OUT_DIR = join(ROOT, '.lighthouse');

/** One representative page per route type. */
const PAGES = [
  ['Homepage', '/'],
  ['Category listing', '/results'],
  ['Post page', '/latest-jobs/ssc-cgl-2026-notification'],
  ['Search results', '/search?q=ssc'],
  ['Static page', '/about'],
  ['Hindi homepage', '/hi'],
  ['Hindi category', '/hi/latest-jobs'],
  ['Hindi post', '/hi/latest-jobs/ssc-cgl-2026-notification'],
];

/**
 * Pages Lighthouse will not score, with the reason. Listed explicitly so they
 * show as "skipped" rather than as failures — an unexplained FAILED row is how
 * a real regression gets ignored.
 */
const SKIP = new Map([
  [
    '/this-page-does-not-exist',
    'error page — Lighthouse refuses to audit a 404 response',
  ],
]);

/**
 * Routes that are deliberately excluded from search engines, so a low SEO score
 * is the intended result rather than a defect. Search result pages are
 * query-driven and effectively infinite; letting them into the index wastes
 * crawl budget and produces near-duplicate pages. They carry
 * `<meta name="robots" content="noindex, follow">` on purpose.
 */
const INTENTIONALLY_NOINDEX = new Set(['/search', '/hi/search']);

const CATEGORIES = 'performance,accessibility,best-practices,seo';

const wanted = process.argv.slice(2).filter((a) => a.startsWith('/'));
const pages = wanted.length ? wanted.map((p) => [p, p]) : PAGES;

// --- Gate on the server being up -------------------------------------------
try {
  const res = await fetch(`${BASE}/api/health`);
  if (!res.ok) throw new Error(`health returned ${res.status}`);
} catch (error) {
  console.error(`\nSERVER NOT REACHABLE at ${BASE} — ${error.message}`);
  console.error('Start it first:  node --env-file-if-exists=.env ./dist/server/entry.mjs\n');
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

const lighthouseBin = join(ROOT, 'node_modules', 'lighthouse', 'cli', 'index.js');
if (!existsSync(lighthouseBin)) {
  console.error('\nlighthouse is not installed. Run:  npm i -D lighthouse chrome-launcher\n');
  process.exit(1);
}

const rows = [];

for (const [label, path] of pages) {
  if (SKIP.has(path)) {
    console.log(`  skipping ${label.padEnd(18)} ${SKIP.get(path)}`);
    rows.push({ label, path, skipped: SKIP.get(path) });
    continue;
  }

  const slug = path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'root';
  const out = join(OUT_DIR, `${slug}.json`);

  process.stdout.write(`  auditing ${label.padEnd(18)} ${path} ... `);

  try {
    execFileSync(
      process.execPath,
      [
        lighthouseBin,
        `${BASE}${path}`,
        '--output=json',
        `--output-path=${out}`,
        '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
        `--only-categories=${CATEGORIES}`,
        '--quiet',
      ],
      { stdio: 'ignore', env: { ...process.env, NODE_OPTIONS: '' } },
    );
  } catch {
    console.log('FAILED');
    rows.push({ label, path, error: true });
    continue;
  }

  const report = JSON.parse(readFileSync(out, 'utf8'));
  const c = report.categories;
  const m = report.audits;
  const score = (k) => (c[k]?.score == null ? null : Math.round(c[k].score * 100));

  // Which accessibility rules are still failing, so a number never travels
  // without its reason.
  const a11yFails = [];
  for (const [id, audit] of Object.entries(report.audits)) {
    if (audit.score === null || audit.score >= 1) continue;
    if (audit.scoreDisplayMode === 'informative' || audit.scoreDisplayMode === 'notApplicable') continue;
    const cat = Object.entries(c).find(([, v]) => v.auditRefs.some((r) => r.id === id));
    if (cat?.[0] === 'accessibility') a11yFails.push(id);
  }

  const noindex = INTENTIONALLY_NOINDEX.has(path.split('?')[0]);

  rows.push({
    label,
    path,
    noindex,
    perf: score('performance'),
    a11y: score('accessibility'),
    bp: score('best-practices'),
    seo: score('seo'),
    fcp: m['first-contentful-paint']?.displayValue ?? '-',
    lcp: m['largest-contentful-paint']?.displayValue ?? '-',
    tbt: m['total-blocking-time']?.displayValue ?? '-',
    cls: m['cumulative-layout-shift']?.displayValue ?? '-',
    a11yFails,
  });

  console.log(`${score('performance')} / ${score('accessibility')} / ${score('best-practices')} / ${score('seo')}`);
}

// --- Summary ----------------------------------------------------------------

const pad = (v, n) => String(v ?? 'n/a').padStart(n);

console.log(`\n${'─'.repeat(94)}`);
console.log(
  'Page'.padEnd(18) + 'Perf  A11y    BP   SEO    FCP      LCP      TBT     CLS',
);
console.log('─'.repeat(94));

let belowTarget = [];
for (const r of rows) {
  if (r.skipped) {
    console.log(r.label.padEnd(18) + 'skipped');
    continue;
  }
  if (r.error) {
    console.log(r.label.padEnd(18) + 'FAILED');
    continue;
  }
  console.log(
    r.label.padEnd(18) +
      pad(r.perf, 4) +
      pad(r.a11y, 6) +
      pad(r.bp, 6) +
      pad(r.seo, 6) +
      pad(r.fcp, 8) +
      pad(r.lcp, 9) +
      pad(r.tbt, 8) +
      pad(r.cls, 8),
  );
  for (const k of ['perf', 'a11y', 'bp', 'seo']) {
    if (r[k] === null || r[k] >= 90) continue;
    // A deliberately noindexed page scoring low on SEO is the intended
    // outcome, not a regression. Flagging it every run trains people to
    // ignore the report.
    if (k === 'seo' && r.noindex) continue;
    belowTarget.push(`${r.label} ${k}=${r[k]}`);
  }
  if (r.noindex) console.log(' '.repeat(18) + '↳ SEO intentionally excluded (noindex, follow)');
  if (r.a11yFails.length) console.log(' '.repeat(18) + `↳ a11y failures: ${r.a11yFails.join(', ')}`);
}

console.log('─'.repeat(94));

const scored = rows.filter((r) => !r.error && !r.skipped);
const avg = (k) => Math.round(scored.reduce((s, r) => s + (r[k] ?? 0), 0) / scored.length);
console.log(`  ${scored.length} pages · mean  Perf ${avg('perf')}  A11y ${avg('a11y')}  BP ${avg('bp')}  SEO ${avg('seo')}`);

if (belowTarget.length) {
  console.log(`\n  Below the 90 target: ${belowTarget.join(', ')}`);
} else {
  console.log('\n  Every category is at or above 90 on every page audited.');
}

writeFileSync(join(OUT_DIR, 'summary.json'), JSON.stringify(rows, null, 2));
console.log(`\n  Full reports in .lighthouse/\n`);
