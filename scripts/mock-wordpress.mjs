#!/usr/bin/env node
/**
 * ---------------------------------------------------------------------------
 * Mock WordPress REST API
 * ---------------------------------------------------------------------------
 * A dependency-free stand-in for a headless WordPress install.
 *
 * Why this exists:
 *   1. Frontend work is never blocked on backend setup. `node scripts/mock-wordpress.mjs`
 *      and you have a full REST API in two seconds.
 *   2. It is how the normaliser in `src/lib/wp.ts` gets tested. The fixtures
 *      below deliberately include the awkward payload shapes real WordPress
 *      produces — ACF file fields as objects, repeaters that come back as
 *      `false` when empty, alternative repeater key names, Yoast on one post
 *      and RankMath on another, missing `_embedded`. A normaliser that only
 *      ever sees tidy data is a normaliser that breaks in production.
 *
 * Usage:
 *   node scripts/mock-wordpress.mjs                 # port 4399
 *   PORT=5000 node scripts/mock-wordpress.mjs
 *
 *   Then, in another shell:
 *   WP_API_URL=http://127.0.0.1:4399 npm run dev
 */

import { createServer } from 'node:http';

const PORT = Number(process.env.PORT || 4399);

const IMG = (seed, w, h) => ({
  source_url: `https://picsum.photos/seed/${seed}/${w}/${h}`,
  width: w,
  height: h,
});

/** Builds a WordPress post object. */
function post({
  id,
  slug,
  type,
  title,
  date,
  modified,
  acf,
  terms = {},
  media = null,
  seo = 'yoast',
  excerpt = '',
}) {
  const dateGmt = new Date(date).toISOString().replace(/\.\d{3}Z$/, '');
  const modifiedGmt = new Date(modified ?? date).toISOString().replace(/\.\d{3}Z$/, '');

  const embedded = { terms: {} };
  if (media) {
    embedded['wp:featuredmedia'] = [
      {
        id: id * 10,
        source_url: media.source_url,
        alt_text: media.alt_text ?? '',
        media_details: {
          width: media.width ?? 1600,
          height: media.height ?? 900,
          sizes: {
            medium_large: IMG(`${slug}-ml`, 768, 432),
            large: IMG(`${slug}-lg`, 1024, 576),
            full: { source_url: media.source_url, width: media.width ?? 1600, height: media.height ?? 900 },
          },
        },
      },
    ];
  }
  if (terms.category) embedded.terms.category = terms.category;
  if (terms.organization) embedded.terms.organization = terms.organization;

  const base = {
    id,
    slug,
    status: 'publish',
    type,
    link: `https://admin.example-govjobs.com/${type}/${slug}/`,
    title: { rendered: title },
    excerpt: { rendered: `<p>${excerpt}</p>` },
    content: { rendered: '<p>Body copy from the WordPress editor.</p>' },
    date: new Date(date).toISOString(),
    date_gmt: dateGmt,
    modified: new Date(modified ?? date).toISOString(),
    modified_gmt: modifiedGmt,
    acf,
    _embedded: embedded,
  };

  // Deliberately different SEO plugin shapes per post — the normaliser must
  // read whichever is present rather than assuming one.
  if (seo === 'yoast') {
    base.yoast_head_json = {
      title: `${title} | Yoast Title`,
      description: `${title} — details from the official notification.`.slice(0, 155),
      canonical: `https://example-govjobs.com/${type}/${slug}`,
      robots: { index: 'index', follow: 'follow' },
      og_image: [{ url: media?.source_url ?? IMG(`${slug}-og`, 1200, 630).source_url }],
      schema: { article: { keywords: ['ssc', 'govt jobs'] } },
    };
  } else if (seo === 'rankmath') {
    base.rank_math_description = `${title} — RankMath description.`;
    base.rank_math_robots = ['index', 'follow'];
  }
  // seo === 'none' -> no SEO plugin at all; normaliser must fall back to
  // post fields without throwing.

  return base;
}

