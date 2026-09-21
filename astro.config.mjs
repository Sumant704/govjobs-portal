// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

/**
 * Deployment note
 * ---------------
 * `output: 'server'` + the Node adapter is used here so the site can run
 * anywhere (VPS / Docker / PM2) AND so every page is rendered on-demand with a
 * short edge cache — which is what this niche needs, because exam results and
 * admit cards change several times a day.
 *
 * Swapping hosts is a two-line change:
 *   Vercel  ->  import vercel from '@astrojs/vercel';  adapter: vercel()
 *   Netlify ->  import netlify from '@astrojs/netlify'; adapter: netlify()
 */
export default defineConfig({
  site: process.env.SITE_URL || 'https://example-govjobs.com',
  output: 'server',
  adapter: node({ mode: 'standalone' }),

  // Hindi is served under /hi/ (see src/i18n + src/pages/hi).
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'hi'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },

  vite: {
    // @ts-expect-error — Astro and Tailwind bundle slightly different copies of
    // Vite's `PluginOption` type. The plugin itself is compatible; only the
    // nominal type differs, so the assignment cannot be expressed structurally.
    plugins: [tailwindcss()],
  },

  build: {
    // 'auto' (Astro's default) keeps the stylesheet external, so it caches
    // across pages.
    //
    // Measured both ways with Lighthouse (mobile, throttled):
    //     'auto'    homepage Performance 96   HTML  98 KB
    //     'always'  homepage Performance 95   HTML 152 KB
    //
    // Inlining removes the render-blocking request but adds ~50 KB to every
    // page. On a throttled connection those roughly cancel out, and 'auto'
    // wins for any visitor who reads more than one page. Revisit only if
    // traffic turns out to be overwhelmingly single-page.
    inlineStylesheets: 'auto',
  },

  compressHTML: true,

  security: {
    /**
     * Astro 5 enables `checkOrigin` by default on server output, which rejects
     * any POST whose Origin header does not match the Host. That is the right
     * default for cookie-authenticated forms — and this site has none. It
     * breaks exactly one thing: the WordPress revalidation webhook, which is
     * a server-to-server call with no Origin header at all.
     *
     * Turning it off is safe here because /api/revalidate is authenticated by
     * a shared secret compared in constant-ish fashion, not by a session
     * cookie, so there is no CSRF surface to protect. If you ever add a
     * cookie-authenticated form, re-enable this and give the webhook its own
     * route with the check disabled.
     */
    checkOrigin: false,
  },

  server: {
    host: true,
    port: 4321,
  },
});
