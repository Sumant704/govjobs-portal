import type { AgeLimit, DateRow, FeeRow, GovPost, Lang, PostTypeKey, VacancyRow } from '@/lib/types';
import { POST_TYPES } from '@/lib/post-types';
import { isFree } from '@/lib/format';

/**
 * ---------------------------------------------------------------------------
 * Content snapshot (offline fallback)
 * ---------------------------------------------------------------------------
 * WordPress is the source of truth. This file exists for two reasons:
 *
 *   1. `npm run dev` works on a fresh clone with no WordPress running, so
 *      frontend work is never blocked on backend setup.
 *   2. If wp-admin goes down on result day — which is exactly when traffic
 *      spikes — the portal serves this snapshot with a visible "cached" banner
 *      instead of a 500. A slow page beats no page.
 *
 * Regenerate from a live site with:
 *     node scripts/export-snapshot.mjs > src/content/snapshot.generated.ts
 *
 * Every record below is sample data. Replace it or delete it once the real
 * WordPress instance is wired up.
 */

/** [label, labelHi, value (ISO date or free text), emphasis?] */
type SeedDate = [string, string, string, boolean?];
/** [category, categoryHi, amount] */
type SeedFee = [string, string, string];
/** [postName, postNameHi, noOfPosts] */
type SeedVacancy = [string, string, string];

interface Seed {
  slug: string;
  type: PostTypeKey;
  org: [string, string];
  title: [string, string];
  excerpt: [string, string];
  dates: SeedDate[];
  fees: SeedFee[];
  age: [string, string, string?];
  vacancyTotal: string;
  vacancyRows: SeedVacancy[];
  qualification: [string, string];
  location: [string, string];
  site: string;
  apply: string;
  published: string;
  lastDate?: string;
  featured?: boolean;
}

const SITE = 'https://ssc.gov.in';

