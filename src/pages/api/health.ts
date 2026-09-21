import type { APIRoute } from 'astro';
import { clearCache, cacheStats, getContentSource, isWordPressConfigured, getLastWpError } from '@/lib/wp';
import { readSecret } from '@/lib/env';

export const prerender = false;

/**
 * Health / observability endpoint.
 *
 * `source` tells you whether the site is reading from WordPress or has fallen
 * back to the bundled snapshot. `lastError` is the reason for the fallback.
 * Both matter during result-day incidents, when "the site looks fine" and "the
 * site is serving three-week-old content" look identical from the outside.
 */
export const GET: APIRoute = async () => {
  const source = getContentSource();
  const stats = cacheStats();

  const payload = {
    status: 'ok',
    source,
    wordpressConfigured: isWordPressConfigured(),
    lastWordPressError: getLastWpError(),
    cache: { entries: stats.entries, inflight: stats.inflight, ttlMs: stats.ttlMs },
    degraded: source === 'snapshot' && isWordPressConfigured(),
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};

/**
 * Manual cache flush. Same secret as the revalidation webhook, so an operator
 * can force a refresh without waiting for the TTL.
 */
export const POST: APIRoute = async ({ request }) => {
  const secret = request.headers.get('x-revalidate-secret');
  const expected = readSecret('REVALIDATE_SECRET');

  if (!expected) {
    return new Response(JSON.stringify({ ok: false, error: 'REVALIDATE_SECRET is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (secret !== expected) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorised' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const cleared = clearCache();
  return new Response(JSON.stringify({ ok: true, cleared }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