/* --------------------------------------------------------------------------
   Fixtures
   -------------------------------------------------------------------------- */

const JOBS = [
  post({
    id: 101,
    slug: 'ssc-cgl-2026-notification',
    type: 'jobs',
    title: 'SSC CGL 2026 Notification — 17,727 Posts',
    date: '2026-04-10T06:30:00Z',
    modified: '2026-04-14T09:00:00Z',
    excerpt: 'Staff Selection Commission has released the CGL 2026 notification for 17,727 posts.',
    media: { source_url: IMG('ssc-cgl', 1600, 900).source_url, alt_text: 'SSC CGL 2026' },
    terms: {
      category: [{ id: 5, name: 'Latest Jobs', slug: 'jobs' }],
      organization: [{ id: 22, name: 'Staff Selection Commission', slug: 'ssc' }],
    },
    acf: {
      short_description: 'SSC CGL 2026 — 17,727 Group B and C posts. Apply online 10 April to 09 May 2026.',
      organization: 'Staff Selection Commission',
      qualification: "Bachelor's Degree in any stream from a recognised university.",
      job_location: 'All India',
      // Canonical ACF repeater shape.
      important_dates: [
        { label: 'Application Begin', date: '2026-04-10' },
        { label: 'Last Date for Apply Online', date: '2026-05-09', emphasis: true },
        { label: 'Tier-I Exam Date', date: '2026-06-20' },
      ],
      application_fee: [
        { category: 'General / OBC / EWS', amount: '100' },
        { category: 'SC / ST', amount: '0' },
      ],
      age_limit: { min: '18 Years', max: '32 Years', as_on: '2026-08-01', relaxation: 'SC/ST 5 years, OBC 3 years' },
      vacancy_details: [
        { post_name: 'Assistant Section Officer (CSS)', total_posts: '3512' },
        { post_name: 'Tax Assistant (CBIC)', total_posts: '3420' },
      ],
      total_vacancies: '17727',
      // ACF file field returned as an object (return format: array/object).
      notification_pdf: { url: 'https://ssc.gov.in/notices/CGL2026.pdf', title: 'Notification' },
      // ACF link field returned as an object (return format: array).
      official_website: { url: 'https://ssc.gov.in', title: 'SSC' },
      apply_online_link: { url: 'https://ssc.gov.in/registration', title: 'Apply' },
      how_to_apply: '<ol><li>Register on ssc.gov.in</li><li>Fill the form</li><li>Pay the fee</li></ol>',
      is_featured: true,
    },
  }),

  post({
    id: 102,
    slug: 'ibps-po-xvi-2026',
    type: 'jobs',
    title: 'IBPS PO XVI 2026 — 5,208 Posts',
    date: '2026-07-01T05:00:00Z',
    excerpt: 'IBPS invites applications for Probationary Officer posts.',
    seo: 'rankmath',
    media: { source_url: IMG('ibps-po', 1600, 900).source_url },
    terms: { category: [{ id: 5, name: 'Latest Jobs', slug: 'jobs' }] },
    acf: {
      organization: 'Institute of Banking Personnel Selection',
      qualification: 'Graduation in any discipline.',
      job_location: 'All India',
      // Alternative repeater key names — some ACF field groups use these.
      important_dates: [
        { event: 'Application Begin', value: '2026-07-01' },
        { event: 'Last Date for Apply Online', value: '2026-07-21' },
      ],
      application_fee: [{ label: 'General / OBC / EWS', fee: '850' }],
      age_limit: { min: '20 Years', max: '30 Years', as_on: '2026-07-01' },
      vacancy_details: [{ post: 'Bank of Baroda', posts: '620' }],
      total_vacancies: '5208',
      // ACF file field returned as a plain URL string.
      notification_pdf: 'https://ibps.in/notices/PO2026.pdf',
      official_website: 'https://ibps.in',
      apply_online_link: 'https://ibps.in/apply',
      is_featured: false,
    },
  }),

  post({
    id: 103,
    slug: 'minimal-post-no-acf',
    type: 'jobs',
    title: 'A post with no ACF data at all',
    date: '2026-08-01T05:00:00Z',
    excerpt: 'Edge case: every ACF repeater returns false because nothing was filled in.',
    seo: 'none',
    // Every repeater comes back as `false` — exactly what ACF does when empty.
    acf: {
      organization: '',
      important_dates: false,
      application_fee: false,
      age_limit: false,
      vacancy_details: false,
      notification_pdf: false,
      official_website: false,
      total_vacancies: '',
    },
  }),
];

