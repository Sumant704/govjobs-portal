import type { Lang } from '@/lib/types';

/**
 * UI string dictionary. Content itself comes from WordPress (Polylang /
 * WPML `?lang=` param) — this file only covers chrome: nav, table headers,
 * buttons, empty states, form labels.
 */
const en = {
  brandTagline: 'Govt Jobs · Results · Admit Cards',
  navHome: 'Home',
  navSearch: 'Search',
  navMore: 'More',
  langName: 'English',
  langSwitchTo: 'हिंदी',
  langSwitchLabel: 'Switch to Hindi',

  themeToggle: 'Toggle theme',
  themeLight: 'Light',
  themeDark: 'Dark',
  menu: 'Menu',
  close: 'Close',

  breaking: 'Latest Update',
  noticeBar: 'Notice',

  heroBadge: 'Updated every day by our editorial team',
  heroTitleLead: 'Find every government job, result and admit card in ',
  heroTitleAccent: 'one place',
  heroSubtitle:
    'Structured notifications with vacancy counts, eligibility, fee tables and last dates — sourced from official notifications, published in English and Hindi.',
  heroHintFast: 'Fast, mobile-first',
  heroHintVerified: 'Official sources only',
  heroHintBilingual: 'हिंदी + English',
  heroTopToday: "Today's top notifications",

  viewAll: 'View all',
  readMore: 'Read more',
  viewDetails: 'View details',
  backTo: 'Back to',
  home: 'Home',

  new: 'NEW',
  featured: 'Featured',
  updated: 'Updated',

  sectionLatestJobs: 'Latest Jobs',
  sectionLatestJobsSub: 'Freshly published government job notifications',
  sectionResults: 'Latest Results',
  sectionResultsSub: 'Declared results, merit lists and cut-offs',
  sectionAdmitCard: 'Admit Cards',
  sectionAdmitCardSub: 'Downloadable hall tickets and call letters',
  sectionAnswerKey: 'Answer Keys',
  sectionAnswerKeySub: 'Provisional and final answer keys',
  sectionSyllabus: 'Syllabus & Exam Pattern',
  sectionSyllabusSub: 'Subject-wise syllabus and previous papers',
  sectionAdmission: 'Admission',
  sectionAdmissionSub: 'University and entrance exam admissions',
  sectionNotifications: 'Notifications',
  sectionNotificationsSub: 'Date extensions, corrigendums and circulars',
  browseAll: 'Browse all categories',

  statJobs: 'Live Openings',
  statResults: 'Results Declared',
  statAdmit: 'Admit Cards Out',
  statCandidates: 'Candidates Served',

  tableImportantDates: 'Important Dates',
  tableApplicationFee: 'Application Fee',
  tableAgeLimit: 'Age Limit',
  tableVacancy: 'Vacancy Details',
  tableEligibility: 'Eligibility',
  tableHowToApply: 'How to Apply',
  tableOverview: 'Overview',

  thEvent: 'Event',
  thDate: 'Date',
  thCategory: 'Category',
  thAmount: 'Amount',
  thPostName: 'Post Name',
  thNoOfPosts: 'No. of Posts',
  thTotal: 'Total',

  labelOrganization: 'Organization',
  labelQualification: 'Qualification',
  labelLocation: 'Job Location',
  labelTotalVacancies: 'Total Vacancies',
  labelMinAge: 'Minimum Age',
  labelMaxAge: 'Maximum Age',
  labelAgeAsOn: 'Age as on',
  labelAgeRelaxation: 'Age relaxation',
  labelPublished: 'Published',
  labelLastDate: 'Last Date',
  labelOfficialWebsite: 'Official Website',
  labelNotificationPdf: 'Official Notification (PDF)',
  labelApplyOnline: 'Apply Online',
  labelCategory: 'Category',

  ctaApplyOnline: 'Apply Online',
  ctaDownloadPdf: 'Download Notification',
  ctaOfficialSite: 'Official Website',
  ctaReadFull: 'Read full notification',

  share: 'Share',
  shareWhatsapp: 'Share on WhatsApp',
  shareTelegram: 'Share on Telegram',
  shareFacebook: 'Share on Facebook',
  shareX: 'Share on X',
  copyLink: 'Copy link',
  copied: 'Copied!',
  relatedPosts: 'Related Posts',
  alsoCheck: 'Also Check',

  searchTitle: 'Search',
  searchPlaceholder: 'Search jobs, results, admit cards…',
  searchButton: 'Search',
  searchResultsFor: 'Results for',
  searchNoResults: 'No matching posts found.',
  searchNoResultsHint: 'Try a shorter keyword, or browse a category below.',
  searchTryAgain: 'Try a different keyword',
  searchHint: 'Type at least 2 characters',
  searchCount: 'results',

  filterAll: 'All',
  filterByOrganization: 'Organization',
  filterClear: 'Clear filters',
  sortNewest: 'Newest first',
  sortOldest: 'Oldest first',

  paginationPrev: 'Previous',
  paginationNext: 'Next',
  paginationPage: 'Page',
  paginationOf: 'of',
  noPosts: 'Nothing published here yet.',
  noPostsHint: 'New posts appear here the moment our editors publish them in WordPress.',

  breadcrumbHome: 'Home',

  aboutUs: 'About Us',
  contact: 'Contact',
  privacyPolicy: 'Privacy Policy',
  disclaimer: 'Disclaimer',
  terms: 'Terms & Conditions',

  posts: 'Posts',
  postSingular: 'Post',
  free: 'Free',
  daysLeft: 'days left',
  deadlineToday: 'Closes today',
  deadlinePassed: 'Closed',
  deadlineSoon: 'Closing soon',
  viewNotification: 'View notification',
  updatedOn: 'Updated on',
  quickSummary: 'Quick Summary',
  onThisPage: 'On this page',
  applyBefore: 'Apply before',
  officialLinks: 'Official Links',
  language: 'Language',
  tableOfContents: 'Contents',
  lastUpdatedLabel: 'Last updated',
  verifiedSource: 'Sourced from the official notification',
  footerDisclaimerShort: 'Not a government website — verify on official sites.',

  footerAboutTitle: 'About this portal',
  footerAbout:
    'A single place for government job notifications, exam results, admit cards and answer keys. Content is updated by our editorial team every day.',
  footerCategories: 'Categories',
  footerQuickLinks: 'Quick Links',
  footerContact: 'Contact',
  footerFollow: 'Follow us',
  footerDisclaimer:
    'This website is not a government website. All information is collected from official notifications and is published for the convenience of candidates. Always verify details on the official website before applying.',
  footerRights: 'All rights reserved.',
  footerMadeIn: 'Made in India for Indian job seekers.',

  adLabel: 'Advertisement',

  backToTop: 'Back to top',
  readingTime: 'min read',

  notFoundTitle: 'Page not found',
  notFoundBody:
    'The page you are looking for may have been moved, or the notification is no longer active.',
  notFoundCta: 'Go to homepage',

  offlineBanner:
    'Showing a cached snapshot — live updates resume when the content server reconnects.',
} as const;

