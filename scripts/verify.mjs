#!/usr/bin/env node
/**
 * End-to-end verification for the built site.
 *
 * Run against a server that is already listening:
 *   node --env-file-if-exists=.env ./dist/server/entry.mjs &
 *   node scripts/verify.mjs
 *
 * ---------------------------------------------------------------------------
 * Why this checks response BODIES and not just status codes
 * ---------------------------------------------------------------------------
 * Astro's Node adapter streams the response. If a component throws while
 * rendering, the headers have already been flushed, so the client receives
 * `200 OK` followed by a 21-byte body reading "Internal server error". A
 * status-code-only test matrix reports that as a pass.
 *
 * That is not hypothetical: it is exactly how a missing component import
 * (`LangSwitch is not defined`) passed an earlier version of this suite with
 * every route green. So every HTML assertion here checks a minimum body size
 * AND the absence of the error marker.
 */

const BASE = process.env.VERIFY_BASE || 'http://127.0.0.1:4321';

/** Routes that must return 200 with a real body. */
const OK_ROUTES = [
  '/',
  '/latest-jobs',
  '/jobs',
  '/results',
  '/admit-card',
  '/answer-key',
  '/syllabus',
  '/admission',
  '/notification',
  '/results/ssc-chsl-2025-final-result',
  '/latest-jobs/ssc-cgl-2026-notification',
  '/admit-card/ssc-mts-havaldar-2026-admit-card',
  '/answer-key/ssc-gd-constable-2026-answer-key',
  '/syllabus/ssc-cgl-2026-syllabus-exam-pattern',
  '/admission/cuet-ug-2026-admission',
  '/search',
  '/search?q=ssc',
  '/about',
  '/contact',
  '/privacy-policy',
  '/disclaimer',
  '/terms',
  '/hi',
  '/hi/latest-jobs',
  '/hi/results/ssc-chsl-2025-final-result',
  '/hi/search?q=ssc',
  '/hi/about',
  '/hi/contact',
  '/hi/privacy-policy',
  '/hi/disclaimer',
  '/hi/terms',
  '/sitemap.xml',
  '/robots.txt',
  '/api/health',
  '/api/cover/test-slug',
];

/** Routes that must 404. */
const NOT_FOUND_ROUTES = ['/this-does-not-exist', '/latest-jobs/no-such-post', '/bogus-category'];

/** Body must contain every one of these strings. */
const CONTENT_CHECKS = [
  ['/', ['gradient-text', 'marquee-track', 'data-theme-toggle', 'site.webmanifest', 'og-default.svg']],
  ['/latest-jobs/ssc-cgl-2026-notification', [
    'rel="canonical" href="https://example-govjobs.com/latest-jobs/ssc-cgl-2026-notification"',
    'hreflang="hi-IN"',
    'hreflang="x-default"',
    '"@type":"JobPosting"',
    '"@type":"BreadcrumbList"',
    '"@type":"WebSite"',
    'SearchAction',
    'table-gov',
    'Important Dates',
    'Application Fee',
    'Age Limit',
    'Vacancy Details',
    '17,727',
    'data-ad-slot',
    'id="how-to-apply"',
    'Related Posts',
    'ssc.gov.in',
  ]],
  ['/results/ssc-chsl-2025-final-result', ['"@type":"NewsArticle"']],
  ['/hi/latest-jobs/ssc-cgl-2026-notification', [
    'lang="hi-IN"',
    'href="https://example-govjobs.com/hi/latest-jobs/ssc-cgl-2026-notification"',
    'महत्वपूर्ण तिथियां',
    'आवेदन शुल्क',
    'नवीनतम नौकरियां',
  ]],
  ['/robots.txt', ['Sitemap: https://example-govjobs.com/sitemap.xml', 'Disallow: /search']],
  ['/sitemap.xml', ['<xhtml:link rel="alternate" hreflang="hi-IN"', 'ssc-cgl-2026-notification']],
];

/** Body must NOT contain these. */
const ABSENCE_CHECKS = [
  // JobPosting on a non-job page is a schema violation that gets rich results
  // suppressed sitewide, so it is worth asserting.
  ['/results/ssc-chsl-2025-final-result', '"@type":"JobPosting"'],
  ['/latest-jobs/ssc-cgl-2026-notification', 'cached snapshot'],
];

let pass = 0;
let fail = 0;

const ok = (label) => {
  pass++;
  console.log(`  \u001b[32mPASS\u001b[0m  ${label}`);
};
const bad = (label) => {
  fail++;
  console.log(`  \u001b[31mFAIL\u001b[0m  ${label}`);
};

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { redirect: 'manual' });
  const body = await res.text();
  return { status: res.status, body, headers: res.headers };
}

async function post(path, { headers = {}, body } = {}) {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body });
  return { status: res.status, body: await res.text(), headers: res.headers };
}