const SEEDS: Seed[] = [
  {
    slug: 'ssc-cgl-2026-notification',
    type: 'jobs',
    org: ['Staff Selection Commission', 'कर्मचारी चयन आयोग'],
    title: [
      'SSC CGL 2026 Notification — Combined Graduate Level Exam for 17,727 Posts',
      'एसएससी सीजीएल 2026 अधिसूचना — संयुक्त स्नातक स्तरीय परीक्षा, 17,727 पद',
    ],
    excerpt: [
      'Staff Selection Commission has released the CGL 2026 notification for 17,727 Group B and Group C posts. Online applications open 10 April 2026, last date 09 May 2026. Bachelor\u2019s degree in any stream is required.',
      'कर्मचारी चयन आयोग ने 17,727 ग्रुप बी एवं ग्रुप सी पदों के लिए सीजीएल 2026 अधिसूचना जारी कर दी है। ऑनलाइन आवेदन 10 अप्रैल 2026 से, अंतिम तिथि 09 मई 2026 है। किसी भी विषय में स्नातक डिग्री आवश्यक है।',
    ],
    dates: [
      ['Application Begin', 'आवेदन प्रारंभ', '2026-04-10'],
      ['Last Date for Apply Online', 'ऑनलाइन आवेदन की अंतिम तिथि', '2026-05-09', true],
      ['Last Date Pay Exam Fee', 'परीक्षा शुल्क भुगतान की अंतिम तिथि', '2026-05-10'],
      ['Correction Window', 'सुधार विंडो', '2026-05-13 to 2026-05-15'],
      ['Tier-I Exam Date', 'टियर-I परीक्षा तिथि', '2026-06-20'],
      ['Tier-II Exam Date', 'टियर-II परीक्षा तिथि', '2026-09-14'],
      ['Admit Card Available', 'एडमिट कार्ड उपलब्ध', 'Before Exam'],
    ],
    fees: [
      ['General / OBC / EWS', 'सामान्य / ओबीसी / ईडब्ल्यूएस', '100'],
      ['SC / ST', 'अनुसूचित जाति / जनजाति', '0'],
      ['All Category Female', 'सभी वर्ग की महिलाएं', '0'],
      ['PwBD / Ex-Serviceman', 'दिव्यांग / भूतपूर्व सैनिक', '0'],
    ],
    age: ['18 Years', '32 Years', '2026-08-01'],
    vacancyTotal: '17727',
    vacancyRows: [
      ['Assistant Section Officer (CSS)', 'सहायक अनुभाग अधिकारी (सीएसएस)', '3512'],
      ['Tax Assistant (CBIC)', 'कर सहायक (सीबीआईसी)', '3420'],
      ['Inspector (Central Excise / GST)', 'निरीक्षक (केंद्रीय उत्पाद शुल्क / जीएसटी)', '2205'],
      ['Upper Division Clerk', 'वरिष्ठ अभिलेख लिपिक', '2140'],
      ['Auditor (CAG)', 'लेखा परीक्षक (सीएजी)', '1250'],
      ['Accountant (CAG)', 'लेखाकार (सीएजी)', '1187'],
      ['Junior Statistical Officer', 'कनिष्ठ सांख्यिकी अधिकारी', '1013'],
      ['Sub Inspector (NIA)', 'उप निरीक्षक (एनआईए)', '2000'],
    ],
    qualification: ['Bachelor\u2019s Degree in any stream from a recognised university.', 'किसी मान्यता प्राप्त विश्वविद्यालय से किसी भी विषय में स्नातक डिग्री।'],
    location: ['All India', 'समस्त भारत'],
    site: SITE,
    apply: 'https://ssc.gov.in/registration',
    published: '2026-04-10T06:30:00Z',
    lastDate: '2026-05-09',
    featured: true,
  },
  {
    slug: 'ibps-po-xvi-2026-recruitment',
    type: 'jobs',
    org: ['Institute of Banking Personnel Selection', 'बैंकिंग कार्मिक चयन संस्थान'],
    title: [
      'IBPS PO XVI 2026 — Probationary Officer Recruitment for 5,208 Posts',
      'आईबीपीएस पीओ XVI 2026 — प्रोबेशनरी अधिकारी भर्ती, 5,208 पद',
    ],
    excerpt: [
      'IBPS invites online applications for Probationary Officer / Management Trainee posts in 11 participating public sector banks. Preliminary exam in August 2026, mains in October 2026.',
      'आईबीपीएस ने 11 सार्वजनिक क्षेत्र के बैंकों में प्रोबेशनरी अधिकारी / प्रबंधन प्रशिक्षु पदों के लिए ऑनलाइन आवेदन आमंत्रित किए हैं। प्रारंभिक परीक्षा अगस्त 2026, मुख्य परीक्षा अक्टूबर 2026।',
    ],
    dates: [
      ['Application Begin', 'आवेदन प्रारंभ', '2026-07-01'],
      ['Last Date for Apply Online', 'ऑनलाइन आवेदन की अंतिम तिथि', '2026-07-21', true],
      ['Fee Payment Last Date', 'शुल्क भुगतान अंतिम तिथि', '2026-07-21'],
      ['Prelims Admit Card', 'प्री परीक्षा एडमिट कार्ड', '2026-08-05'],
      ['Preliminary Exam Date', 'प्रारंभिक परीक्षा तिथि', '2026-08-16'],
      ['Mains Exam Date', 'मुख्य परीक्षा तिथि', '2026-10-04'],
    ],
    fees: [
      ['General / OBC / EWS', 'सामान्य / ओबीसी / ईडब्ल्यूएस', '850'],
      ['SC / ST / PwBD', 'अनुसूचित जाति / जनजाति / दिव्यांग', '175'],
    ],
    age: ['20 Years', '30 Years', '2026-07-01'],
    vacancyTotal: '5208',
    vacancyRows: [
      ['Bank of Baroda', 'बैंक ऑफ बड़ौदा', '620'],
      ['Canara Bank', 'केनरा बैंक', '750'],
      ['Punjab National Bank', 'पंजाब नेशनल बैंक', '890'],
      ['Union Bank of India', 'यूनियन बैंक ऑफ इंडिया', '480'],
      ['Indian Overseas Bank', 'इंडियन ओवरसीज बैंक', '312'],
      ['UCO Bank', 'यूको बैंक', '256'],
    ],
    qualification: ['Graduation in any discipline with a valid degree certificate.', 'किसी भी विषय में स्नातक डिग्री एवं वैध उपाधि प्रमाण पत्र।'],
    location: ['All India', 'समस्त भारत'],
    site: 'https://ibps.in',
    apply: 'https://ibps.in/career-details/',
    published: '2026-07-01T05:00:00Z',
    lastDate: '2026-07-21',
    featured: true,
  },
  {
    slug: 'rrb-ntpc-graduate-2026',
    type: 'jobs',
    org: ['Railway Recruitment Board', 'रेलवे भर्ती बोर्ड'],
    title: [
      'RRB NTPC Graduate Level 2026 — 11,558 Posts Across 21 RRBs',
      'आरआरबी एनटीपीसी स्नातक स्तर 2026 — 21 आरआरबी में 11,558 पद',
    ],
    excerpt: [
      'Railway Recruitment Boards have announced NTPC Graduate Level vacancies for Station Master, Goods Guard, Senior Clerk and more. Computer Based Test in two stages.',
      'रेलवे भर्ती बोर्ड ने स्टेशन मास्टर, गुड्स गार्ड, वरिष्ठ लिपिक सहित अन्य पदों के लिए एनटीपीसी स्नातक स्तर की रिक्तियां घोषित की हैं। दो चरणों में कंप्यूटर आधारित परीक्षा होगी।',
    ],
    dates: [
      ['Notification Release', 'अधिसूचना जारी', '2026-02-18'],
      ['Application Begin', 'आवेदन प्रारंभ', '2026-02-25'],
      ['Last Date for Apply Online', 'ऑनलाइन आवेदन की अंतिम तिथि', '2026-03-26', true],
      ['CBT Stage 1 Exam', 'सीबीटी प्रथम चरण परीक्षा', '2026-06-10'],
      ['CBT Stage 2 Exam', 'सीबीटी द्वितीय चरण परीक्षा', '2026-09-08'],
    ],
    fees: [
      ['General / OBC / EWS', 'सामान्य / ओबीसी / ईडब्ल्यूएस', '500'],
      ['SC / ST / PwBD / Female', 'अनुसूचित जाति / जनजाति / दिव्यांग / महिला', '250'],
    ],
    age: ['18 Years', '33 Years', '2026-07-01'],
    vacancyTotal: '11558',
    vacancyRows: [
      ['Station Master', 'स्टेशन मास्टर', '1872'],
      ['Goods Guard', 'गुड्स गार्ड', '3240'],
      ['Senior Clerk cum Typist', 'वरिष्ठ लिपिक सह टंकक', '2410'],
      ['Junior Account Assistant', 'कनिष्ठ लेखा सहायक', '1680'],
      ['Commercial cum Ticket Clerk', 'वाणिज्य सह टिकट लिपिक', '2356'],
    ],
    qualification: ['12th Pass or Graduation depending on the post applied for.', 'आवेदित पद के अनुसार 12वीं पास अथवा स्नातक।'],
    location: ['All India', 'समस्त भारत'],
    site: 'https://indianrailways.gov.in/RRB_Reports_4_1653541014.pdf',
    apply: 'https://www.rrbcdg.gov.in/',
    published: '2026-02-25T04:30:00Z',
    lastDate: '2026-03-26',
  },
  {
    slug: 'upsc-civil-services-2026',
    type: 'jobs',
    org: ['Union Public Service Commission', 'संघ लोक सेवा आयोग'],
    title: [
      'UPSC Civil Services Examination 2026 — 979 Vacancies',
      'यूपीएससी सिविल सेवा परीक्षा 2026 — 979 रिक्तियां',
    ],
    excerpt: [
      'UPSC has notified the Civil Services Examination 2026 for IAS, IPS, IFS and other Group A and B services. Prelims on 24 May 2026, Mains from 21 August 2026.',
      'यूपीएससी ने आईएएस, आईपीएस, आईएफएस एवं अन्य ग्रुप ए और बी सेवाओं के लिए सिविल सेवा परीक्षा 2026 अधिसूचित की है। प्रारंभिक परीक्षा 24 मई 2026, मुख्य परीक्षा 21 अगस्त 2026 से।',
    ],
    dates: [
      ['Notification Release', 'अधिसूचना जारी', '2026-01-14'],
      ['Application Begin', 'आवेदन प्रारंभ', '2026-01-14'],
      ['Last Date for Apply Online', 'ऑनलाइन आवेदन की अंतिम तिथि', '2026-02-03', true],
      ['Preliminary Exam Date', 'प्रारंभिक परीक्षा तिथि', '2026-05-24'],
      ['Mains Exam Begin', 'मुख्य परीक्षा प्रारंभ', '2026-08-21'],
      ['Interview / Personality Test', 'साक्षात्कार / व्यक्तित्व परीक्षण', '2027-01-15'],
    ],
    fees: [
      ['General / OBC / EWS', 'सामान्य / ओबीसी / ईडब्ल्यूएस', '100'],
      ['SC / ST / PwBD / Female', 'अनुसूचित जाति / जनजाति / दिव्यांग / महिला', '0'],
    ],
    age: ['21 Years', '32 Years', '2026-08-01'],
    vacancyTotal: '979',
    vacancyRows: [
      ['Indian Administrative Service', 'भारतीय प्रशासनिक सेवा', '180'],
      ['Indian Police Service', 'भारतीय पुलिस सेवा', '150'],
      ['Indian Foreign Service', 'भारतीय विदेश सेवा', '45'],
      ['Indian Revenue Service (IT)', 'भारतीय राजस्व सेवा (आयकर)', '204'],
      ['Indian Audit and Accounts Service', 'भारतीय लेखा परीक्षा सेवा', '120'],
    ],
    qualification: ['Bachelor\u2019s degree from a recognised university. Candidates appearing for the final year exam may also apply.', 'मान्यता प्राप्त विश्वविद्यालय से स्नातक डिग्री। अंतिम वर्ष की परीक्षा में बैठने वाले अभ्यर्थी भी आवेदन कर सकते हैं।'],
    location: ['All India', 'समस्त भारत'],
    site: 'https://upsc.gov.in',
    apply: 'https://upsconline.gov.in/',
    published: '2026-01-14T07:00:00Z',
    lastDate: '2026-02-03',
    featured: true,
  },
  {
    slug: 'up-police-constable-2026',
    type: 'jobs',
    org: ['UP Police Recruitment Board', 'उत्तर प्रदेश पुलिस भर्ती बोर्ड'],
    title: [
      'UP Police Constable Recruitment 2026 — 60,244 Posts',
      'यूपी पुलिस कांस्टेबल भर्ती 2026 — 60,244 पद',
    ],
    excerpt: [
      'Uttar Pradesh Police Recruitment and Promotion Board has opened registration for 60,244 constable posts across 75 districts. Written exam expected in September 2026.',
      'उत्तर प्रदेश पुलिस भर्ती एवं प्रोन्नति बोर्ड ने 75 जिलों में 60,244 कांस्टेबल पदों के लिए पंजीकरण शुरू कर दिया है। लिखित परीक्षा सितंबर 2026 में अपेक्षित है।',
    ],
    dates: [
      ['Application Begin', 'आवेदन प्रारंभ', '2026-05-20'],
      ['Last Date for Apply Online', 'ऑनलाइन आवेदन की अंतिम तिथि', '2026-06-19', true],
      ['Fee Payment Last Date', 'शुल्क भुगतान अंतिम तिथि', '2026-06-20'],
      ['Correction Window', 'सुधार विंडो', '2026-06-24 to 2026-07-01'],
      ['Written Exam Date', 'लिखित परीक्षा तिथि', '2026-09-06'],
    ],
    fees: [
      ['General / OBC / EWS', 'सामान्य / ओबीसी / ईडब्ल्यूएस', '400'],
      ['SC / ST', 'अनुसूचित जाति / जनजाति', '240'],
      ['All Category Female', 'सभी वर्ग की महिलाएं', '240'],
    ],
    age: ['18 Years', '25 Years', '2026-07-01'],
    vacancyTotal: '60244',
    vacancyRows: [
      ['Constable (Civil Police)', 'आरक्षी (नागरिक पुलिस)', '42115'],
      ['Constable (PAC)', 'आरक्षी (पीएसी)', '14020'],
      ['Constable (Fireman)', 'आरक्षी (अग्निशमन)', '4109'],
    ],
    qualification: ['12th (Intermediate) pass from a recognised board.', 'मान्यता प्राप्त बोर्ड से 12वीं (इंटरमीडिएट) उत्तीर्ण।'],
    location: ['Uttar Pradesh', 'उत्तर प्रदेश'],
    site: 'https://uppbpb.gov.in',
    apply: 'https://uppbpb.gov.in/',
    published: '2026-05-20T03:45:00Z',
    lastDate: '2026-06-19',
  },
  {
    slug: 'ssc-chsl-2025-final-result',
    type: 'results',
    org: ['Staff Selection Commission', 'कर्मचारी चयन आयोग'],
    title: [
      'SSC CHSL 2025 Final Result Declared — Check Merit List & Cut Off',
      'एसएससी सीएचएसएल 2025 अंतिम परिणाम घोषित — मेरिट लिस्ट और कट ऑफ देखें',
    ],
    excerpt: [
      'Staff Selection Commission has declared the final result of Combined Higher Secondary Level Examination 2025. Candidate-wise marks and category-wise cut off are available on the official website.',
      'कर्मचारी चयन आयोग ने संयुक्त उच्चतर माध्यमिक स्तरीय परीक्षा 2025 का अंतिम परिणाम घोषित कर दिया है। अभ्यर्थी-वार अंक और वर्ग-वार कट ऑफ आधिकारिक वेबसाइट पर उपलब्ध हैं।',
    ],
    dates: [
      ['Tier-I Exam Date', 'टियर-I परीक्षा तिथि', '2025-07-01'],
      ['Tier-II Exam Date', 'टियर-II परीक्षा तिथि', '2025-11-09'],
      ['Final Result Declared', 'अंतिम परिणाम घोषित', '2026-02-27', true],
      ['Document Verification Begin', 'दस्तावेज सत्यापन प्रारंभ', '2026-03-16'],
    ],
    fees: [
      ['Result Check', 'परिणाम देखें', '0'],
      ['Scorecard Download', 'स्कोरकार्ड डाउनलोड', '0'],
    ],
    age: ['18 Years', '27 Years', '2025-08-01'],
    vacancyTotal: '3121',
    vacancyRows: [
      ['LDC / JSA', 'अभिलेख लिपिक / कनिष्ठ सचिवालय सहायक', '2049'],
      ['Data Entry Operator', 'डाटा एंट्री ऑपरेटर', '1072'],
    ],
    qualification: ['12th pass; Data Entry Operator post requires 12th with Science and Mathematics.', '12वीं उत्तीर्ण; डाटा एंट्री ऑपरेटर पद के लिए विज्ञान एवं गणित सहित 12वीं आवश्यक।'],
    location: ['All India', 'समस्त भारत'],
    site: 'https://ssc.gov.in',
    apply: 'https://ssc.gov.in/result',
    published: '2026-02-27T11:15:00Z',
    featured: true,
  },
  {
    slug: 'rrb-group-d-2025-result',
    type: 'results',
    org: ['Railway Recruitment Board', 'रेलवे भर्ती बोर्ड'],
    title: [
      'RRB Group D 2025 Result Out — 32,438 Candidates Shortlisted',
      'आरआरबी ग्रुप डी 2025 रिजल्ट जारी — 32,438 अभ्यर्थी चयनित',
    ],
    excerpt: [
      'Railway Recruitment Boards have released the Group D Computer Based Test result. Shortlisted candidates must complete document verification and medical examination.',
      'रेलवे भर्ती बोर्ड ने ग्रुप डी कंप्यूटर आधारित परीक्षा का परिणाम जारी कर दिया है। चयनित अभ्यर्थियों को दस्तावेज सत्यापन एवं चिकित्सा परीक्षण पूरा करना होगा।',
    ],
    dates: [
      ['CBT Exam Date', 'सीबीटी परीक्षा तिथि', '2025-10-12'],
      ['Answer Key Released', 'उत्तर कुंजी जारी', '2025-11-05'],
      ['Result Declared', 'परिणाम घोषित', '2026-01-08', true],
      ['Document Verification', 'दस्तावेज सत्यापन', '2026-02-10'],
      ['Medical Examination', 'चिकित्सा परीक्षण', '2026-03-02'],
    ],
    fees: [['Result Check', 'परिणाम देखें', '0']],
    age: ['18 Years', '36 Years', '2025-08-01'],
    vacancyTotal: '32438',
    vacancyRows: [
      ['Level 1 Posts (Track Maintainer)', 'स्तर 1 पद (ट्रैक मेंटेनर)', '18215'],
      ['Assistant Pointsman', 'सहायक पॉइंट्समैन', '9120'],
      ['Assistant (Workshop)', 'सहायक (कार्यशाला)', '5103'],
    ],
    qualification: ['10th pass or ITI from a recognised institution.', 'मान्यता प्राप्त संस्थान से 10वीं उत्तीर्ण अथवा आईटीआई।'],
    location: ['All India', 'समस्त भारत'],
    site: 'https://indianrailways.gov.in',
    apply: 'https://www.rrbcdg.gov.in/',
    published: '2026-01-08T10:00:00Z',
  },
  {
    slug: 'ibps-clerk-2025-prelims-result',
    type: 'results',
    org: ['Institute of Banking Personnel Selection', 'बैंकिंग कार्मिक चयन संस्थान'],
    title: [
      'IBPS Clerk 2025 Prelims Result — Mains Admit Card Released',
      'आईबीपीएस क्लर्क 2025 प्री परिणाम — मुख्य परीक्षा एडमिट कार्ड जारी',
    ],
    excerpt: [
      'IBPS has declared the CRP Clerks XV preliminary examination result. Candidates qualified for the mains can download their admit card using registration number and date of birth.',
      'आईबीपीएस ने सीआरपी क्लर्क XV प्रारंभिक परीक्षा का परिणाम घोषित कर दिया है। मुख्य परीक्षा के लिए अर्हता प्राप्त अभ्यर्थी पंजीकरण संख्या और जन्म तिथि से एडमिट कार्ड डाउनलोड कर सकते हैं।',
    ],
    dates: [
      ['Prelims Exam Date', 'प्रारंभिक परीक्षा तिथि', '2025-12-06'],
      ['Prelims Result Declared', 'प्रारंभिक परिणाम घोषित', '2026-01-02', true],
      ['Mains Admit Card', 'मुख्य परीक्षा एडमिट कार्ड', '2026-01-10'],
      ['Mains Exam Date', 'मुख्य परीक्षा तिथि', '2026-01-25'],
    ],
    fees: [['Result Check', 'परिणाम देखें', '0']],
    age: ['20 Years', '28 Years', '2025-08-01'],
    vacancyTotal: '7830',
    vacancyRows: [['Clerk (CRP Clerks XV)', 'लिपिक (सीआरपी क्लर्क XV)', '7830']],
    qualification: ['Graduation in any discipline from a recognised university.', 'मान्यता प्राप्त विश्वविद्यालय से किसी भी विषय में स्नातक।'],
    location: ['All India', 'समस्त भारत'],
    site: 'https://ibps.in',
    apply: 'https://ibps.in/career-details/',
    published: '2026-01-02T09:30:00Z',
  },
  {
    slug: 'ssc-mts-havaldar-2026-admit-card',
    type: 'admit-card',
    org: ['Staff Selection Commission', 'कर्मचारी चयन आयोग'],
    title: [
      'SSC MTS & Havaldar 2026 Admit Card — Download Region-wise Hall Ticket',
      'एसएससी एमटीएस एवं हवलदार 2026 एडमिट कार्ड — क्षेत्रवार हॉल टिकट डाउनलोड करें',
    ],
    excerpt: [
      'SSC has released the Tier-I admit card for MTS and Havaldar Examination 2026. Download using registration number and password. Exam city intimation slip is already live.',
      'एसएससी ने एमटीएस एवं हवलदार परीक्षा 2026 का टियर-I एडमिट कार्ड जारी कर दिया है। पंजीकरण संख्या और पासवर्ड से डाउनलोड करें। परीक्षा शहर सूचना पर्ची पहले ही जारी है।',
    ],
    dates: [
      ['Exam City Intimation Slip', 'परीक्षा शहर सूचना पर्ची', '2026-04-20'],
      ['Admit Card Release', 'एडमिट कार्ड जारी', '2026-04-25', true],
      ['Tier-I Exam Date', 'टियर-I परीक्षा तिथि', '2026-05-04'],
      ['PET / PST (Havaldar)', 'शारीरिक परीक्षा (हवलदार)', '2026-07-10'],
    ],
    fees: [
      ['General / OBC', 'सामान्य / ओबीसी', '100'],
      ['SC / ST / Female / PwBD', 'अनुसूचित जाति / जनजाति / महिला / दिव्यांग', '0'],
    ],
    age: ['18 Years', '27 Years', '2026-01-01'],
    vacancyTotal: '9583',
    vacancyRows: [
      ['Multi Tasking Staff', 'बहुकार्य कर्मचारी', '8058'],
      ['Havaldar (CBIC / CBN)', 'हवलदार (सीबीआईसी / सीबीएन)', '1525'],
    ],
    qualification: ['10th pass for MTS; 10th pass plus PET/PST for Havaldar.', 'एमटीएस के लिए 10वीं उत्तीर्ण; हवलदार के लिए 10वीं उत्तीर्ण सहित शारीरिक परीक्षा।'],
    location: ['All India', 'समस्त भारत'],
    site: 'https://ssc.gov.in',
    apply: 'https://ssc.gov.in/admit-card',
    published: '2026-04-25T05:20:00Z',
    featured: true,
  },
  {
    slug: 'bpsc-head-teacher-admit-card-2026',
    type: 'admit-card',
    org: ['Bihar Public Service Commission', 'बिहार लोक सेवा आयोग'],
    title: [
      'BPSC Head Teacher Admit Card 2026 — Download for 40,247 Posts',
      'बीपीएससी हेड टीचर एडमिट कार्ड 2026 — 40,247 पदों के लिए डाउनलोड करें',
    ],
    excerpt: [
      'Bihar Public Service Commission has released the admit card for the Head Teacher written examination. Candidates must carry a printed copy along with original photo ID.',
      'बिहार लोक सेवा आयोग ने हेड टीचर लिखित परीक्षा का एडमिट कार्ड जारी कर दिया है। अभ्यर्थियों को मूल फोटो पहचान पत्र के साथ प्रिंट कॉपी लानी होगी।',
    ],
    dates: [
      ['Application Begin', 'आवेदन प्रारंभ', '2026-01-05'],
      ['Last Date for Apply Online', 'ऑनलाइन आवेदन की अंतिम तिथि', '2026-02-04'],
      ['Admit Card Release', 'एडमिट कार्ड जारी', '2026-03-11', true],
      ['Written Exam Date', 'लिखित परीक्षा तिथि', '2026-03-22'],
    ],
    fees: [
      ['General / OBC / EWS', 'सामान्य / ओबीसी / ईडब्ल्यूएस', '750'],
      ['SC / ST / Female / PwBD', 'अनुसूचित जाति / जनजाति / महिला / दिव्यांग', '200'],
    ],
    age: ['25 Years', '60 Years', '2026-01-01'],
    vacancyTotal: '40247',
    vacancyRows: [
      ['Head Teacher (Class 1-5)', 'प्रधान शिक्षक (कक्षा 1-5)', '24115'],
      ['Head Teacher (Class 6-8)', 'प्रधान शिक्षक (कक्षा 6-8)', '16132'],
    ],
    qualification: ['Graduation with D.El.Ed / B.Ed and minimum teaching experience as prescribed.', 'स्नातक सहित डी.एल.एड / बी.एड एवं निर्धारित न्यूनतम शिक्षण अनुभव।'],
    location: ['Bihar', 'बिहार'],
    site: 'https://bpsc.bih.nic.in',
    apply: 'https://bpsc.bih.nic.in/',
    published: '2026-03-11T06:40:00Z',
  },
  {
    slug: 'ssc-gd-constable-2026-answer-key',
    type: 'answer-key',
    org: ['Staff Selection Commission', 'कर्मचारी चयन आयोग'],
    title: [
      'SSC GD Constable 2026 Answer Key Released — Objection Window Open',
      'एसएससी जीडी कांस्टेबल 2026 उत्तर कुंजी जारी — आपत्ति विंडो खुली',
    ],
    excerpt: [
      'The tentative answer key for SSC GD Constable 2026 is now available. Candidates can raise objections against any question by paying ₹100 per question until 12 May 2026.',
      'एसएससी जीडी कांस्टेबल 2026 की अस्थायी उत्तर कुंजी उपलब्ध है। अभ्यर्थी 12 मई 2026 तक प्रति प्रश्न ₹100 शुल्क देकर आपत्ति दर्ज करा सकते हैं।',
    ],
    dates: [
      ['Exam Date', 'परीक्षा तिथि', '2026-04-02'],
      ['Tentative Answer Key', 'अस्थायी उत्तर कुंजी', '2026-04-28', true],
      ['Objection Last Date', 'आपत्ति की अंतिम तिथि', '2026-05-12'],
      ['Final Answer Key', 'अंतिम उत्तर कुंजी', '2026-06-05'],
      ['Result Declaration', 'परिणाम घोषणा', '2026-06-20'],
    ],
    fees: [
      ['Answer Key Download', 'उत्तर कुंजी डाउनलोड', '0'],
      ['Objection Fee (per question)', 'आपत्ति शुल्क (प्रति प्रश्न)', '100'],
    ],
    age: ['18 Years', '23 Years', '2026-01-01'],
    vacancyTotal: '39481',
    vacancyRows: [
      ['Constable GD (BSF)', 'कांस्टेबल जीडी (बीएसएफ)', '13348'],
      ['Constable GD (CRPF)', 'कांस्टेबल जीडी (सीआरपीएफ)', '12076'],
      ['Constable GD (CISF)', 'कांस्टेबल जीडी (सीआईएसएफ)', '6810'],
      ['Constable GD (SSB)', 'कांस्टेबल जीडी (एसएसबी)', '7247'],
    ],
    qualification: ['10th pass from a recognised board.', 'मान्यता प्राप्त बोर्ड से 10वीं उत्तीर्ण।'],
    location: ['All India', 'समस्त भारत'],
    site: 'https://ssc.gov.in',
    apply: 'https://ssc.gov.in/answer-key',
    published: '2026-04-28T07:10:00Z',
  },
  {
    slug: 'ssc-cgl-2026-syllabus-exam-pattern',
    type: 'syllabus',
    org: ['Staff Selection Commission', 'कर्मचारी चयन आयोग'],
    title: [
      'SSC CGL 2026 Syllabus & Exam Pattern — Tier-I and Tier-II Complete Guide',
      'एसएससी सीजीएल 2026 सिलेबस एवं परीक्षा पैटर्न — टियर-I और टियर-II पूर्ण गाइड',
    ],
    excerpt: [
      'Complete subject-wise syllabus for SSC CGL 2026 with marking scheme, negative marking rules, section-wise time limits and previous year paper trends.',
      'एसएससी सीजीएल 2026 का विषय-वार पूर्ण सिलेबस, अंकन योजना, नेगेटिव मार्किंग नियम, खंड-वार समय सीमा और पिछले वर्ष के प्रश्न पत्र रुझान।',
    ],
    dates: [
      ['Tier-I Exam Date', 'टियर-I परीक्षा तिथि', '2026-06-20'],
      ['Tier-II Exam Date', 'टियर-II परीक्षा तिथि', '2026-09-14'],
      ['Syllabus Last Updated', 'सिलेबस अंतिम बार अद्यतन', '2026-04-12', true],
    ],
    fees: [['Syllabus Download', 'सिलेबस डाउनलोड', '0']],
    age: ['18 Years', '32 Years', '2026-08-01'],
    vacancyTotal: '17727',
    vacancyRows: [
      ['Tier-I: General Intelligence & Reasoning', 'टियर-I: सामान्य बुद्धि एवं तर्कशक्ति', '25 Questions'],
      ['Tier-I: General Awareness', 'टियर-I: सामान्य जागरूकता', '25 Questions'],
      ['Tier-I: Quantitative Aptitude', 'टियर-I: संख्यात्मक अभिक्षमता', '25 Questions'],
      ['Tier-I: English Comprehension', 'टियर-I: अंग्रेजी समझ', '25 Questions'],
      ['Tier-II: Paper-I (Module I & II)', 'टियर-II: पेपर-I (मॉड्यूल I एवं II)', '45 + 45 Questions'],
    ],
    qualification: ['Bachelor\u2019s Degree in any stream.', 'किसी भी विषय में स्नातक डिग्री।'],
    location: ['All India', 'समस्त भारत'],
    site: SITE,
    apply: 'https://ssc.gov.in/syllabus',
    published: '2026-04-12T08:00:00Z',
  },
  {
    slug: 'cuet-ug-2026-admission',
    type: 'admission',
    org: ['National Testing Agency', 'राष्ट्रीय परीक्षा एजेंसी'],
    title: [
      'CUET UG 2026 Admission — Registration Open for 280+ Universities',
      'सीयूईटी यूजी 2026 प्रवेश — 280+ विश्वविद्यालयों के लिए पंजीकरण शुरू',
    ],
    excerpt: [
      'NTA has opened CUET UG 2026 registration for admission to undergraduate programmes in central, state and private universities. Exam is conducted in hybrid mode across 380 cities.',
      'एनटीए ने केंद्रीय, राज्य एवं निजी विश्वविद्यालयों में स्नातक कार्यक्रमों में प्रवेश हेतु सीयूईटी यूजी 2026 पंजीकरण शुरू कर दिया है। परीक्षा 380 शहरों में हाइब्रिड मोड में आयोजित होगी।',
    ],
    dates: [
      ['Registration Begin', 'पंजीकरण प्रारंभ', '2026-02-20'],
      ['Last Date to Apply', 'आवेदन की अंतिम तिथि', '2026-03-25', true],
      ['Correction Window', 'सुधार विंडो', '2026-03-28 to 2026-03-31'],
      ['City Intimation Slip', 'शहर सूचना पर्ची', '2026-04-28'],
      ['Exam Date', 'परीक्षा तिथि', '2026-05-15'],
      ['Result Declaration', 'परिणाम घोषणा', '2026-06-30'],
    ],
    fees: [
      ['General (up to 3 subjects)', 'सामान्य (3 विषय तक)', '400'],
      ['OBC / EWS (up to 3 subjects)', 'ओबीसी / ईडब्ल्यूएस (3 विषय तक)', '375'],
      ['SC / ST / PwBD (up to 3 subjects)', 'अनुसूचित जाति / जनजाति / दिव्यांग (3 विषय तक)', '350'],
      ['Additional Subject Fee', 'अतिरिक्त विषय शुल्क', '150'],
    ],
    age: ['No upper age limit', 'कोई ऊपरी आयु सीमा नहीं', '2026-08-01'],
    vacancyTotal: '280+ Universities',
    vacancyRows: [
      ['Central Universities', 'केंद्रीय विश्वविद्यालय', '46'],
      ['State Universities', 'राज्य विश्वविद्यालय', '128'],
      ['Deemed Universities', 'डीम्ड विश्वविद्यालय', '62'],
      ['Private Universities', 'निजी विश्वविद्यालय', '44'],
    ],
    qualification: ['Class 12 pass or appearing candidates are eligible to apply.', '12वीं उत्तीर्ण अथवा परीक्षा में बैठने वाले अभ्यर्थी आवेदन के पात्र हैं।'],
    location: ['All India', 'समस्त भारत'],
    site: 'https://nta.ac.in',
    apply: 'https://cuet.samarth.ac.in/',
    published: '2026-02-20T04:00:00Z',
    lastDate: '2026-03-25',
  },
  {
    slug: 'rrb-ntpc-2026-application-date-extension',
    type: 'notification',
    org: ['Railway Recruitment Board', 'रेलवे भर्ती बोर्ड'],
    title: [
      'RRB NTPC 2026 — Last Date Extended to 26 March, Corrigendum Issued',
      'आरआरबी एनटीपीसी 2026 — अंतिम तिथि 26 मार्च तक बढ़ी, शोधन जारी',
    ],
    excerpt: [
      'The last date for submission of online applications for RRB NTPC Graduate Level 2026 has been extended. Revised fee payment window and correction dates announced.',
      'आरआरबी एनटीपीसी स्नातक स्तर 2026 के ऑनलाइन आवेदन जमा करने की अंतिम तिथि बढ़ा दी गई है। संशोधित शुल्क भुगतान विंडो एवं सुधार तिथियां घोषित।',
    ],
    dates: [
      ['Original Last Date', 'मूल अंतिम तिथि', '2026-03-16'],
      ['Extended Last Date', 'बढ़ी हुई अंतिम तिथि', '2026-03-26', true],
      ['Fee Payment Last Date', 'शुल्क भुगतान अंतिम तिथि', '2026-03-28'],
      ['Correction Window', 'सुधार विंडो', '2026-03-30 to 2026-04-06'],
    ],
    fees: [
      ['General / OBC / EWS', 'सामान्य / ओबीसी / ईडब्ल्यूएस', '500'],
      ['SC / ST / PwBD / Female', 'अनुसूचित जाति / जनजाति / दिव्यांग / महिला', '250'],
    ],
    age: ['18 Years', '33 Years', '2026-07-01'],
    vacancyTotal: '11558',
    vacancyRows: [
      ['Station Master', 'स्टेशन मास्टर', '1872'],
      ['Goods Guard', 'गुड्स गार्ड', '3240'],
      ['Commercial cum Ticket Clerk', 'वाणिज्य सह टिकट लिपिक', '2356'],
    ],
    qualification: ['As per the original NTPC Graduate Level notification.', 'मूल एनटीपीसी स्नातक स्तर अधिसूचना के अनुसार।'],
    location: ['All India', 'समस्त भारत'],
    site: 'https://indianrailways.gov.in',
    apply: 'https://www.rrbcdg.gov.in/',
    published: '2026-03-18T05:30:00Z',
    lastDate: '2026-03-26',
  },
];

