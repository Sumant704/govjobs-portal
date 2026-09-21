import type { Lang, PostTypeKey } from '@/lib/types';

/**
 * Post-type registry.
 *
 * `restBase` must match the `rest_base` you set in Custom Post Type UI.
 * Adding a new category later = add one entry here + one ACF field group +
 * one line in the WP CPT UI screen. No page files to write: `[type].astro`
 * and `[type]/[slug].astro` are generic.
 */
export interface PostTypeConfig {
  key: PostTypeKey;
  restBase: string;
  /** wp-admin display name, for docs/SEO breadcrumbs. */
  label: Record<Lang, string>;
  labelSingular: Record<Lang, string>;
  /** Short label for nav pills / tiles. */
  short: Record<Lang, string>;
  slug: string;
  /** Accent colour token used by tiles + badges. */
  accent: string;
  icon: string;
  description: Record<Lang, string>;
}

export const POST_TYPES: Record<PostTypeKey, PostTypeConfig> = {
  jobs: {
    key: 'jobs',
    restBase: 'jobs',
    slug: 'latest-jobs',
    label: { en: 'Latest Jobs', hi: 'नवीनतम नौकरियां' },
    labelSingular: { en: 'Job', hi: 'नौकरी' },
    short: { en: 'Jobs', hi: 'नौकरियां' },
    accent: 'brand',
    icon: 'briefcase',
    description: {
      en: 'Newest government job notifications with vacancy counts, eligibility, fees and last dates.',
      hi: 'रिक्तियों, पात्रता, शुल्क और अंतिम तिथि के साथ नवीनतम सरकारी नौकरी सूचनाएं।',
    },
  },
  results: {
    key: 'results',
    restBase: 'results',
    slug: 'results',
    label: { en: 'Results', hi: 'रिजल्ट' },
    labelSingular: { en: 'Result', hi: 'रिजल्ट' },
    short: { en: 'Results', hi: 'रिजल्ट' },
    accent: 'ok',
    icon: 'trophy',
    description: {
      en: 'Latest exam results, merit lists, cut-off marks and scorecards.',
      hi: 'नवीनतम परीक्षा परिणाम, मेरिट लिस्ट, कट-ऑफ अंक और स्कोरकार्ड।',
    },
  },
  'admit-card': {
    key: 'admit-card',
    restBase: 'admit-card',
    slug: 'admit-card',
    label: { en: 'Admit Card', hi: 'एडमिट कार्ड' },
    labelSingular: { en: 'Admit Card', hi: 'एडमिट कार्ड' },
    short: { en: 'Admit Card', hi: 'एडमिट कार्ड' },
    accent: 'accent',
    icon: 'ticket',
    description: {
      en: 'Download hall tickets, call letters and exam city intimation slips.',
      hi: 'हॉल टिकट, कॉल लेटर और परीक्षा शहर सूचना पर्ची डाउनलोड करें।',
    },
  },
  'answer-key': {
    key: 'answer-key',
    restBase: 'answer-key',
    slug: 'answer-key',
    label: { en: 'Answer Key', hi: 'उत्तर कुंजी' },
    labelSingular: { en: 'Answer Key', hi: 'उत्तर कुंजी' },
    short: { en: 'Answer Key', hi: 'उत्तर कुंजी' },
    accent: 'violet',
    icon: 'key',
    description: {
      en: 'Official and provisional answer keys, response sheets and objection windows.',
      hi: 'आधिकारिक और अस्थायी उत्तर कुंजी, रिस्पॉन्स शीट और आपत्ति विंडो।',
    },
  },
  syllabus: {
    key: 'syllabus',
    restBase: 'syllabus',
    slug: 'syllabus',
    label: { en: 'Syllabus', hi: 'सिलेबस' },
    labelSingular: { en: 'Syllabus', hi: 'सिलेबस' },
    short: { en: 'Syllabus', hi: 'सिलेबस' },
    accent: 'cyan',
    icon: 'book',
    description: {
      en: 'Exam patterns, subject-wise syllabus and previous year papers.',
      hi: 'परीक्षा पैटर्न, विषय-वार सिलेबस और पिछले वर्ष के प्रश्न पत्र।',
    },
  },
  admission: {
    key: 'admission',
    restBase: 'admission',
    slug: 'admission',
    label: { en: 'Admission', hi: 'एडमिशन' },
    labelSingular: { en: 'Admission', hi: 'प्रवेश' },
    short: { en: 'Admission', hi: 'एडमिशन' },
    accent: 'rose',
    icon: 'cap',
    description: {
      en: 'University, polytechnic and entrance exam admission notifications.',
      hi: 'विश्वविद्यालय, पॉलिटेक्निक और प्रवेश परीक्षा की प्रवेश सूचनाएं।',
    },
  },
  notification: {
    key: 'notification',
    restBase: 'notification',
    slug: 'notification',
    label: { en: 'Notifications', hi: 'सूचनाएं' },
    labelSingular: { en: 'Notification', hi: 'सूचना' },
    short: { en: 'Notice', hi: 'सूचना' },
    accent: 'amber',
    icon: 'megaphone',
    description: {
      en: 'Corrigendums, date extensions, exam schedule changes and official circulars.',
      hi: 'शोधन, तिथि विस्तार, परीक्षा कार्यक्रम में बदलाव और आधिकारिक परिपत्र।',
    },
  },
};

export const POST_TYPE_KEYS = Object.keys(POST_TYPES) as PostTypeKey[];

/** Order used for the homepage grid and the primary navigation. */
export const NAV_ORDER: PostTypeKey[] = [
  'jobs',
  'results',
  'admit-card',
  'answer-key',
  'syllabus',
  'admission',
];

/** Accepts both the URL segment (`latest-jobs`) and the REST base (`jobs`). */
export function resolvePostType(segment: string): PostTypeConfig | undefined {
  const needle = segment.toLowerCase();
  return (
    POST_TYPES[needle as PostTypeKey] ??
    Object.values(POST_TYPES).find((t) => t.slug === needle || t.restBase === needle)
  );
}

export function isPostTypeKey(value: string): value is PostTypeKey {
  return value in POST_TYPES;
}

/** Canonical path for a category listing, locale-aware. */
export function categoryPath(type: PostTypeKey, lang: Lang): string {
  const base = `/${POST_TYPES[type].slug}`;
  return lang === 'hi' ? `/hi${base}` : base;
}

/** Canonical path for a single post, locale-aware. */
export function postPath(type: PostTypeKey, slug: string, lang: Lang): string {
  return `${categoryPath(type, lang)}/${slug}`;
}