const RESULTS = [
  post({
    id: 201,
    slug: 'ssc-chsl-2025-final-result',
    type: 'results',
    title: 'SSC CHSL 2025 Final Result Declared',
    date: '2026-02-27T11:15:00Z',
    excerpt: 'Staff Selection Commission has declared the CHSL 2025 final result.',
    media: { source_url: IMG('chsl', 1600, 900).source_url },
    terms: { category: [{ id: 6, name: 'Results', slug: 'results' }] },
    acf: {
      organization: 'Staff Selection Commission',
      qualification: '12th pass.',
      job_location: 'All India',
      important_dates: [{ label: 'Final Result Declared', date: '2026-02-27', emphasis: true }],
      application_fee: [{ category: 'Result Check', amount: '0' }],
      vacancy_details: [{ post_name: 'LDC / JSA', total_posts: '2049' }],
      total_vacancies: '3121',
      official_website: { url: 'https://ssc.gov.in' },
    },
  }),
];

const ADMIT_CARDS = [
  post({
    id: 301,
    slug: 'ssc-mts-2026-admit-card',
    type: 'admit-card',
    title: 'SSC MTS 2026 Admit Card Released',
    date: '2026-04-25T05:20:00Z',
    excerpt: 'Download the Tier-I admit card for MTS and Havaldar Examination 2026.',
    media: { source_url: IMG('mts', 1600, 900).source_url },
    terms: { category: [{ id: 7, name: 'Admit Card', slug: 'admit-card' }] },
    acf: {
      organization: 'Staff Selection Commission',
      qualification: '10th pass.',
      job_location: 'All India',
      important_dates: [
        { label: 'Exam City Intimation Slip', date: '2026-04-20' },
        { label: 'Admit Card Release', date: '2026-04-25', emphasis: true },
      ],
      application_fee: [{ category: 'General / OBC', amount: '100' }],
      vacancy_details: [{ post_name: 'Multi Tasking Staff', total_posts: '8058' }],
      total_vacancies: '9583',
      notification_pdf: { url: 'https://ssc.gov.in/mts2026.pdf' },
      official_website: { url: 'https://ssc.gov.in' },
    },
  }),
];

const ANSWER_KEYS = [
  post({
    id: 401,
    slug: 'ssc-gd-constable-2026-answer-key',
    type: 'answer-key',
    title: 'SSC GD Constable 2026 Answer Key Released',
    date: '2026-04-28T07:10:00Z',
    excerpt: 'Tentative answer key is now available. Objection window open until 12 May 2026.',
    terms: { category: [{ id: 8, name: 'Answer Key', slug: 'answer-key' }] },
    acf: {
      organization: 'Staff Selection Commission',
      qualification: '10th pass.',
      job_location: 'All India',
      important_dates: [{ label: 'Tentative Answer Key', date: '2026-04-28', emphasis: true }],
      application_fee: [
        { category: 'Answer Key Download', amount: '0' },
        { category: 'Objection Fee (per question)', amount: '100' },
      ],
      total_vacancies: '39481',
      official_website: { url: 'https://ssc.gov.in' },
    },
  }),
];