/* ------------------------------------------------------------------------- */
/* Date anchoring                                                             */
/* ------------------------------------------------------------------------- */

/**
 * Sample content is authored with fixed dates, then re-anchored to "now" when
 * the module loads.
 *
 * Without this the whole site reads as an archive: every deadline drifts into
 * the past, every card says "Closed", no countdown ever renders, and the demo
 * looks broken when it is not. A portal where nothing is ever open is not a
 * useful preview of a portal.
 *
 * The anchoring is per-post rather than a single global shift, for two reasons:
 *
 *   1. Publish dates must stay in the past. A global shift tuned so the newest
 *      deadline is in the future would push some posts' publish dates forward
 *      too, which reads as obviously wrong ("published in 3 days").
 *   2. It produces a realistic mix. A real portal in any given week has a
 *      couple of recruitments open, a couple that closed recently, and a long
 *      tail of closed ones. That mix is what the "N days left", "Closing soon"
 *      and "Closed" states are built for, so the sample data should exercise
 *      all three.
 *
 * The spacing *within* a post is preserved: a notification whose window ran 29
 * days still runs 29 days after re-anchoring.
 *
 * Sample content only. Real content comes from WordPress and is never touched.
 */
const DAY_MS = 86_400_000;

/** How many days ago each sample post should appear to have been published. */
const ANCHOR_DAYS_AGO: Record<string, number> = {
  // Open now — exercises the countdown, the "days left" badge and the sticky CTA.
  'ssc-cgl-2026-notification': 20,
  'ibps-po-xvi-2026-recruitment': 6,
  'cuet-ug-2026-admission': 11,
  // Closed recently — exercises the "Closed" state without looking abandoned.
  'up-police-constable-2026': 34,
  'rrb-ntpc-graduate-2026': 40,
  'ssc-mts-havaldar-2026-admit-card': 9,
  'ssc-gd-constable-2026-answer-key': 4,
  'ssc-chsl-2025-final-result': 13,
  'rrb-group-d-2025-result': 25,
  // Older — fills out the archive and the related-post rails.
  'ibps-clerk-2025-prelims-result': 48,
  'bpsc-head-teacher-admit-card-2026': 30,
  'ssc-cgl-2026-syllabus-exam-pattern': 17,
  'upsc-civil-services-2026': 62,
  'rrb-ntpc-2026-application-date-extension': 21,
};

