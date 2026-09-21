import { defineMiddleware } from 'astro:middleware';
import { getSettings, getContentSource, clearCache } from '@/lib/wp';
import { langFromPath, stripLangPrefix } from '@/i18n/utils';

/**
 * Per-request middleware.
 *
 * Three jobs:
 *   1. Resolve the locale and canonical path once, so pages and the layout
 *      never have to guess (`Astro.url.pathname` is the prefixed one).
 *   2. Load site settings (WP-backed, cached) into `locals`.
 *   3. Set security + cache headers.
 *
 * Header choices worth explaining:
 *   - `Cache-Control: public, s-maxage, stale-while-revalidate` is what keeps
 *     WordPress alive on result day. Visitors hit the CDN/edge, not WP.
 *   - `Vary: Accept-Encoding` only. We deliberately do NOT vary on Cookie,
 *     because the theme is client-side; adding it would fragment the edge
 *     cache for every visitor.
 *   - `X-Robots-Tag` is not set globally; pages control robots via meta tags
 *     so the search page can be noindex without touching the middleware.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const lang = langFromPath(pathname);
  const canonicalPath = stripLangPrefix(pathname);

  context.locals.lang = lang;
  context.locals.canonicalPath = canonicalPath;
  context.locals.settings = await getSettings(lang);

  const response = await next();

  // --- Security -----------------------------------------------------------
  const headers = response.headers;
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  // HSTS is only meaningful over HTTPS; setting it on a plain-HTTP localhost
  // preview would break the browser for other localhost apps.
  if (context.url.protocol === 'https:') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // --- Caching ------------------------------------------------------------
  const contentType = headers.get('content-type') ?? '';
  if (contentType.includes('text/html')) {
    // Short edge TTL + long stale-while-revalidate. Content changes several
    // times a day, so a 5-minute fresh window is the right trade: a visitor
    // never waits on WordPress, and a published post is live within minutes
    // even if the webhook is missed.
    headers.set('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400');
    headers.set('Vary', 'Accept-Encoding');
  } else if (contentType.includes('application/json')) {
    headers.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=600');
  }

  // --- Revalidation side-channel -----------------------------------------
  // Surfaced so ops can confirm the frontend is reading from WordPress or has
  // fallen back to the bundled snapshot.
  headers.set('X-Content-Source', getContentSource());

  return response;
});

export { clearCache };
