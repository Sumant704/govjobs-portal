/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    /** Resolved per-request by src/middleware.ts. */
    settings: import('@/lib/types').SiteSettings;
    lang: import('@/lib/types').Lang;
    /** Canonical English path, used by the language switcher. */
    canonicalPath: string;
  }
}

interface ImportMetaEnv {
  readonly SITE_URL?: string;
  readonly WP_API_URL?: string;
  readonly WP_API_MODE?: 'rest' | 'graphql';
  readonly WP_APP_USER?: string;
  readonly WP_APP_PASSWORD?: string;
  readonly WP_CACHE_TTL?: string;
  readonly WP_FALLBACK_TO_SNAPSHOT?: string;
  readonly REVALIDATE_SECRET?: string;
  readonly PUBLIC_ADSENSE_CLIENT?: string;
  readonly PUBLIC_ADSENSE_ENABLED?: string;
  readonly PUBLIC_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