/**
 * Builds a shift function for one seed: every date in the seed moves by the
 * same number of days, so the internal timeline survives.
 */
function shifterFor(seed: Seed): (value: string) => string {
  const target = Date.now() - (ANCHOR_DAYS_AGO[seed.slug] ?? 14) * DAY_MS;
  const published = Date.parse(seed.published);
  if (!Number.isFinite(published)) return (value) => value;

  const shiftDays = Math.round((target - published) / DAY_MS);
  if (shiftDays === 0) return (value) => value;

  return (value) =>
    value.replace(/\d{4}-\d{2}-\d{2}/g, (iso) => {
      const shifted = Date.parse(`${iso}T00:00:00Z`) + shiftDays * DAY_MS;
      return new Date(shifted).toISOString().slice(0, 10);
    });
}

/* ------------------------------------------------------------------------- */
/* Seed -> GovPost normalisation                                              */
/* ------------------------------------------------------------------------- */

function pick<T>(pair: [T, T], lang: Lang): T {
  return lang === 'hi' ? pair[1] : pair[0];
}

function buildDates(seed: Seed, lang: Lang, shift: (v: string) => string): DateRow[] {
  return seed.dates.map(([label, labelHi, value, emphasis]) => ({
    label: lang === 'hi' ? labelHi : label,
    value: shift(value),
    emphasis: emphasis === true,
  }));
}

