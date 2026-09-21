import type { APIRoute } from 'astro';
import { clearCache, cacheStats } from '@/lib/wp';
import { isPostTypeKey } from '@/lib/post-types';
import { readEnv, readSecret } from '@/lib/env';

export const prerender = false;

/**
 * ---------------------------------------------------------------------------
 * Revalidation webhook
 * ---------------------------------------------------------------------------
 * WordPress (via the WP Webhooks plugin, or the snippet in
 * `wordpress/functions-snippets.php`) POSTs here whenever a post is published,
 * updated, trashed or unpublished.
 *
 * What it does, in order:
 *   1. Verifies the shared secret.
 *   2. Drops the affected entries from the in-memory TTL cache.
 *   3. Optionally triggers a host deploy hook / CDN purge so the edge copy is
 *      replaced rather than waiting out `stale-while-revalidate`.
 *
 * Why not a full static rebuild? Because a rebuild takes minutes and this
 * content changes several times an hour during exam season. Targeted cache
 * invalidation makes an edit visible in seconds.
 *
 * Expected payload (all fields optional — the handler is defensive because
 * different webhook plugins send different shapes):
 *   { "post_id": 123, "post_type": "jobs", "slug": "ssc-cgl-2026",
 *     "action": "publish" }
 */

interface WebhookPayload {
  post_id?: number | string;
  post_type?: string;
  slug?: string;
  action?: string;
  /** Some plugins nest the post object. */
  post?: { post_type?: string; post_name?: string; ID?: number | string };
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

async function readPayload(request: Request): Promise<WebhookPayload> {
  const contentType = request.headers.get('content-type') ?? '';
  try {
    if (contentType.includes('application/json')) {
      return (await request.json()) as WebhookPayload;
    }
    // WP Webhooks and many others post form-encoded by default.
    const form = await request.formData();
    return Object.fromEntries(form.entries()) as WebhookPayload;
  } catch {
    return {};
  }
}

export const POST: APIRoute = async ({ request }) => {
  // Runtime-only read: see src/lib/env.ts. Reading this via `import.meta.env`
  // causes Vite to bake the secret into the build output as a plaintext
  // literal, which is exactly what `readSecret` prevents.
  const expected = readSecret('REVALIDATE_SECRET');

  if (!expected) {
    return json(
      {
        ok: false,
        error: 'REVALIDATE_SECRET is not configured on the frontend.',
        hint: 'Set REVALIDATE_SECRET in .env and send the same value in the x-revalidate-secret header.',
      },
      500,
    );
  }

  // Accept the secret from a header (preferred) or the body (fallback, because
  // some plugins cannot set custom headers).
  const headerSecret = request.headers.get('x-revalidate-secret');
  const payload = await readPayload(request);
  const bodySecret = (payload as Record<string, unknown>).secret;

  if (headerSecret !== expected && bodySecret !== expected) {
    return json({ ok: false, error: 'Unauthorised — bad or missing secret.' }, 401);
  }

  const postType = payload.post_type ?? payload.post?.post_type ?? '';
  const slug = payload.slug ?? payload.post?.post_name ?? '';
  const postId = payload.post_id ?? payload.post?.ID ?? '';

  // Targeted when we can be, wholesale when we cannot. A full flush is cheap
  // here (in-memory, rebuilt on next request) and never serves stale data,
  // which is the failure mode that actually matters.
  const targets: string[] = [];
  if (isPostTypeKey(postType) && slug) {
    targets.push(`post:${postType}:${slug}`);
    targets.push(`list:`);
  } else if (isPostTypeKey(postType)) {
    targets.push(`list:`);
    targets.push(`post:${postType}:`);
  }

  let cleared = 0;
  if (targets.length === 0) {
    cleared = clearCache();
  } else {
    for (const target of new Set(targets)) cleared += clearCache(target);
  }

  // --- Optional host / CDN purge -----------------------------------------
  const deployHook = readEnv('DEPLOY_HOOK_URL');
  const cdnPurge = readEnv('CDN_PURGE_URL');
  const actions: string[] = [];

  if (deployHook) {
    try {
      await fetch(deployHook, { method: 'POST', signal: AbortSignal.timeout(8000) });
      actions.push('deploy-hook');
    } catch (error) {
      actions.push(`deploy-hook-failed: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }

  if (cdnPurge) {
    try {
      await fetch(cdnPurge, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.CDN_PURGE_TOKEN ? { Authorization: `Bearer ${process.env.CDN_PURGE_TOKEN}` } : {}),
        },
        body: JSON.stringify({ paths: ['/*'] }),
        signal: AbortSignal.timeout(8000),
      });
      actions.push('cdn-purge');
    } catch (error) {
      actions.push(`cdn-purge-failed: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }

  return json({
    ok: true,
    action: payload.action ?? 'unknown',
    postType: postType || null,
    slug: slug || null,
    postId: postId || null,
    cacheEntriesCleared: cleared,
    cacheRemaining: cacheStats().entries,
    downstream: actions.length ? actions : ['none configured'],
    note: targets.length
      ? 'Targeted invalidation applied.'
      : 'Could not identify the post type — full cache flush applied.',
  });
};

/** Lets ops confirm the endpoint is reachable without sending a secret. */
export const GET: APIRoute = () =>
  json({
    ok: true,
    endpoint: 'revalidate',
    method: 'POST',
    headers: ['x-revalidate-secret'],
    accepts: ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'],
  });
