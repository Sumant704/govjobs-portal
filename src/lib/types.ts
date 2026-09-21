/**
 * Domain types for the portal.
 *
 * These mirror the shape we normalise WordPress into. The Astro pages never
 * touch raw WP payloads — `src/lib/wp.ts` is the only place that knows what a
 * `_embedded['wp:featuredmedia']` looks like. That keeps the swap from
 * REST -> WPGraphQL to a single file.
 */

export type Lang = 'en' | 'hi';

export type PostTypeKey =
  | 'jobs'
  | 'results'
  | 'admit-card'
  | 'answer-key'
  | 'syllabus'
  | 'admission'
  | 'notification';

/** A single row of the "Important Dates" table. */
export interface DateRow {
  label: string;
  value: string;
  /** ISO date when the value is machine-parseable; used for schema.org. */
  iso?: string;
  /** Highlights the row (e.g. "Last Date for Apply Online"). */
  emphasis?: boolean;
}

/** A single row of the "Application Fee" table. */
export interface FeeRow {
  category: string;
  amount: string;
  /** true when the amount is ₹0 / Free — rendered as a green pill. */
  free?: boolean;
}

export interface AgeLimit {
  min: string;
  max: string;
  /** "as on 01/01/2026" */
  asOn?: string;
  relaxation?: string;
}

export interface VacancyRow {
  post: string;
  posts: string;
  eligibility?: string;
}

export interface Vacancy {
  total: string;
  rows: VacancyRow[];
}

export interface FeaturedImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface TermRef {
  id: number;
  name: string;
  slug: string;
  taxonomy: 'category' | 'post_tag' | 'job_state' | 'qualification' | 'organization';
}

export interface SeoData {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  robots: string;
  /** Yoast/RankMath focus keyword — used for related-post matching. */
  focusKeyword?: string;
}

export interface GovPost {
  id: number;
  slug: string;
  type: PostTypeKey;
  lang: Lang;

  title: string;
  excerpt: string;
  contentHtml: string;

  organization: string;
  qualification: string;
  jobLocation: string;

  publishedAt: string;
  modifiedAt: string;

  featuredImage?: FeaturedImage;

  importantDates: DateRow[];
  applicationFee: FeeRow[];
  ageLimit?: AgeLimit;
  vacancy?: Vacancy;

  officialWebsite: string;
  notificationPdf: string;
  applyLink: string;
  howToApplyHtml: string;

  isFeatured: boolean;
  terms: TermRef[];

  seo: SeoData;
}

/** Lightweight projection used by listing pages and the search index. */
export interface PostSummary {
  id: number;
  slug: string;
  type: PostTypeKey;
  lang: Lang;
  title: string;
  organization: string;
  excerpt: string;
  publishedAt: string;
  lastDate?: string;
  totalVacancies?: string;
  featuredImage?: FeaturedImage;
  isFeatured: boolean;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  totalPages: number;
  page: number;
  perPage: number;
}

export interface FetchPostsArgs {
  type?: PostTypeKey;
  lang?: Lang;
  page?: number;
  perPage?: number;
  search?: string;
  /** Restrict to posts carrying this term slug in any taxonomy. */
  term?: string;
  organization?: string;
  exclude?: number;
  orderBy?: 'date' | 'modified' | 'title';
}

export interface SiteSettings {
  name: string;
  tagline: string;
  /** Notice/marquee items rendered in the top ticker. */
  notices: { text: string; href: string }[];
  contactEmail: string;
  contactPhone: string;
  address: string;
}