function buildFees(seed: Seed, lang: Lang): FeeRow[] {
  return seed.fees.map(([category, categoryHi, amount]) => ({
    category: lang === 'hi' ? categoryHi : category,
    amount,
    free: isFree(amount),
  }));
}

function buildVacancy(seed: Seed, lang: Lang): VacancyRow[] {
  return seed.vacancyRows.map(([post, postHi, posts]) => ({
    post: lang === 'hi' ? postHi : post,
    posts,
  }));
}

function buildAge(seed: Seed, lang: Lang, shift: (v: string) => string): AgeLimit {
  const [min, max, asOn] = seed.age;
  return {
    min,
    max,
    asOn: asOn ? shift(asOn) : undefined,
    relaxation:
      lang === 'hi'
        ? 'एससी/एसटी 5 वर्ष, ओबीसी 3 वर्ष, दिव्यांग 10 वर्ष (नियमानुसार)'
        : 'SC/ST 5 years, OBC 3 years, PwBD 10 years as per government rules',
  };
}

/**
 * Body copy is composed from the structured ACF fields — which is how these
 * posts are actually written in wp-admin. The WYSIWYG `content` field from
 * WordPress, when present, is appended after this.
 */
function buildBody(seed: Seed, lang: Lang): string {
  const org = pick(seed.org, lang);
  const total = seed.vacancyTotal;
  if (lang === 'hi') {
    return `
<p><strong>${org}</strong> ने <strong>${pick(seed.title, 'hi')}</strong> के लिए आधिकारिक अधिसूचना जारी की है। इस भर्ती में कुल <strong>${total}</strong> रिक्तियां हैं। इच्छुक एवं पात्र अभ्यर्थी ऑनलाइन आवेदन कर सकते हैं।</p>
<p>आवेदन करने से पहले अभ्यर्थी अधिसूचना को ध्यानपूर्वक पढ़ें। पात्रता, आयु सीमा, शुल्क एवं महत्वपूर्ण तिथियां नीचे तालिका में दी गई हैं। सभी विवरण आधिकारिक अधिसूचना से मिलान करके ही आवेदन करें।</p>
<h3>महत्वपूर्ण बिंदु</h3>
<ul>
  <li>कुल रिक्तियां: <strong>${total}</strong></li>
  <li>शैक्षणिक योग्यता: ${pick(seed.qualification, 'hi')}</li>
  <li>नौकरी का स्थान: ${pick(seed.location, 'hi')}</li>
  <li>आवेदन प्रक्रिया पूर्णतः ऑनलाइन है।</li>
</ul>
<p><em>अस्वीकरण: उपरोक्त सभी जानकारी आधिकारिक अधिसूचना पर आधारित है। अंतिम पुष्टि हेतु आधिकारिक वेबसाइट देखें।</em></p>`.trim();
  }
  return `
<p><strong>${org}</strong> has released the official notification for <strong>${pick(seed.title, 'en')}</strong>. A total of <strong>${total}</strong> vacancies are notified under this recruitment. Eligible candidates can apply online through the official portal.</p>
<p>Read the official notification carefully before applying. Eligibility, age limit, application fee and important dates are tabulated below. Candidates are advised to cross-check every detail against the original notification.</p>
<h3>Key Highlights</h3>
<ul>
  <li>Total vacancies: <strong>${total}</strong></li>
  <li>Educational qualification: ${pick(seed.qualification, 'en')}</li>
  <li>Job location: ${pick(seed.location, 'en')}</li>
  <li>The entire application process is online.</li>
</ul>
<p><em>Disclaimer: All information above is sourced from the official notification. Verify the final details on the official website.</em></p>`.trim();
}

