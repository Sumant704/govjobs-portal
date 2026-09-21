import type { Lang } from '@/lib/types';

/**
 * Locale helpers.
 *
 * Note on numerals: `hi-IN` alone renders Devanagari digits (१४ जनवरी). Indian
 * job portals overwhelmingly keep Latin digits even on Hindi pages — dates get
 * scanned, and mixed scripts slow that down. So we force `-u-nu-latn`.
 */
const localeFor: Record<Lang, string> = {
  en: 'en-IN',
  hi: 'hi-IN-u-nu-latn',
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:T[\d:.]+Z?)?$/;

/** Formats an ISO date, or returns the input untouched if it is free text. */
export function formatDate(value: string | undefined, lang: Lang = 'en'): string {
  if (!value) return '';
  if (!ISO_DATE.test(value.trim())) return value;
  const d = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(localeFor[lang], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

export function formatDateLong(value: string | undefined, lang: Lang = 'en'): string {
  if (!value) return '';
  if (!ISO_DATE.test(value.trim())) return value;
  const d = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(localeFor[lang], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

export function toIsoDate(value: string | undefined): string | undefined {
  if (!value || !ISO_DATE.test(value.trim())) return undefined;
  return value.slice(0, 10);
}

const RELATIVE: Record<Lang, { today: string; d: string; m: string; y: string; ago: string }> = {
  en: { today: 'Today', d: 'd', m: 'mo', y: 'y', ago: 'ago' },
  hi: { today: 'आज', d: 'दिन', m: 'माह', y: 'वर्ष', ago: 'पहले' },
};

/** Compact relative age used on cards: "3d ago" / "3 दिन पहले". */
export function relativeTime(iso: string | undefined, lang: Lang = 'en'): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffDays = Math.floor((Date.now() - then) / 86_400_000);
  const r = RELATIVE[lang];
  if (diffDays <= 0) return r.today;
  if (diffDays < 30) return `${diffDays}${lang === 'en' ? r.d : ` ${r.d}`} ${r.ago}`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}${lang === 'en' ? r.m : ` ${r.m}`} ${r.ago}`;
  return `${Math.floor(diffDays / 365)}${lang === 'en' ? r.y : ` ${r.y}`} ${r.ago}`;
}

/** Days left until a deadline. Negative = passed. */
export function daysUntil(iso: string | undefined): number | null {
  if (!iso || !ISO_DATE.test(iso.trim())) return null;
  const target = new Date(`${iso.slice(0, 10)}T23:59:59Z`).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / 86_400_000);
}

export function stripHtml(html: string | undefined, max = 0): string {
  if (!html) return '';
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
  if (max > 0 && text.length > max) return `${text.slice(0, max).replace(/\s\S*$/, '')}…`;
  return text;
}

export function readingTime(html: string | undefined): number {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  // Hindi words are denser per character but slower to read; 180 wpm is a fair
  // middle ground for mixed Devanagari/Latin content.
  return Math.max(1, Math.round(words / 180));
}

/** Renders "₹ 100/-" style amounts the way Indian portals write them. */
export function formatAmount(amount: string): string {
  const trimmed = amount.trim();
  if (/^(0|free|nil|n\/a)$/i.test(trimmed) || /^₹?\s*0/.test(trimmed)) return 'Free';
  if (trimmed.startsWith('₹')) return trimmed;
  if (/^\d+$/.test(trimmed)) return `₹${trimmed}/-`;
  return trimmed;
}

export function isFree(amount: string): boolean {
  const trimmed = amount.trim();
  return /^(0|free|nil)$/i.test(trimmed) || /^₹?\s*0$/.test(trimmed);
}

/**
 * "5,208" — groups the Indian way (12,34,567).
 *
 * Only purely numeric input is formatted. Anything else is returned verbatim,
 * which matters because vacancy totals are free text in ACF and legitimately
 * contain values like "280+ Universities" or "25 Questions". Stripping
 * non-digits and formatting those would silently turn "280+ Universities" into
 * "280".
 */
export function formatNumber(value: string | number): string {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? new Intl.NumberFormat('en-IN').format(value) : String(value);
  }
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return value;
  return new Intl.NumberFormat('en-IN').format(Number(trimmed));
}

export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max).replace(/\s\S*$/, '')}…`;
}

/** Deterministic 32-bit hash — used for stable "related posts" without a DB. */
export function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
