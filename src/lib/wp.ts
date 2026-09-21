import type {
  AgeLimit,
  DateRow,
  FeeRow,
  FetchPostsArgs,
  GovPost,
  Lang,
  Paginated,
  PostSummary,
  PostTypeKey,
  SeoData,
  TermRef,
  VacancyRow,
} from '@/lib/types';
import { POST_TYPES, isPostTypeKey } from '@/lib/post-types';
import { snapshotPosts } from '@/content/snapshot';
import { isFree, stripHtml } from '@/lib/format';
import { readEnv, readSecret, readBool, readInt } from '@/lib/env';
import { SITE_DEFAULTS } from '@/lib/site';

/**
 * ---------------------------------------------------------------------------
 * WordPress data access layer
 * ---------------------------------------------------------------------------
 * This is the ONLY module that knows what a WordPress payload looks like.
 * Every page consumes the normalised `GovPost` / `PostSummary` shapes, so
 * swapping the transport (REST -> WPGraphQL, or WP -> a different CMS) is a
 * change confined to this file.
 *
 * Why REST and not WPGraphQL?
 *   REST is the default choice here. It needs no extra plugin, it maps 1:1 to
 *   WordPress' own caching (Redis/object cache), and every CDN understands
 *   query-string caching. GraphQL's advantage — one round trip for nested
 *   fields — matters most when you have dozens of relations per query. This
 *   portal has one relation that actually costs anything (featured media +
 *   terms), and `?_embed` resolves both in the same request. GraphQL would add
 *   a plugin, a schema to maintain, and a second cache layer to debug for
 *   little gain. `wordpress/README-SETUP.md` documents the migration if that
 *   trade-off ever changes.
 *
 * Resilience: if WordPress is unreachable (or WP_API_URL is unset), reads fall
 * back to the bundled snapshot in `src/content/snapshot.ts` and the site stays
 * up. `getContentSource()` reports which path served the last request so the
 * layout can show an honest "cached" banner.
 */

export type ContentSource = 'wordpress' | 'snapshot';

interface WpConfig {
  apiUrl: string;
  mode: 'rest' | 'graphql';
  auth?: string;
  cacheTtl: number;
  fallback: boolean;
}

function readConfig(): WpConfig {
  const user = readEnv('WP_APP_USER');
  const pass = readSecret('WP_APP_PASSWORD');

  return {
    apiUrl: readEnv('WP_API_URL').replace(/\/+$/, ''),
    mode: readEnv('WP_API_MODE') === 'graphql' ? 'graphql' : 'rest',
    auth: user && pass ? `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}` : undefined,
    cacheTtl: readInt('WP_CACHE_TTL', 90) * 1000,
    fallback: readBool('WP_FALLBACK_TO_SNAPSHOT', true),
  };
}

const config = readConfig();

/* -------------------------------------------------------------------------- */
/* Request-level state                                                        */
/* -------------------------------------------------------------------------- */

// `contentSource` is intentionally module-scoped: one Node process serves the
// site, and a stale banner for one request is harmless. It resets on restart.
let contentSource: ContentSource = config.apiUrl ? 'wordpress' : 'snapshot';
let lastWpError: string | null = null;

export function getContentSource(): ContentSource {
  return contentSource;
}

/**
 * True only when WordPress is configured but we served the snapshot anyway.
 *
 * The distinction matters for the UI: a site deliberately running on the
 * bundled snapshot (no `WP_API_URL`, e.g. local development or a demo) is not
 * degraded, and showing a "showing a cached snapshot" banner there is just
 * noise. The banner is for the case that actually needs explaining — the CMS
 * is supposed to be live and it isn't.
 */
export function isDegraded(): boolean {
  return contentSource === 'snapshot' && Boolean(config.apiUrl);
}

export function getLastWpError(): string | null {
  return lastWpError;
}

export function isWordPressConfigured(): boolean {
  return Boolean(config.apiUrl);
}

/* -------------------------------------------------------------------------- */
/* TTL cache                                                                  */
/* -------------------------------------------------------------------------- */