function buildHowToApply(seed: Seed, lang: Lang): string {
  const apply = seed.apply;
  if (lang === 'hi') {
    return `<ol>
<li>आधिकारिक वेबसाइट <a href="${apply}" rel="nofollow noopener" target="_blank">${apply}</a> पर जाएं।</li>
<li>नए उपयोगकर्ता "New Registration" लिंक से पंजीकरण करें और पंजीकरण संख्या एवं पासवर्ड प्राप्त करें।</li>
<li>लॉगिन करके आवेदन फॉर्म में मांगी गई जानकारी ध्यानपूर्वक भरें।</li>
<li>फोटो एवं हस्ताक्षर निर्धारित आकार एवं प्रारूप में अपलोड करें।</li>
<li>ऑनलाइन शुल्क का भुगतान करें (यदि लागू हो)। शुल्क का भुगतान डेबिट कार्ड, क्रेडिट कार्ड, नेट बैंकिंग अथवा यूपीआई से किया जा सकता है।</li>
<li>आवेदन फॉर्म को अंतिम रूप से सबमिट करें और भविष्य के संदर्भ हेतु एक प्रिंट कॉपी सुरक्षित रखें।</li>
</ol>
<p><strong>नोट:</strong> अंतिम तिथि के दिन वेबसाइट पर अत्यधिक ट्रैफिक के कारण तकनीकी समस्या हो सकती है। अतः आवेदन अंतिम तिथि से पहले पूरा करें।</p>`;
  }
  return `<ol>
<li>Open the official website at <a href="${apply}" rel="nofollow noopener" target="_blank">${apply}</a>.</li>
<li>New users should click "New Registration" and note down the registration number and password.</li>
<li>Log in and fill in the application form with accurate personal, educational and category details.</li>
<li>Upload a recent photograph and signature in the prescribed size and format.</li>
<li>Pay the application fee online, if applicable — debit card, credit card, net banking and UPI are accepted.</li>
<li>Submit the final application and take a printout of the confirmation page for future reference.</li>
</ol>
<p><strong>Note:</strong> Official websites often slow down on the last day due to heavy traffic. Complete your application well before the deadline.</p>`;
}