const SYLLABUS = [
  post({
    id: 501,
    slug: 'ssc-cgl-2026-syllabus',
    type: 'syllabus',
    title: 'SSC CGL 2026 Syllabus & Exam Pattern',
    date: '2026-04-12T08:00:00Z',
    excerpt: 'Complete subject-wise syllabus for SSC CGL 2026.',
    terms: { category: [{ id: 9, name: 'Syllabus', slug: 'syllabus' }] },
    acf: {
      organization: 'Staff Selection Commission',
      qualification: "Bachelor's Degree.",
      job_location: 'All India',
      important_dates: [{ label: 'Tier-I Exam Date', date: '2026-06-20' }],
      vacancy_details: [{ post_name: 'Tier-I: Reasoning', total_posts: '25 Questions' }],
      official_website: { url: 'https://ssc.gov.in' },
    },
  }),
];

const ADMISSION = [
  post({
    id: 601,
    slug: 'cuet-ug-2026-admission',
    type: 'admission',
    title: 'CUET UG 2026 Admission — Registration Open',
    date: '2026-02-20T04:00:00Z',
    excerpt: 'NTA has opened CUET UG 2026 registration for 280+ universities.',
    terms: { category: [{ id: 10, name: 'Admission', slug: 'admission' }] },
    acf: {
      organization: 'National Testing Agency',
      qualification: 'Class 12 pass or appearing.',
      job_location: 'All India',
      important_dates: [{ label: 'Last Date to Apply', date: '2026-03-25', emphasis: true }],
      application_fee: [{ category: 'General (up to 3 subjects)', amount: '400' }],
      total_vacancies: '280+ Universities',
      official_website: { url: 'https://nta.ac.in' },
    },
  }),
];

const NOTIFICATIONS = [
  post({
    id: 701,
    slug: 'rrb-ntpc-2026-date-extension',
    type: 'notification',
    title: 'RRB NTPC 2026 — Last Date Extended to 26 March',
    date: '2026-03-18T05:30:00Z',
    excerpt: 'The last date for submission of online applications has been extended.',
    terms: { category: [{ id: 11, name: 'Notifications', slug: 'notification' }] },
    acf: {
      organization: 'Railway Recruitment Board',
      qualification: 'As per the original notification.',
      job_location: 'All India',
      important_dates: [{ label: 'Extended Last Date', date: '2026-03-26', emphasis: true }],
      official_website: { url: 'https://indianrailways.gov.in' },
    },
  }),
];

/** Hindi translations, served when `?lang=hi` is present (Polylang behaviour). */
const HI_TITLES = {
  101: 'एसएससी सीजीएल 2026 अधिसूचना — 17,727 पद',
  102: 'आईबीपीएस पीओ XVI 2026 — 5,208 पद',
  201: 'एसएससी सीएचएसएल 2025 अंतिम परिणाम घोषित',
  301: 'एसएससी एमटीएस 2026 एडमिट कार्ड जारी',
  401: 'एसएससी जीडी कांस्टेबल 2026 उत्तर कुंजी जारी',
  501: 'एसएससी सीजीएल 2026 सिलेबस एवं परीक्षा पैटर्न',
  601: 'सीयूईटी यूजी 2026 प्रवेश — पंजीकरण शुरू',
  701: 'आरआरबी एनटीपीसी 2026 — अंतिम तिथि 26 मार्च तक बढ़ी',
};

const COLLECTIONS = {
  jobs: JOBS,
  results: RESULTS,
  'admit-card': ADMIT_CARDS,
  'answer-key': ANSWER_KEYS,
  syllabus: SYLLABUS,
  admission: ADMISSION,
  notification: NOTIFICATIONS,
};

/* --------------------------------------------------------------------------
   Server
   -------------------------------------------------------------------------- */

let requestCount = 0;

