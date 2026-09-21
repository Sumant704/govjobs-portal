import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ site, url }) => {
  const origin = (site?.toString() ?? url.origin).replace(/\/$/, '');

  const body = `# robots.txt — ${origin}
User-agent: *

# Internal endpoints carry no content worth indexing.
Disallow: /api/

# Search result pages are infinite and query-driven; crawling them wastes
# budget and produces near-duplicate pages.
Disallow: /search
Disallow: /hi/search

# Paginated archives past page 1 are crawl traps on a daily-updated site.
Allow: /$
Disallow: /*?page=
Disallow: /*?s=
Disallow: /*?q=

# Ad and tracker scripts are not content.
Disallow: /go/

# Aggressive SEO crawlers that hammer daily-update sites. Blocking these does
# not hurt ranking; they are not search engines.
User-agent: AhrefsBot
Disallow: /
User-agent: SemrushBot
Disallow: /
User-agent: MJ12bot
Disallow: /
User-agent: DotBot
Disallow: /

Sitemap: ${origin}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=86400',
    },
  });
};
