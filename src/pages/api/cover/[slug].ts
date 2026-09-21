import type { APIRoute } from 'astro';
import { hash } from '@/lib/format';

export const prerender = false;

/**
 * Deterministic placeholder cover image.
 *
 * Why this exists: the snapshot content has no WordPress media library behind
 * it, and shipping a site where every card has a broken image is worse than
 * shipping one with an obviously-generated cover. The gradient is derived from
 * a hash of the slug, so a given post always gets the same cover — the grid
 * looks designed rather than random, and nothing flickers between renders.
 *
 * In production the real `featuredImage` from WordPress is used and this route
 * is never requested. It is safe to delete once every post has media.
 */

const PALETTES: [string, string][] = [
  ['#1d4ed8', '#7c3aed'],
  ['#0e7490', '#1d4ed8'],
  ['#15803d', '#0e7490'],
  ['#b45309', '#d94f04'],
  ['#be123c', '#7c3aed'],
  ['#6d28d9', '#1d4ed8'],
  ['#0f766e', '#65a30d'],
  ['#c2410c', '#be123c'],
];

/** Strip anything that is not a slug character — this string lands in SVG. */
function sanitize(value: string): string {
  return value.replace(/[^a-z0-9-]/gi, '').slice(0, 60);
}

function initials(label: string): string {
  const words = label.split(/[-_\s]+/).filter(Boolean);
  const letters = words.slice(0, 3).map((w) => w[0]?.toUpperCase() ?? '');
  return letters.join('') || 'IN';
}

export const GET: APIRoute = ({ params, url }) => {
  const raw = params.slug ?? 'post';
  const slug = sanitize(raw);
  const label = url.searchParams.get('label') ?? slug.replace(/-/g, ' ');

  const seed = hash(slug || 'post');
  const [from, to] = PALETTES[seed % PALETTES.length];
  const angle = 100 + (seed % 60);

  const mark = initials(label).slice(0, 3);
  // Text is escaped because `label` is attacker-controllable via the query.
  const safeMark = mark.replace(/[<>&"']/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="${safeMark}">
  <defs>
    <linearGradient id="g" gradientTransform="rotate(${angle})">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <circle cx="1050" cy="110" r="220" fill="rgba(255,255,255,0.09)"/>
  <circle cx="140" cy="560" r="180" fill="rgba(255,255,255,0.07)"/>
  <text x="80" y="360" font-family="Inter, Segoe UI, system-ui, sans-serif" font-size="210" font-weight="800" fill="rgba(255,255,255,0.95)" letter-spacing="-6">${safeMark}</text>
  <text x="80" y="470" font-family="Inter, Segoe UI, system-ui, sans-serif" font-size="34" font-weight="600" fill="rgba(255,255,255,0.72)" letter-spacing="2">GOVERNMENT JOB PORTAL</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // Immutable: the same slug always produces the same image.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