type Dict = typeof en;
type Keys = keyof Dict;

/** Flat string map. Widened from the `as const` literal type so `hi` — which
 *  cannot be `as const` without duplicating every literal — is assignable. */
export type UIStrings = Record<Keys, string>;

const hi: Record<Keys, string> = {
  brandTagline: 'सरकारी नौकरी · रिजल्ट · एडमिट कार्ड',
  navHome: 'होम',
  navSearch: 'खोजें',
  navMore: 'अन्य',
  langName: 'हिंदी',
  langSwitchTo: 'English',
  langSwitchLabel: 'अंग्रेज़ी में देखें',

  themeToggle: 'थीम बदलें',
  themeLight: 'लाइट',
  themeDark: 'डार्क',
  menu: 'मेन्यू',
  close: 'बंद करें',

  breaking: 'नवीनतम अपडेट',
  noticeBar: 'सूचना',

  heroBadge: 'हमारी टीम द्वारा प्रतिदिन अद्यतन',
  heroTitleLead: 'हर सरकारी नौकरी, रिजल्ट और एडमिट कार्ड ',
  heroTitleAccent: 'एक ही जगह',
  heroSubtitle:
    'रिक्तियों की संख्या, पात्रता, शुल्क तालिका और अंतिम तिथि सहित व्यवस्थित सूचनाएं — आधिकारिक अधिसूचनाओं से संकलित, हिंदी और अंग्रेजी में।',
  heroHintFast: 'तेज़, मोबाइल-फर्स्ट',
  heroHintVerified: 'केवल आधिकारिक स्रोत',
  heroHintBilingual: 'हिंदी + English',
  heroTopToday: 'आज की प्रमुख सूचनाएं',

  viewAll: 'सभी देखें',
  readMore: 'और पढ़ें',
  viewDetails: 'विवरण देखें',
  backTo: 'वापस जाएं',
  home: 'होम',

  new: 'नया',
  featured: 'विशेष',
  updated: 'अद्यतन',

  sectionLatestJobs: 'नवीनतम नौकरियां',
  sectionLatestJobsSub: 'नई सरकारी नौकरी की सूचनाएं',
  sectionResults: 'नवीनतम रिजल्ट',
  sectionResultsSub: 'घोषित परिणाम, मेरिट लिस्ट और कट-ऑफ',
  sectionAdmitCard: 'एडमिट कार्ड',
  sectionAdmitCardSub: 'डाउनलोड करने योग्य हॉल टिकट और कॉल लेटर',
  sectionAnswerKey: 'उत्तर कुंजी',
  sectionAnswerKeySub: 'अस्थायी और अंतिम उत्तर कुंजी',
  sectionSyllabus: 'सिलेबस और परीक्षा पैटर्न',
  sectionSyllabusSub: 'विषय-वार सिलेबस और पिछले प्रश्न पत्र',
  sectionAdmission: 'एडमिशन',
  sectionAdmissionSub: 'विश्वविद्यालय और प्रवेश परीक्षा',
  sectionNotifications: 'सूचनाएं',
  sectionNotificationsSub: 'तिथि विस्तार, शोधन और परिपत्र',
  browseAll: 'सभी श्रेणियां देखें',

  statJobs: 'सक्रिय भर्तियां',
  statResults: 'घोषित रिजल्ट',
  statAdmit: 'जारी एडमिट कार्ड',
  statCandidates: 'लाभान्वित अभ्यर्थी',

  tableImportantDates: 'महत्वपूर्ण तिथियां',
  tableApplicationFee: 'आवेदन शुल्क',
  tableAgeLimit: 'आयु सीमा',
  tableVacancy: 'रिक्तियों का विवरण',
  tableEligibility: 'पात्रता',
  tableHowToApply: 'आवेदन कैसे करें',
  tableOverview: 'संक्षिप्त विवरण',

  thEvent: 'कार्यक्रम',
  thDate: 'तिथि',
  thCategory: 'श्रेणी',
  thAmount: 'राशि',
  thPostName: 'पद का नाम',
  thNoOfPosts: 'रिक्तियां',
  thTotal: 'कुल',

  labelOrganization: 'संस्थान',
  labelQualification: 'शैक्षणिक योग्यता',
  labelLocation: 'नौकरी का स्थान',
  labelTotalVacancies: 'कुल रिक्तियां',
  labelMinAge: 'न्यूनतम आयु',
  labelMaxAge: 'अधिकतम आयु',
  labelAgeAsOn: 'आयु गणना तिथि',
  labelAgeRelaxation: 'आयु में छूट',
  labelPublished: 'प्रकाशित',
  labelLastDate: 'अंतिम तिथि',
  labelOfficialWebsite: 'आधिकारिक वेबसाइट',
  labelNotificationPdf: 'आधिकारिक अधिसूचना (PDF)',
  labelApplyOnline: 'ऑनलाइन आवेदन',
  labelCategory: 'श्रेणी',

  ctaApplyOnline: 'ऑनलाइन आवेदन करें',
  ctaDownloadPdf: 'अधिसूचना डाउनलोड करें',
  ctaOfficialSite: 'आधिकारिक वेबसाइट',
  ctaReadFull: 'पूरी अधिसूचना पढ़ें',

  share: 'शेयर करें',
  shareWhatsapp: 'व्हाट्सएप पर शेयर करें',
  shareTelegram: 'टेलीग्राम पर शेयर करें',
  shareFacebook: 'फेसबुक पर शेयर करें',
  shareX: 'X पर शेयर करें',
  copyLink: 'लिंक कॉपी करें',
  copied: 'कॉपी हो गया!',
  relatedPosts: 'संबंधित पोस्ट',
  alsoCheck: 'यह भी देखें',

  searchTitle: 'खोज',
  searchPlaceholder: 'नौकरी, रिजल्ट, एडमिट कार्ड खोजें…',
  searchButton: 'खोजें',
  searchResultsFor: 'खोज परिणाम',
  searchNoResults: 'कोई मिलता-जुलता पोस्ट नहीं मिला।',
  searchNoResultsHint: 'छोटा कीवर्ड आज़माएं, या नीचे से कोई श्रेणी चुनें।',
  searchTryAgain: 'दूसरा कीवर्ड आज़माएं',
  searchHint: 'कम से कम 2 अक्षर लिखें',
  searchCount: 'परिणाम',

  filterAll: 'सभी',
  filterByOrganization: 'संस्थान',
  filterClear: 'फ़िल्टर हटाएं',
  sortNewest: 'नई पहले',
  sortOldest: 'पुरानी पहले',

  paginationPrev: 'पिछला',
  paginationNext: 'अगला',
  paginationPage: 'पृष्ठ',
  paginationOf: '/',
  noPosts: 'अभी यहां कुछ प्रकाशित नहीं है।',
  noPostsHint: 'संपादक द्वारा प्रकाशित करते ही नई पोस्ट यहां दिखाई देगी।',

  breadcrumbHome: 'होम',

  aboutUs: 'हमारे बारे में',
  contact: 'संपर्क करें',
  privacyPolicy: 'गोपनीयता नीति',
  disclaimer: 'अस्वीकरण',
  terms: 'नियम एवं शर्तें',

  posts: 'पद',
  postSingular: 'पद',
  free: 'निःशुल्क',
  daysLeft: 'दिन शेष',
  deadlineToday: 'आज अंतिम दिन',
  deadlinePassed: 'बंद',
  deadlineSoon: 'जल्द बंद होगा',
  viewNotification: 'अधिसूचना देखें',
  updatedOn: 'अद्यतन',
  quickSummary: 'संक्षिप्त सारांश',
  onThisPage: 'इस पृष्ठ पर',
  applyBefore: 'आवेदन करें इससे पहले',
  officialLinks: 'आधिकारिक लिंक',
  language: 'भाषा',
  tableOfContents: 'विषय-सूची',
  lastUpdatedLabel: 'अंतिम अद्यतन',
  verifiedSource: 'आधिकारिक अधिसूचना से लिया गया',
  footerDisclaimerShort: 'यह सरकारी वेबसाइट नहीं है — आधिकारिक साइट पर पुष्टि करें।',

  footerAboutTitle: 'इस पोर्टल के बारे में',
  footerAbout:
    'सरकारी नौकरी की सूचनाएं, परीक्षा परिणाम, एडमिट कार्ड और उत्तर कुंजी — सब एक ही जगह। हमारी टीम रोज़ाना कंटेंट अपडेट करती है।',
  footerCategories: 'श्रेणियां',
  footerQuickLinks: 'त्वरित लिंक',
  footerContact: 'संपर्क',
  footerFollow: 'फॉलो करें',
  footerDisclaimer:
    'यह वेबसाइट कोई सरकारी वेबसाइट नहीं है। सभी जानकारी आधिकारिक अधिसूचनाओं से एकत्र की गई है और अभ्यर्थियों की सुविधा के लिए प्रकाशित की गई है। आवेदन करने से पहले आधिकारिक वेबसाइट पर विवरण अवश्य जांचें।',
  footerRights: 'सर्वाधिकार सुरक्षित।',
  footerMadeIn: 'भारतीय नौकरी चाहने वालों के लिए बनाया गया।',

  adLabel: 'विज्ञापन',

  backToTop: 'ऊपर जाएं',
  readingTime: 'मिनट पढ़ें',

  notFoundTitle: 'पृष्ठ नहीं मिला',
  notFoundBody: 'आप जिस पृष्ठ को खोज रहे हैं वह हटा दिया गया है, या अधिसूचना अब सक्रिय नहीं है।',
  notFoundCta: 'होमपेज पर जाएं',

  offlineBanner:
    'कैश्ड स्नैपशॉट दिखाया जा रहा है — कंटेंट सर्वर जुड़ते ही लाइव अपडेट शुरू हो जाएंगे।',
};

export const ui = { en, hi } satisfies Record<Lang, UIStrings>;

export type UIKey = Keys;
