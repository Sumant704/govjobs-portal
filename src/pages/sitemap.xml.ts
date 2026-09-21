import type { APIRoute } from 'astro';
import { POST_TYPES, NAV_ORDER, POST_TYPE_KEYS, postPath } from '@/lib/post-types';
import { getAllForSitemap } from '@/lib/wp';
import { localizePath, alternatesFor } from '@/i18n/utils';
import type { Lang } from '@/lib/types';

export const prerender = false;

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);

interface Entry {
  /** Canonical English path. */
  path: string;
  lastmod: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: string;
}

/**
 * Sitemap with hreflang alternates.
 *
 * Every entry lists all three language variants (en-IN, hi-IN, x-default)
 * pointing at the same canonical path. This is the only reliable way to tell
 * Google that /hi/results and /results are translations rather than duplicates
 * — the `<link rel="alternate">` tags in the head help, but the sitemap is
 * what gets crawled first.
 */
export const GET: APIRoute = async ({ site, url }) => {
  const origin = (site?.toString() ?? url.origin).replace(/\/$/, '');

  const entries: Entry[] = [
    { path: '/', lastmod: new Date().toISOString(), changefreq: 'daily', priority: '1.0' },
  ];

  for (const key of NAV_ORDER) {
    entries.push({
      path: `/${POST_TYPES[key].slug}`,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: '0.9',
    });
  }
  entries.push({
    path: `/${POST_TYPES.notification.slug}`,
    lastmod: new Date().toISOString(),
    changefreq: 'daily',
    priority: '0.8',
  });

  for (const page of ['about', 'contact', 'privacy-policy', 'disclaimer', 'terms']) {
    entries.push({ path: `/${page}`, lastmod: '2026-04-01T00:00:00Z', changefreq: 'monthly', priority: '0.3' });
  }

  // Posts: fetched once per locale so a post that exists only in Hindi still
  // appears, and lastmod reflects real editorial activity.
  const langs: Lang[] = ['en', 'hi'];
  const seen = new Map<string, { type: string; modifiedAt: string }>();

  for (const lang of langs) {
    for (const item of await getAllForSitemap(lang)) {
      const key = `${item.type}/${item.slug}`;
      const existing = seen.get(key);
      if (!existing || Date.parse(item.modifiedAt) > Date.parse(existing.modifiedAt)) {
        seen.set(key, { type: item.type, modifiedAt: item.modifiedAt });
      }
    }
  }

  for (const [key, value] of seen) {
    const [type, slug] = key.split('/') as [keyof typeof POST_TYPES, string];
    if (!POST_TYPE_KEYS.includes(type)) continue;
    entries.push({
      path: postPath(type, slug, 'en'),
      lastmod: new Date(value.modifiedAt).toISOString(),
      changefreq: 'weekly',
      priority: '0.8',
    });
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries
  .map((entry) => {
    const alternates = alternatesFor(entry.path, origin)
      .map(
        (alt) =>
          `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${escapeXml(alt.href)}"/>`,
      )
      .join('\n');
    return `  <url>
    <loc>${escapeXml(`${origin}${localizePath(entry.path, 'en')}`)}</loc>
${alternates}
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
};