interface CacheEntry {
  value: unknown;
  expires: number;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

/**
 * In-memory TTL cache with request coalescing.
 *
 * Coalescing matters more than the TTL here: without it, 500 simultaneous
 * visitors hitting an uncached category page would each open a connection to
 * WordPress. With it, they share one.
 */
async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = loader()
    .then((value) => {
      cache.set(key, { value, expires: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

export function clearCache(prefix?: string): number {
  if (!prefix) {
    const n = cache.size;
    cache.clear();
    return n;
  }
  let n = 0;
  for (const key of cache.keys()) {
    if (key.includes(prefix)) {
      cache.delete(key);
      n++;
    }
  }
  return n;
}

export function cacheStats() {
  return { entries: cache.size, inflight: inflight.size, ttlMs: config.cacheTtl };
}

/* -------------------------------------------------------------------------- */
/* HTTP                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Fetch with a hard timeout, returning null instead of throwing.
 *
 * This is the only WordPress HTTP path in the module, and it deliberately
 * never throws: every caller has a snapshot fallback, and a thrown error
 * mid-render would take out the whole page. Failures are recorded in
 * `lastWpError` and surfaced through /api/health instead.
 */
async function tryWpFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<{ data: T | null; total: number; totalPages: number }> {
  try {
    const res = await fetch(buildUrl(path, params), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SarkariHub-Frontend/1.0 (+astro)',
        ...(config.auth ? { Authorization: config.auth } : {}),
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      lastWpError = `HTTP ${res.status} on ${path}`;
      return { data: null, total: 0, totalPages: 0 };
    }
    const data = (await res.json()) as T;
    lastWpError = null;
    return {
      data,
      total: Number(res.headers.get('x-wp-total') ?? 0),
      totalPages: Number(res.headers.get('x-wp-totalpages') ?? 0),
    };
  } catch (error) {
    lastWpError = error instanceof Error ? error.message : String(error);
    return { data: null, total: 0, totalPages: 0 };
  }
}

function buildUrl(path: string, params: Record<string, string | number | undefined>): string {
  const url = new URL(`${config.apiUrl}/wp-json/wp/v2${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '' && value !== null) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/* -------------------------------------------------------------------------- */
/* Normalisation                                                              */
/* -------------------------------------------------------------------------- */

/* eslint-disable @typescript-eslint/no-explicit-any */
type RawWp = Record<string, any>;

/** ACF returns `false` for empty repeaters and `''` for empty text. */
function acf(post: RawWp): RawWp {
  return (post.acf as RawWp) || {};
}

function text(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return fallback;
}

/** ACF file fields come back as an object, an ID, or a URL depending on settings. */
function fileUrl(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const obj = value as RawWp;
    return text(obj.url || obj.source_url || obj.guid);
  }
  return '';
}

function linkUrl(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return text((value as RawWp).url);
  return '';
}

function repeater(value: unknown): RawWp[] {
  return Array.isArray(value) ? (value as RawWp[]) : [];
}

function normaliseDates(raw: RawWp): DateRow[] {
  return repeater(raw).map((row) => ({
    label: text(row.label ?? row.event ?? row.title),
    value: text(row.date ?? row.value ?? row.day),
    emphasis: Boolean(row.emphasis ?? row.highlight),
  }));
}

function normaliseFees(raw: RawWp): FeeRow[] {
  return repeater(raw).map((row) => {
    const amount = text(row.amount ?? row.fee ?? row.value);
    return {
      category: text(row.category ?? row.label ?? row.post),
      amount,
      free: isFree(amount),
    };
  });
}

function normaliseAge(raw: RawWp): AgeLimit | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const min = text(raw.min);
  const max = text(raw.max);
  if (!min && !max) return undefined;
  return {
    min,
    max,
    asOn: text(raw.as_on ?? raw.asOn) || undefined,
    relaxation: text(raw.relaxation) || undefined,
  };
}

function normaliseVacancy(raw: RawWp, total: string): GovPost['vacancy'] {
  const rows: VacancyRow[] = repeater(raw).map((row) => ({
    post: text(row.post_name ?? row.post ?? row.name),
    posts: text(row.total_posts ?? row.posts ?? row.count),
    eligibility: text(row.eligibility) || undefined,
  }));
  if (!rows.length && !total) return undefined;
  return { total, rows };
}

function normaliseTerms(post: RawWp): TermRef[] {
  const terms: TermRef[] = [];
  const groups: [string, TermRef['taxonomy']][] = [
    ['category', 'category'],
    ['post_tag', 'post_tag'],
    ['job_state', 'job_state'],
    ['qualification', 'qualification'],
    ['organization', 'organization'],
  ];
  const embedded = post._embedded?.terms;
  for (const [key, taxonomy] of groups) {
    const list = Array.isArray(embedded?.[key]) ? embedded[key] : [];
    for (const term of list) {
      terms.push({
        id: Number(term.id ?? 0),
        name: text(term.name),
        slug: text(term.slug),
        taxonomy,
      });
    }
  }
  return terms;
}

function normaliseImage(post: RawWp): GovPost['featuredImage'] {
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  const sizes = media?.media_details?.sizes;
  // Prefer a mid-size source: the full-size upload is often 2000px+ and this
  // niche is dominated by mobile traffic on slow connections.
  const preferred = sizes?.medium_large ?? sizes?.large ?? sizes?.full;
  const url = text(preferred?.source_url || media?.source_url);
  if (!url) return undefined;
  return {
    url,
    alt: text(media?.alt_text) || text(post.title?.rendered),
    width: Number(preferred?.width ?? media?.media_details?.width ?? 1200),
    height: Number(preferred?.height ?? media?.media_details?.height ?? 675),
  };
}

function normaliseSeo(post: RawWp): SeoData {
  // Yoast exposes `yoast_head_json`; RankMath exposes `rank_math_*` on the
  // object itself. Read whichever is present, fall back to post fields.
  const yoast = post.yoast_head_json as RawWp | undefined;
  const title = text(yoast?.title) || text(post.title?.rendered);
  const description =
    text(yoast?.description) ||
    text(post.rank_math_description) ||
    stripHtml(text(post.excerpt?.rendered), 158);
  const ogImage =
    text(yoast?.og_image?.[0]?.url) || text(post.rank_math_og_image) || normaliseImage(post)?.url || '';
  const robots =
    text(yoast?.robots?.index) === 'noindex' || post.rank_math_robots?.includes?.('noindex')
      ? 'noindex, nofollow'
      : 'index, follow';

  return {
    title,
    description,
    canonical: text(yoast?.canonical) || text(post.link),
    ogImage: ogImage || undefined,
    robots,
    focusKeyword: text(yoast?.schema?.article?.keywords?.[0]) || undefined,
  };
}

function normalisePost(post: RawWp, lang: Lang, type: PostTypeKey): GovPost {
  const fields = acf(post);
  const title = text(post.title?.rendered);
  const vacancyTotal = text(fields.total_vacancies ?? fields.vacancy_total);

  return {
    id: Number(post.id ?? 0),
    slug: text(post.slug),
    type,
    lang,
    title,
    excerpt: text(fields.short_description) || stripHtml(text(post.excerpt?.rendered), 220),
    contentHtml: text(post.content?.rendered),
    organization: text(fields.organization),
    qualification: text(fields.qualification),
    jobLocation: text(fields.job_location),
    publishedAt: text(post.date_gmt ? `${post.date_gmt}Z` : post.date),
    modifiedAt: text(post.modified_gmt ? `${post.modified_gmt}Z` : post.modified),
    featuredImage: normaliseImage(post),
    importantDates: normaliseDates(fields.important_dates),
    applicationFee: normaliseFees(fields.application_fee),
    ageLimit: normaliseAge(fields.age_limit),
    vacancy: normaliseVacancy(fields.vacancy_details, vacancyTotal),
    officialWebsite: linkUrl(fields.official_website),
    notificationPdf: fileUrl(fields.notification_pdf),
    applyLink: linkUrl(fields.apply_online_link) || linkUrl(fields.official_website),
    howToApplyHtml: text(fields.how_to_apply),
    isFeatured: Boolean(fields.is_featured),
    terms: normaliseTerms(post),
    seo: normaliseSeo(post),
  };
}

function toSummary(post: GovPost): PostSummary {
  const lastDateRow = post.importantDates.find(
    (d) => /last date|अंतिम तिथि/i.test(d.label) && !/fee|शुल्क/i.test(d.label),
  );
  return {
    id: post.id,
    slug: post.slug,
    type: post.type,
    lang: post.lang,
    title: post.title,
    organization: post.organization,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    lastDate: lastDateRow?.value,
    totalVacancies: post.vacancy?.total,
    featuredImage: post.featuredImage,
    isFeatured: post.isFeatured,
  };
}

/* -------------------------------------------------------------------------- */
/* Snapshot-backed readers (fallback + demo mode)                             */
/* -------------------------------------------------------------------------- */

function snapshotQuery(args: FetchPostsArgs): Paginated<GovPost> {
  const lang = args.lang ?? 'en';
  const perPage = args.perPage ?? 10;
  const page = Math.max(1, args.page ?? 1);

  let items = snapshotPosts(lang);

  if (args.type) items = items.filter((p) => p.type === args.type);
  if (args.exclude) items = items.filter((p) => p.id !== args.exclude);
  if (args.organization) {
    const needle = args.organization.toLowerCase();
    items = items.filter((p) => p.organization.toLowerCase().includes(needle));
  }
  if (args.term) {
    const needle = args.term.toLowerCase();
    items = items.filter((p) =>
      p.terms.some((t) => t.slug.toLowerCase() === needle) || p.organization.toLowerCase().includes(needle),
    );
  }
  if (args.search) {
    const needle = args.search.toLowerCase();
    items = items.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        p.organization.toLowerCase().includes(needle) ||
        p.excerpt.toLowerCase().includes(needle) ||
        p.qualification.toLowerCase().includes(needle),
    );
  }

  if (args.orderBy === 'title') items.sort((a, b) => a.title.localeCompare(b.title));
  else if (args.orderBy === 'modified') items.sort((a, b) => Date.parse(b.modifiedAt) - Date.parse(a.modifiedAt));
  else items.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

  const total = items.length;
  const start = (page - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
    page,
    perPage,
  };
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Paginated listing. WordPress first, snapshot on failure.
 */
export async function getPosts(args: FetchPostsArgs = {}): Promise<Paginated<PostSummary>> {
  const lang = args.lang ?? 'en';
  const perPage = Math.min(args.perPage ?? 10, 100);
  const page = Math.max(1, args.page ?? 1);

  if (!config.apiUrl || config.mode === 'graphql') {
    contentSource = 'snapshot';
    return toSummaries(snapshotQuery({ ...args, lang, perPage, page }));
  }

  const typeConfig = args.type ? POST_TYPES[args.type] : undefined;
  const restBase = typeConfig?.restBase;
  const cacheKey = `list:${JSON.stringify({ ...args, lang, perPage, page })}`;

  const result = await cached(cacheKey, config.cacheTtl, async () => {
    if (restBase) {
      const { data, total, totalPages } = await tryWpFetch<RawWp[]>(`/${restBase}`, {
        per_page: perPage,
        page,
        _embed: 'wp:featuredmedia,terms',
        orderby: args.orderBy === 'title' ? 'title' : args.orderBy === 'modified' ? 'modified' : 'date',
        order: 'desc',
        search: args.search,
        organization: args.organization,
        ...(lang === 'hi' ? { lang: 'hi' } : {}),
        ...(args.exclude ? { exclude: args.exclude } : {}),
      });
      if (!data) return null;
      return {
        items: data.map((p) => toSummary(normalisePost(p, lang, args.type!))),
        total: total || data.length,
        totalPages: totalPages || 1,
        page,
        perPage,
      } satisfies Paginated<PostSummary>;
    }

    // Cross-type listing: WordPress REST has no "all custom post types" route,
    // so fan out over the post types in parallel and merge.
    const types = Object.values(POST_TYPES);
    const responses = await Promise.all(
      types.map((t) =>
        tryWpFetch<RawWp[]>(`/${t.restBase}`, {
          per_page: perPage,
          page,
          _embed: 'wp:featuredmedia,terms',
          orderby: 'date',
          order: 'desc',
          search: args.search,
          ...(lang === 'hi' ? { lang: 'hi' } : {}),
        }),
      ),
    );

    if (responses.every((r) => r.data === null)) return null;

    const merged = responses
      .flatMap((r, index) => (r.data ?? []).map((p) => toSummary(normalisePost(p, lang, types[index].key))))
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
      .slice(0, perPage);

    const total = responses.reduce((sum, r) => sum + r.total, 0);
    return {
      items: merged,
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
      page,
      perPage,
    } satisfies Paginated<PostSummary>;
  });

  if (result) {
    contentSource = 'wordpress';
    return result;
  }

  contentSource = 'snapshot';
  return toSummaries(snapshotQuery({ ...args, lang, perPage, page }));
}

function toSummaries(paginated: Paginated<GovPost>): Paginated<PostSummary> {
  return { ...paginated, items: paginated.items.map(toSummary) };
}

/** Single post by slug. Returns null when genuinely not found. */
export async function getPost(type: PostTypeKey, slug: string, lang: Lang = 'en'): Promise<GovPost | null> {
  const restBase = POST_TYPES[type].restBase;
  const cacheKey = `post:${type}:${slug}:${lang}`;

  if (config.apiUrl && config.mode === 'rest') {
    const found = await cached(cacheKey, config.cacheTtl, async () => {
      const { data } = await tryWpFetch<RawWp[]>(`/${restBase}`, {
        slug,
        per_page: 1,
        _embed: 'wp:featuredmedia,terms',
        ...(lang === 'hi' ? { lang: 'hi' } : {}),
      });
      if (!data?.length) return null;
      return normalisePost(data[0], lang, type);
    });

    if (found) {
      contentSource = 'wordpress';
      return found;
    }
  }

  contentSource = 'snapshot';
  const fallback = snapshotPosts(lang).find((p) => p.slug === slug && p.type === type);
  return fallback ?? null;
}

/** Full-text search across all post types. */
export async function searchPosts(query: string, lang: Lang = 'en', page = 1, perPage = 12): Promise<Paginated<PostSummary>> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { items: [], total: 0, totalPages: 1, page: 1, perPage };
  }
  return getPosts({ search: trimmed, lang, page, perPage });
}

/**
 * Related posts: same post type first, then anything sharing an organization.
 * Deliberately cheap — two lookups, no scoring model.
 */
export async function getRelated(post: GovPost, limit = 6): Promise<PostSummary[]> {
  const sameType = await getPosts({ type: post.type, lang: post.lang, perPage: limit + 1, exclude: post.id });
  const pool = [...sameType.items];

  if (pool.length < limit) {
    const sameOrg = await getPosts({
      lang: post.lang,
      perPage: limit,
      organization: post.organization,
      exclude: post.id,
    });
    for (const item of sameOrg.items) {
      if (pool.length >= limit) break;
      if (!pool.some((p) => p.id === item.id)) pool.push(item);
    }
  }

  return pool.slice(0, limit);
}

/** Latest N across every post type — powers the homepage and the ticker. */
export async function getLatest(lang: Lang = 'en', perType = 4): Promise<Record<PostTypeKey, PostSummary[]>> {
  const entries = await Promise.all(
    (Object.keys(POST_TYPES) as PostTypeKey[]).map(async (type) => {
      const { items } = await getPosts({ type, lang, perPage: perType });
      return [type, items] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<PostTypeKey, PostSummary[]>;
}

/**
 * Post counts per category, for the homepage tiles and search page.
 *
 * In WordPress mode this uses `per_page=1` and reads the `X-WP-Total` header —
 * one row of actual data per category instead of fetching every post just to
 * count them.
 */
export async function getCategoryCounts(lang: Lang = 'en'): Promise<Partial<Record<PostTypeKey, number>>> {
  const out: Partial<Record<PostTypeKey, number>> = {};

  await Promise.all(
    (Object.keys(POST_TYPES) as PostTypeKey[]).map(async (type) => {
      if (config.apiUrl && config.mode === 'rest') {
        const { total, data } = await tryWpFetch<RawWp[]>(`/${POST_TYPES[type].restBase}`, {
          per_page: 1,
          page: 1,
          _fields: 'id',
          ...(lang === 'hi' ? { lang: 'hi' } : {}),
        });
        if (data && total > 0) {
          out[type] = total;
          return;
        }
      }
      out[type] = snapshotQuery({ type, lang, perPage: 1 }).total;
    }),
  );

  return out;
}

/** Every slug+date pair, for the sitemap. */
export async function getAllForSitemap(
  lang: Lang = 'en',
): Promise<{ slug: string; type: PostTypeKey; modifiedAt: string }[]> {
  const out: { slug: string; type: PostTypeKey; modifiedAt: string }[] = [];

  if (config.apiUrl && config.mode === 'rest') {
    const responses = await Promise.all(
      (Object.keys(POST_TYPES) as PostTypeKey[]).map(async (type) => {
        const { data } = await tryWpFetch<RawWp[]>(`/${POST_TYPES[type].restBase}`, {
          per_page: 100,
          page: 1,
          _fields: 'slug,modified,date',
          orderby: 'modified',
          order: 'desc',
          ...(lang === 'hi' ? { lang: 'hi' } : {}),
        });
        return (data ?? []).map((p) => ({
          slug: text(p.slug),
          type,
          modifiedAt: text(p.modified),
        }));
      }),
    );
    for (const list of responses) out.push(...list);
    if (out.length) return out;
  }

  return snapshotPosts(lang).map((p) => ({ slug: p.slug, type: p.type, modifiedAt: p.modifiedAt }));
}

/**
 * Site settings. Tries the custom WordPress endpoint registered in
 * `wordpress/functions-snippets.php`, falls back to bundled defaults.
 */
export async function getSettings(lang: Lang = 'en') {
  const defaults = SITE_DEFAULTS[lang];
  if (!config.apiUrl) return defaults;

  const settings = await cached(`settings:${lang}`, 5 * 60 * 1000, async () => {
    try {
      const res = await fetch(`${config.apiUrl}/wp-json/govjobs/v1/settings?lang=${lang}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return null;
      return (await res.json()) as Partial<typeof defaults>;
    } catch {
      return null;
    }
  });

  return settings ? { ...defaults, ...settings } : defaults;
}

export { isPostTypeKey };