function buildContent(seed: Seed, lang: Lang): GovPost {
  const org = pick(seed.org, lang);
  const title = pick(seed.title, lang);
  // Every date in this post is shifted by the same amount, so the timeline
  // inside a notification is preserved while its position in the archive is
  // kept current.
  const shift = shifterFor(seed);
  const slug = seed.slug;
  return {
    id: 1000 + SEEDS.indexOf(seed),
    slug,
    type: seed.type,
    lang,
    title,
    excerpt: pick(seed.excerpt, lang),
    contentHtml: buildBody(seed, lang),
    organization: org,
    qualification: pick(seed.qualification, lang),
    jobLocation: pick(seed.location, lang),
    publishedAt: shift(seed.published),
    modifiedAt: shift(seed.published),
    importantDates: buildDates(seed, lang, shift),
    applicationFee: buildFees(seed, lang),
    ageLimit: buildAge(seed, lang, shift),
    vacancy: { total: seed.vacancyTotal, rows: buildVacancy(seed, lang) },
    officialWebsite: seed.site,
    notificationPdf: `${seed.site}#notification`,
    applyLink: seed.apply,
    howToApplyHtml: buildHowToApply(seed, lang),
    isFeatured: seed.featured === true,
    terms: [
      { id: 1, name: POST_TYPES[seed.type].label[lang], slug: seed.type, taxonomy: 'category' },
      { id: 2, name: org, slug: slugify(org), taxonomy: 'organization' },
    ],
    seo: {
      title: `${title} | ${org}`,
      description: pick(seed.excerpt, lang).slice(0, 158),
      canonical: `/${POST_TYPES[seed.type].slug}/${slug}`,
      robots: 'index, follow',
    },
  };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** All snapshot posts for a locale, newest first. */
export function snapshotPosts(lang: Lang): GovPost[] {
  return SEEDS.map((s) => buildContent(s, lang)).sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );
}

export const SNAPSHOT_COUNT = SEEDS.length;
