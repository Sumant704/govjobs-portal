import type { SiteSettings } from '@/lib/types';

/**
 * Site-level settings.
 *
 * In production these are served by WordPress from a small custom REST
 * endpoint (`/wp-json/govjobs/v1/settings`, registered in
 * `wordpress/functions-snippets.php`) so an admin can edit the ticker and
 * contact details without a deploy. These values are the fallback used when
 * that endpoint is unavailable.
 */
export const SITE_DEFAULTS: Record<'en' | 'hi', SiteSettings> = {
  en: {
    name: 'SarkariHub',
    tagline: 'Government Jobs, Results & Admit Cards',
    notices: [
      { text: 'SSC CGL 2026 — online application window is now open', href: '/latest-jobs/ssc-cgl-2026-notification' },
      { text: 'RRB NTPC 2026 last date extended to 26 March', href: '/notification/rrb-ntpc-2026-application-date-extension' },
      { text: 'SSC MTS 2026 admit card released — download now', href: '/admit-card/ssc-mts-havaldar-2026-admit-card' },
      { text: 'UP Police Constable 2026 — 60,244 vacancies notified', href: '/latest-jobs/up-police-constable-2026' },
    ],
    contactEmail: 'support@sarkarihub.example',
    contactPhone: '+91 00000 00000',
    address: 'New Delhi, India',
  },
  hi: {
    name: 'सरकारीहब',
    tagline: 'सरकारी नौकरी, रिजल्ट और एडमिट कार्ड',
    notices: [
      { text: 'एसएससी सीजीएल 2026 — ऑनलाइन आवेदन शुरू', href: '/hi/latest-jobs/ssc-cgl-2026-notification' },
      { text: 'आरआरबी एनटीपीसी 2026 अंतिम तिथि 26 मार्च तक बढ़ी', href: '/hi/notification/rrb-ntpc-2026-application-date-extension' },
      { text: 'एसएससी एमटीएस 2026 एडमिट कार्ड जारी — अभी डाउनलोड करें', href: '/hi/admit-card/ssc-mts-havaldar-2026-admit-card' },
      { text: 'यूपी पुलिस कांस्टेबल 2026 — 60,244 रिक्तियां घोषित', href: '/hi/latest-jobs/up-police-constable-2026' },
    ],
    contactEmail: 'support@sarkarihub.example',
    contactPhone: '+91 00000 00000',
    address: 'नई दिल्ली, भारत',
  },
};

/** Homepage hero counters. In production, computed from WP term counts. */
export const SITE_STATS = [
  { key: 'statJobs' as const, value: '18,420' },
  { key: 'statResults' as const, value: '7,936' },
  { key: 'statAdmit' as const, value: '5,214' },
  { key: 'statCandidates' as const, value: '2.4 Cr' },
];

export const SITE = {
  name: 'SarkariHub',
  localeDefault: 'en' as const,
  twitter: '@sarkarihub',
};