const server = createServer((req, res) => {
  requestCount++;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname, searchParams } = url;

  const send = (status, body, extraHeaders = {}) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    });
    res.end(JSON.stringify(body));
  };

  // Custom settings endpoint (registered by wordpress/functions-snippets.php).
  if (pathname === '/wp-json/govjobs/v1/settings') {
    const lang = searchParams.get('lang') === 'hi' ? 'hi' : 'en';
    return send(200, {
      name: lang === 'hi' ? 'सरकारीहब (WP)' : 'SarkariHub (from WordPress)',
      tagline: lang === 'hi' ? 'सरकारी नौकरी, रिजल्ट और एडमिट कार्ड' : 'Govt Jobs, Results & Admit Cards',
      contactEmail: 'editor@sarkarihub.example',
      contactPhone: '+91 98765 43210',
      address: lang === 'hi' ? 'नई दिल्ली, भारत' : 'New Delhi, India',
      notices: [
        { text: lang === 'hi' ? 'यह सूचना वर्डप्रेस से आ रही है' : 'This notice is served from WordPress', href: '/latest-jobs/ssc-cgl-2026-notification' },
      ],
    });
  }

  // Debug helper: how many API calls the frontend has made this session.
  if (pathname === '/__stats') {
    return send(200, { requestCount, uptimeSeconds: Math.round(process.uptime()) });
  }

  const match = pathname.match(/^\/wp-json\/wp\/v2\/([a-z0-9-]+)$/);
  if (!match) {
    return send(404, { code: 'rest_no_route', message: 'No route was found matching the URL and request method.' });
  }

  const collection = COLLECTIONS[match[1]];
  if (!collection) {
    return send(404, { code: 'rest_no_route', message: `Unknown post type: ${match[1]}` });
  }

  const lang = searchParams.get('lang') === 'hi' ? 'hi' : 'en';
  let items = collection.map((item) =>
    lang === 'hi' && HI_TITLES[item.id]
      ? { ...item, title: { rendered: HI_TITLES[item.id] } }
      : item,
  );

  // ?slug=
  const slug = searchParams.get('slug');
  if (slug) items = items.filter((item) => item.slug === slug);

  // ?search=
  const search = searchParams.get('search');
  if (search) {
    const needle = search.toLowerCase();
    items = items.filter(
      (item) =>
        item.title.rendered.toLowerCase().includes(needle) ||
        (item.acf?.organization ?? '').toLowerCase().includes(needle),
    );
  }

  // ?organization= — WP matches on the term slug; we approximate with a
  // case-insensitive contains so a partial org name still filters.
  const organization = searchParams.get('organization');
  if (organization) {
    const needle = organization.toLowerCase();
    items = items.filter((item) => (item.acf?.organization ?? '').toLowerCase().includes(needle));
  }

  // ?_fields= — real WP returns only the requested top-level fields.
  const fields = searchParams.get('_fields');
  if (fields) {
    const keep = fields.split(',').map((f) => f.trim());
    items = items.map((item) => Object.fromEntries(Object.entries(item).filter(([k]) => keep.includes(k))));
  }

  const perPage = Math.min(Number(searchParams.get('per_page') || 10), 100);
  const page = Math.max(Number(searchParams.get('page') || 1), 1);
  const total = items.length;
  const totalPages = Math.max(Math.ceil(total / perPage), 1);
  const paged = items.slice((page - 1) * perPage, page * perPage);

  send(200, paged, {
    'X-WP-Total': String(total),
    'X-WP-TotalPages': String(totalPages),
  });
});

server.listen(PORT, '127.0.0.1', () => {
  const total = Object.values(COLLECTIONS).reduce((sum, c) => sum + c.length, 0);
  console.log(`[mock-wordpress] listening on http://127.0.0.1:${PORT}`);
  console.log(`[mock-wordpress] ${Object.keys(COLLECTIONS).length} post types, ${total} posts`);
  console.log(`[mock-wordpress] settings: http://127.0.0.1:${PORT}/wp-json/govjobs/v1/settings`);
  console.log(`[mock-wordpress] stats:    http://127.0.0.1:${PORT}/__stats`);
});