async function main() {
  // --- Gate on the server being up ----------------------------------------
  try {
    const health = await get('/api/health');
    if (health.status !== 200) throw new Error(`health returned ${health.status}`);
  } catch (error) {
    console.error(`\nSERVER NOT REACHABLE at ${BASE} — ${error.message}`);
    console.error('Start it first:  node --env-file-if-exists=.env ./dist/server/entry.mjs\n');
    process.exit(1);
  }

  console.log(`\nVerifying ${BASE}\n`);

  // --- 1. Routes render ---------------------------------------------------
  console.log('1. Routes return a real rendered body');
  for (const route of OK_ROUTES) {
    const { status, body, headers } = await get(route);
    const isHtml = (headers.get('content-type') ?? '').includes('text/html');
    // Only HTML gets the minimum-size check: a JSON endpoint is legitimately
    // small, and applying the same threshold there produces false failures.
    const minBytes = isHtml ? 250 : 20;
    if (status !== 200) {
      bad(`${route} — status ${status}`);
    } else if (body.length < minBytes) {
      bad(`${route} — body only ${body.length} bytes`);
    } else if (isHtml && /Internal server error/i.test(body)) {
      bad(`${route} — mid-stream render error`);
    } else {
      ok(`${route} (${body.length}b)`);
    }
  }

  // --- 2. 404s are real 404s ---------------------------------------------
  console.log('\n2. Unknown routes return 404 (not a soft redirect)');
  for (const route of NOT_FOUND_ROUTES) {
    const { status } = await get(route);
    if (status === 404) ok(`${route} -> 404`);
    else bad(`${route} -> ${status}, expected 404`);
  }

  // --- 3. Content and SEO assertions -------------------------------------
  console.log('\n3. SEO and content assertions');
  for (const [route, needles] of CONTENT_CHECKS) {
    const { body } = await get(route);
    for (const needle of needles) {
      if (body.includes(needle)) ok(`${route} contains ${JSON.stringify(needle.slice(0, 46))}`);
      else bad(`${route} MISSING ${JSON.stringify(needle.slice(0, 46))}`);
    }
  }

  // --- 4. Absence assertions ---------------------------------------------
  console.log('\n4. Absence assertions');
  for (const [route, needle] of ABSENCE_CHECKS) {
    const { body } = await get(route);
    if (body.includes(needle)) bad(`${route} must NOT contain ${JSON.stringify(needle)}`);
    else ok(`${route} correctly omits ${JSON.stringify(needle.slice(0, 40))}`);
  }

  // --- 5. Revalidation webhook -------------------------------------------
  console.log('\n5. Revalidation webhook authentication');
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    console.log('  \u001b[33mSKIP\u001b[0m  REVALIDATE_SECRET not set in this shell');
  } else {
    const noSecret = await post('/api/revalidate', {
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (noSecret.status === 401) ok('rejects a request with no secret (401)');
    else bad(`no-secret request returned ${noSecret.status}, expected 401`);

    const wrongSecret = await post('/api/revalidate', {
      headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': 'wrong' },
      body: '{}',
    });
    if (wrongSecret.status === 401) ok('rejects a bad secret (401)');
    else bad(`bad-secret request returned ${wrongSecret.status}, expected 401`);

    const goodSecret = await post('/api/revalidate', {
      headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': secret },
      body: JSON.stringify({ post_type: 'jobs', slug: 'ssc-cgl-2026-notification', action: 'publish' }),
    });
    if (goodSecret.status === 200 && goodSecret.body.includes('"ok": true')) {
      ok('accepts a valid JSON webhook (200)');
    } else {
      bad(`valid webhook returned ${goodSecret.status}: ${goodSecret.body.slice(0, 120)}`);
    }

    const formSecret = await post('/api/revalidate', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, post_type: 'results', slug: 'x' }).toString(),
    });
    if (formSecret.status === 200 && formSecret.body.includes('"postType": "results"')) {
      ok('accepts a form-encoded webhook and reads the post type');
    } else {
      bad(`form-encoded webhook returned ${formSecret.status}: ${formSecret.body.slice(0, 120)}`);
    }
  }

  // --- 6. Headers ---------------------------------------------------------
  console.log('\n6. Security and cache headers');
  const home = await get('/');
  const expect = [
    ['x-content-type-options', 'nosniff'],
    ['x-frame-options', 'SAMEORIGIN'],
    ['referrer-policy', 'strict-origin-when-cross-origin'],
    ['x-content-source', null],
  ];
  for (const [name, value] of expect) {
    const actual = home.headers.get(name);
    if (!actual) bad(`missing header ${name}`);
    else if (value && actual !== value) bad(`${name} is "${actual}", expected "${value}"`);
    else ok(`${name}: ${actual}`);
  }
  const cc = home.headers.get('cache-control') ?? '';
  if (cc.includes('s-maxage')) ok(`cache-control: ${cc}`);
  else bad(`cache-control missing s-maxage: ${cc}`);

  // --- Summary ------------------------------------------------------------
  console.log(`\n${'─'.repeat(58)}`);
  console.log(`  ${pass} passed, ${fail} failed`);
  console.log(`${'─'.repeat(58)}\n`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('\nVerification crashed:', error);
  process.exit(1);
});
