import { ui, type UIKey, type UIStrings } from '@/i18n/ui';
import type { Lang } from '@/lib/types';

export const LANGS: Lang[] = ['en', 'hi'];
export const DEFAULT_LANG: Lang = 'en';

export function isLang(value: string | undefined | null): value is Lang {
  return value === 'en' || value === 'hi';
}

/** Translator factory — `const t = useTranslations(lang); t('navHome')`. */
export function useTranslations(lang: Lang) {
  return function t(key: UIKey): string {
    return ui[lang][key] ?? ui.en[key] ?? String(key);
  };
}

export function stringsFor(lang: Lang): UIStrings {
  return ui[lang];
}

/**
 * The language currently being rendered, derived from the request path.
 * `/hi/jobs/ssc-cgl` -> 'hi';  `/jobs/ssc-cgl` -> 'en'.
 */
export function langFromPath(pathname: string): Lang {
  return pathname === '/hi' || pathname.startsWith('/hi/') ? 'hi' : 'en';
}

/**
 * Prefix a canonical (English) path for the given locale.
 *   localizePath('/results', 'hi') -> '/hi/results'
 */
export function localizePath(path: string, lang: Lang): string {
  const clean = path === '/' ? '' : path.replace(/^\/+|\/+$/g, '');
  const withSlash = clean ? `/${clean}` : '/';
  if (lang === 'en') return withSlash;
  return withSlash === '/' ? '/hi' : `/hi${withSlash}`;
}

/**
 * Strip the locale prefix to get the canonical (English) path.
 *   '/hi/results/x' -> '/results/x'
 */
export function stripLangPrefix(pathname: string): string {
  if (pathname === '/hi') return '/';
  if (pathname.startsWith('/hi/')) return pathname.slice(3);
  return pathname;
}

/**
 * hreflang alternates for a canonical path. Also returns x-default.
 */
export function alternatesFor(
  canonicalPath: string,
  siteUrl: string,
): { hreflang: string; href: string }[] {
  const origin = siteUrl.replace(/\/$/, '');
  return [
    { hreflang: 'en-IN', href: `${origin}${localizePath(canonicalPath, 'en')}` },
    { hreflang: 'hi-IN', href: `${origin}${localizePath(canonicalPath, 'hi')}` },
    { hreflang: 'x-default', href: `${origin}${localizePath(canonicalPath, 'en')}` },
  ];
}

export const htmlLang: Record<Lang, string> = { en: 'en-IN', hi: 'hi-IN' };
export const ogLocale: Record<Lang, string> = { en: 'en_IN', hi: 'hi_IN' };
