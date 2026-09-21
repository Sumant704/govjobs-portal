import type { Lang } from '@/lib/types';

/**
 * Static legal / informational pages.
 *
 * These are deliberately local rather than WordPress pages. AdSense and Google
 * both want these reachable, and putting them in the repo means they cannot be
 * accidentally unpublished, drafted, or broken by an editor mid-review.
 * If you would rather edit them in wp-admin, fetch `/wp-json/wp/v2/pages?slug=`
 * instead — the render path in `StaticPage.astro` is unchanged.
 */

export type StaticPageKey = 'about' | 'contact' | 'privacy-policy' | 'disclaimer' | 'terms';

export interface StaticPage {
  key: StaticPageKey;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  updated: string;
  body: Record<Lang, string>;
}

const DISCLAIMER_EN = `<p><strong>${'{SITE}'} is not a government website.</strong> We are an independent information portal. We are not affiliated with, endorsed by, or connected to any government department, commission, board, or recruitment agency.</p>
<p>All information published on this website — including notification details, vacancy counts, eligibility criteria, important dates, application fees, results, and admit card links — is collected from official notifications, press releases, and official websites, and is published in good faith for the convenience of candidates.</p>
<p>We take reasonable care to keep information accurate and current. However:</p>
<ul>
<li>Information may contain errors, omissions, or delays.</li>
<li>Official authorities may change dates, vacancy counts, or eligibility rules at any time without notice.</li>
<li>We cannot guarantee that any information on this website is complete or up to date at the moment you read it.</li>
</ul>
<p><strong>Always verify every detail on the official website of the recruiting organisation before applying.</strong> Do not rely on this website as your only source.</p>
<p>We are not responsible for any loss, damage, or inconvenience caused by acting on information published here.</p>`;

const DISCLAIMER_HI = `<p><strong>${'{SITE}'} कोई सरकारी वेबसाइट नहीं है।</strong> यह एक स्वतंत्र सूचना पोर्टल है। हम किसी भी सरकारी विभाग, आयोग, बोर्ड अथवा भर्ती एजेंसी से संबद्ध, अनुमोदित या जुड़े नहीं हैं।</p>
<p>इस वेबसाइट पर प्रकाशित समस्त जानकारी — अधिसूचना विवरण, रिक्तियों की संख्या, पात्रता मानदंड, महत्वपूर्ण तिथियां, आवेदन शुल्क, परिणाम एवं एडमिट कार्ड लिंक सहित — आधिकारिक अधिसूचनाओं, प्रेस विज्ञप्तियों एवं आधिकारिक वेबसाइटों से संकलित करके अभ्यर्थियों की सुविधा हेतु सद्भावपूर्वक प्रकाशित की जाती है।</p>
<p>हम जानकारी को सटीक एवं अद्यतन रखने का उचित प्रयास करते हैं। तथापि:</p>
<ul>
<li>जानकारी में त्रुटि, लोप अथवा विलंब हो सकता है।</li>
<li>आधिकारिक संस्थाएं बिना सूचना के तिथियां, रिक्तियों की संख्या अथवा पात्रता नियम कभी भी बदल सकती हैं।</li>
<li>हम यह सुनिश्चित नहीं कर सकते कि आपके पढ़ने के समय इस वेबसाइट की समस्त जानकारी पूर्ण अथवा अद्यतन है।</li>
</ul>
<p><strong>आवेदन करने से पूर्व प्रत्येक विवरण की पुष्टि भर्ती संस्था की आधिकारिक वेबसाइट पर अवश्य करें।</strong> केवल इस वेबसाइट पर निर्भर न रहें।</p>
<p>यहां प्रकाशित जानकारी के आधार पर किए गए किसी भी कार्य से होने वाली हानि, क्षति अथवा असुविधा के लिए हम उत्तरदायी नहीं हैं।`;

export const STATIC_PAGES: StaticPage[] = [
  {
    key: 'about',
    title: { en: 'About Us', hi: 'हमारे बारे में' },
    description: {
      en: 'Who we are, what we publish, and how our editorial process works.',
      hi: 'हम कौन हैं, क्या प्रकाशित करते हैं, और हमारी संपादकीय प्रक्रिया कैसे काम करती है।',
    },
    updated: '2026-04-01',
    body: {
      en: `<p>${'{SITE}'} is an independent information portal for government job notifications, exam results, admit cards, answer keys, syllabi and admission notices in India. Our goal is simple: put the details that actually matter — vacancies, eligibility, fees, dates — in one place, in a form you can scan in thirty seconds.</p>
<h2>What we publish</h2>
<p>Every post is structured, not free text. That means each notification carries a consistent set of tables: important dates, application fee by category, age limit with relaxation, vacancy breakdown by post, eligibility, and direct links to the official notification PDF and application portal.</p>
<h2>How we source content</h2>
<ol>
<li>We monitor official websites of recruitment boards, commissions, and universities.</li>
<li>Details are transcribed into our structured fields by an editor.</li>
<li>Every post carries the official source link, so you can verify it yourself in one click.</li>
<li>When an authority issues a corrigendum or extends a date, the existing post is updated — we do not publish a separate post, so the page you bookmarked stays correct.</li>
</ol>
<h2>What we are not</h2>
<p>We are not a government body, we do not accept applications, and we do not influence any recruitment process. We never charge candidates for information. If anyone asks you for money in our name, it is a scam — please report it to us.</p>
<h2>Corrections</h2>
<p>Spotted an error? Write to us with the post URL and the official source, and we will correct it and credit you.</p>`,
      hi: `<p>${'{SITE}'} भारत में सरकारी नौकरी की सूचनाओं, परीक्षा परिणाम, एडमिट कार्ड, उत्तर कुंजी, सिलेबस एवं प्रवेश सूचनाओं के लिए एक स्वतंत्र सूचना पोर्टल है। हमारा उद्देश्य सरल है: जो विवरण वास्तव में महत्वपूर्ण हैं — रिक्तियां, पात्रता, शुल्क, तिथियां — उन्हें एक ही स्थान पर ऐसे रूप में रखना जिसे आप तीस सेकंड में पढ़ सकें।</p>
<h2>हम क्या प्रकाशित करते हैं</h2>
<p>हमारी प्रत्येक पोस्ट व्यवस्थित होती है, स्वतंत्र पाठ नहीं। इसका अर्थ है कि प्रत्येक अधिसूचना में एक समान तालिकाएं होती हैं: महत्वपूर्ण तिथियां, वर्ग-वार आवेदन शुल्क, छूट सहित आयु सीमा, पद-वार रिक्ति विवरण, पात्रता, तथा आधिकारिक अधिसूचना PDF एवं आवेदन पोर्टल के सीधे लिंक।</p>
<h2>हम सामग्री कैसे एकत्र करते हैं</h2>
<ol>
<li>हम भर्ती बोर्डों, आयोगों एवं विश्वविद्यालयों की आधिकारिक वेबसाइटों की निगरानी करते हैं।</li>
<li>विवरण हमारे संपादक द्वारा व्यवस्थित फ़ील्ड में दर्ज किए जाते हैं।</li>
<li>प्रत्येक पोस्ट में आधिकारिक स्रोत लिंक होता है, जिससे आप स्वयं एक क्लिक में पुष्टि कर सकते हैं।</li>
<li>जब कोई संस्था शोधन जारी करती है अथवा तिथि बढ़ाती है, तो वर्तमान पोस्ट अद्यतन की जाती है — हम अलग पोस्ट नहीं बनाते, जिससे आपका बुकमार्क किया पृष्ठ सही बना रहता है।</li>
</ol>
<h2>हम क्या नहीं हैं</h2>
<p>हम सरकारी निकाय नहीं हैं, हम आवेदन स्वीकार नहीं करते, और हम किसी भर्ती प्रक्रिया को प्रभावित नहीं करते। हम अभ्यर्थियों से जानकारी के लिए कभी शुल्क नहीं लेते। यदि कोई हमारे नाम पर आपसे धन मांगता है, तो वह धोखाधड़ी है — कृपया हमें सूचित करें।</p>
<h2>सुधार</h2>
<p>कोई त्रुटि मिली? पोस्ट का URL एवं आधिकारिक स्रोत के साथ हमें लिखें, हम उसे ठीक करेंगे।</p>`,
    },
  },
  {
    key: 'contact',
    title: { en: 'Contact Us', hi: 'संपर्क करें' },
    description: {
      en: 'Reach the editorial team for corrections, content removal requests, or advertising.',
      hi: 'सुधार, सामग्री हटाने के अनुरोध अथवा विज्ञापन के लिए संपादकीय टीम से संपर्क करें।',
    },
    updated: '2026-04-01',
    body: {
      en: `<p>We read every message. For the fastest response, use the address that matches your reason for writing.</p>
<h2>Corrections and content issues</h2>
<p>Email <strong>${'{EMAIL}'}</strong> with the post URL and the official source showing the correct detail. Corrections are usually live within one working day.</p>
<h2>Content removal</h2>
<p>If you represent a government body and want a listing corrected or removed, write to <strong>${'{EMAIL}'}</strong> from an official domain. We act on verified requests promptly.</p>
<h2>Advertising and partnerships</h2>
<p>For display, sponsored placements, or bulk API access, write to <strong>${'{EMAIL}'}</strong> with the subject line “Advertising”.</p>
<h2>What we cannot help with</h2>
<ul>
<li>Application status, admit card issues, or result queries — contact the recruiting organisation.</li>
<li>Requests to change a result, merit position, or eligibility decision. We have no role in any recruitment process.</li>
<li>Free promotion of coaching institutes or paid job-placement services.</li>
</ul>
<h2>Response time</h2>
<p>We aim to reply within two working days. During peak result season this can stretch to four.</p>`,
      hi: `<p>हम प्रत्येक संदेश पढ़ते हैं। शीघ्र उत्तर हेतु अपने उद्देश्य से मेल खाते पते का उपयोग करें।</p>
<h2>सुधार एवं सामग्री संबंधी विषय</h2>
<p><strong>${'{EMAIL}'}</strong> पर पोस्ट का URL एवं सही विवरण दर्शाने वाला आधिकारिक स्रोत भेजें। सुधार सामान्यतः एक कार्यदिवस में लागू हो जाते हैं।</p>
<h2>सामग्री हटाना</h2>
<p>यदि आप किसी सरकारी निकाय का प्रतिनिधित्व करते हैं और कोई सूची ठीक कराना अथवा हटाना चाहते हैं, तो आधिकारिक डोमेन से <strong>${'{EMAIL}'}</strong> पर लिखें। सत्यापित अनुरोधों पर हम शीघ्र कार्रवाई करते हैं।</p>
<h2>विज्ञापन एवं साझेदारी</h2>
<p>डिस्प्ले, प्रायोजित प्लेसमेंट अथवा बल्क API एक्सेस हेतु “Advertising” विषय के साथ <strong>${'{EMAIL}'}</strong> पर लिखें।</p>
<h2>हम किन विषयों में सहायता नहीं कर सकते</h2>
<ul>
<li>आवेदन की स्थिति, एडमिट कार्ड संबंधी समस्या अथवा परिणाम से जुड़े प्रश्न — भर्ती संस्था से संपर्क करें।</li>
<li>परिणाम, मेरिट स्थान अथवा पात्रता निर्णय बदलने के अनुरोध। किसी भर्ती प्रक्रिया में हमारी कोई भूमिका नहीं है।</li>
<li>कोचिंग संस्थानों अथवा सशुल्क नौकरी-प्लेसमेंट सेवाओं का निःशुल्क प्रचार।</li>
</ul>
<h2>उत्तर देने का समय</h2>
<p>हम दो कार्यदिवसों में उत्तर देने का प्रयास करते हैं। परिणाम के व्यस्त मौसम में यह चार दिन तक हो सकता है।</p>`,
    },
  },
  {
    key: 'privacy-policy',
    title: { en: 'Privacy Policy', hi: 'गोपनीयता नीति' },
    description: {
      en: 'What data we collect, why, and how advertising cookies work on this site.',
      hi: 'हम कौन-सा डेटा एकत्र करते हैं, क्यों, तथा इस साइट पर विज्ञापन कुकीज़ कैसे काम करती हैं।',
    },
    updated: '2026-04-01',
    body: {
      en: `<p>This policy explains what information ${'{SITE}'} collects when you visit, and what we do with it. Last updated ${'{DATE}'}.</p>
<h2>Information you give us</h2>
<p>We only receive personal information if you send it to us — for example by emailing a correction. That is your name, email address, and whatever you choose to write. We use it to reply and nothing else. We do not sell it.</p>
<h2>Information collected automatically</h2>
<p>Like most websites we log standard technical data: IP address, browser and device type, referring page, and the pages you visit. This is used in aggregate to understand which categories are popular and to detect abuse. It is not used to identify you personally.</p>
<h2>Cookies</h2>
<p>We use a small number of functional cookies and browser storage keys:</p>
<ul>
<li><strong>theme</strong> — remembers whether you chose light or dark mode.</li>
<li><strong>Analytics</strong> — if enabled, aggregated page-view statistics.</li>
<li><strong>Advertising</strong> — set by Google AdSense, described below.</li>
</ul>
<p>You can clear these at any time from your browser settings. Blocking them will not stop the site working.</p>
<h2>Google AdSense and third-party advertising</h2>
<p>This site displays advertising served by Google AdSense. Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this and other websites. Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the internet.</p>
<p>You may opt out of personalised advertising by visiting <a href="https://www.google.com/settings/ads" rel="nofollow noopener" target="_blank">Google Ads Settings</a>, or opt out of third-party vendor cookies at <a href="https://www.aboutads.info/choices/" rel="nofollow noopener" target="_blank">aboutads.info</a>. In the EEA, UK and Switzerland, consent for personalised advertising is requested before any such cookie is set.</p>
<h2>Analytics</h2>
<p>If analytics is enabled we use IP anonymisation and do not enable advertising features or cross-site tracking.</p>
<h2>Children</h2>
<p>This site is intended for job seekers aged 18 and above. We do not knowingly collect data from children.</p>
<h2>Your rights</h2>
<p>You may request a copy of any personal data we hold about you, or ask us to delete it, by emailing <strong>${'{EMAIL}'}</strong>. We will respond within 30 days.</p>
<h2>Changes</h2>
<p>If this policy changes materially we will update the date at the top of this page.</p>`,
      hi: `<p>यह नीति बताती है कि ${'{SITE}'} पर आने पर हम कौन-सी जानकारी एकत्र करते हैं और उसका क्या उपयोग करते हैं। अंतिम अद्यतन ${'{DATE}'}।</p>
<h2>आपके द्वारा दी गई जानकारी</h2>
<p>व्यक्तिगत जानकारी हमें केवल तभी प्राप्त होती है जब आप स्वयं भेजते हैं — जैसे सुधार हेतु ईमेल करना। इसमें आपका नाम, ईमेल पता एवं आपका लिखा हुआ सम्मिलित होता है। हम इसका उपयोग केवल उत्तर देने हेतु करते हैं। हम इसे नहीं बेचते।</p>
<h2>स्वतः एकत्र की जाने वाली जानकारी</h2>
<p>अन्य वेबसाइटों की भांति हम मानक तकनीकी डेटा दर्ज करते हैं: IP पता, ब्राउज़र एवं डिवाइस प्रकार, रेफरल पृष्ठ तथा आपके द्वारा देखे गए पृष्ठ। इसका उपयोग समग्र रूप में यह समझने हेतु किया जाता है कि कौन-सी श्रेणियां लोकप्रिय हैं तथा दुरुपयोग का पता लगाने हेतु। इससे आपकी व्यक्तिगत पहचान नहीं की जाती।</p>
<h2>कुकीज़</h2>
<p>हम कुछ सीमित कार्यात्मक कुकीज़ एवं ब्राउज़र स्टोरेज का उपयोग करते हैं:</p>
<ul>
<li><strong>theme</strong> — आपकी लाइट अथवा डार्क मोड पसंद याद रखता है।</li>
<li><strong>एनालिटिक्स</strong> — सक्रिय होने पर समग्र पृष्ठ-दृश्य आंकड़े।</li>
<li><strong>विज्ञापन</strong> — गूगल एडसेंस द्वारा सेट, नीचे वर्णित।</li>
</ul>
<p>आप इन्हें कभी भी ब्राउज़र सेटिंग्स से हटा सकते हैं। इन्हें अवरुद्ध करने पर भी साइट काम करती रहेगी।</p>
<h2>गूगल एडसेंस एवं तृतीय-पक्ष विज्ञापन</h2>
<p>इस साइट पर गूगल एडसेंस द्वारा विज्ञापन प्रदर्शित किए जाते हैं। गूगल सहित तृतीय-पक्ष विक्रेता कुकीज़ का उपयोग करके इस तथा अन्य वेबसाइटों पर आपकी पूर्व यात्राओं के आधार पर विज्ञापन दिखाते हैं। आप <a href="https://www.google.com/settings/ads" rel="nofollow noopener" target="_blank">गूगल विज्ञापन सेटिंग्स</a> पर जाकर वैयक्तिकृत विज्ञापन से बाहर निकल सकते हैं।</p>
<h2>एनालिटिक्स</h2>
<p>एनालिटिक्स सक्रिय होने पर हम IP अनामीकरण का उपयोग करते हैं तथा विज्ञापन सुविधाएं अथवा क्रॉस-साइट ट्रैकिंग सक्षम नहीं करते।</p>
<h2>बच्चे</h2>
<p>यह साइट 18 वर्ष एवं उससे अधिक आयु के नौकरी चाहने वालों के लिए है। हम जानबूझकर बच्चों से डेटा एकत्र नहीं करते।</p>
<h2>आपके अधिकार</h2>
<p>आप अपने बारे में रखे गए व्यक्तिगत डेटा की प्रति मांग सकते हैं अथवा उसे हटाने का अनुरोध कर सकते हैं — <strong>${'{EMAIL}'}</strong> पर लिखें। हम 30 दिनों में उत्तर देंगे।</p>
<h2>परिवर्तन</h2>
<p>इस नीति में महत्वपूर्ण परिवर्तन होने पर हम इस पृष्ठ के शीर्ष पर दी गई तिथि अद्यतन करेंगे।</p>`,
    },
  },
  {
    key: 'disclaimer',
    title: { en: 'Disclaimer', hi: 'अस्वीकरण' },
    description: {
      en: 'This is an independent information portal, not a government website. Verify all details officially.',
      hi: 'यह एक स्वतंत्र सूचना पोर्टल है, सरकारी वेबसाइट नहीं। सभी विवरण आधिकारिक रूप से सत्यापित करें।',
    },
    updated: '2026-04-01',
    body: { en: DISCLAIMER_EN, hi: DISCLAIMER_HI },
  },
  {
    key: 'terms',
    title: { en: 'Terms & Conditions', hi: 'नियम एवं शर्तें' },
    description: {
      en: 'The terms on which you may use this website.',
      hi: 'इस वेबसाइट के उपयोग की शर्तें।',
    },
    updated: '2026-04-01',
    body: {
      en: `<p>By using ${'{SITE}'} you agree to these terms. If you do not agree, please do not use the site.</p>
<h2>1. Informational purpose only</h2>
<p>This website publishes information about government recruitment and examinations. It is not a government website and does not represent any government body. Nothing here constitutes legal, career, or professional advice.</p>
<h2>2. Accuracy</h2>
<p>We publish information in good faith sourced from official notifications, but we make no warranty that it is accurate, complete, or current. You are responsible for verifying all details on the official website of the recruiting organisation before acting on them.</p>
<h2>3. No liability</h2>
<p>To the maximum extent permitted by law, we are not liable for any direct, indirect, incidental, or consequential loss arising from your use of this website or reliance on its content — including missed deadlines, rejected applications, or lost opportunities.</p>
<h2>4. Intellectual property</h2>
<p>The layout, structure, and original written content of this website belong to us. Government notifications, logos, and official documents remain the property of their respective authorities and are referenced here for informational purposes.</p>
<h2>5. Acceptable use</h2>
<p>You agree not to scrape the site at a rate that degrades service for others, not to attempt to gain unauthorised access to any system, and not to republish substantial portions of our content without written permission.</p>
<h2>6. Third-party links</h2>
<p>We link to official websites and third-party services. We do not control them and are not responsible for their content, availability, or privacy practices.</p>
<h2>7. Advertising</h2>
<p>This site is supported by advertising, including Google AdSense. Advertisements are clearly distinguishable from editorial content. We do not endorse advertised products or services.</p>
<h2>8. Changes</h2>
<p>We may update these terms at any time. Continued use of the site after a change constitutes acceptance.</p>
<h2>9. Governing law</h2>
<p>These terms are governed by the laws of India, with exclusive jurisdiction in the courts of New Delhi.</p>`,
      hi: `<p>${'{SITE}'} का उपयोग करके आप इन शर्तों से सहमत होते हैं। यदि आप सहमत नहीं हैं, तो कृपया साइट का उपयोग न करें।</p>
<h2>1. केवल सूचना हेतु</h2>
<p>यह वेबसाइट सरकारी भर्ती एवं परीक्षाओं की जानकारी प्रकाशित करती है। यह सरकारी वेबसाइट नहीं है और किसी सरकारी निकाय का प्रतिनिधित्व नहीं करती। यहां कुछ भी कानूनी, करियर अथवा व्यावसायिक सलाह नहीं है।</p>
<h2>2. सटीकता</h2>
<p>हम आधिकारिक अधिसूचनाओं से सद्भावपूर्वक जानकारी प्रकाशित करते हैं, परंतु इसकी सटीकता, पूर्णता अथवा समसामयिकता की कोई गारंटी नहीं देते। कार्रवाई से पूर्व भर्ती संस्था की आधिकारिक वेबसाइट पर सभी विवरण सत्यापित करना आपकी जिम्मेदारी है।</p>
<h2>3. कोई दायित्व नहीं</h2>
<p>कानून द्वारा अनुमत अधिकतम सीमा तक, इस वेबसाइट के उपयोग अथवा इसकी सामग्री पर निर्भरता से उत्पन्न किसी भी प्रत्यक्ष, अप्रत्यक्ष अथवा परिणामी हानि के लिए हम उत्तरदायी नहीं हैं — जिसमें अंतिम तिथि चूकना, आवेदन अस्वीकृत होना अथवा अवसर का हनन सम्मिलित है।</p>
<h2>4. बौद्धिक संपदा</h2>
<p>इस वेबसाइट का लेआउट, संरचना एवं मौलिक लिखित सामग्री हमारी है। सरकारी अधिसूचनाएं, लोगो एवं आधिकारिक दस्तावेज अपने-अपने प्राधिकरणों की संपत्ति हैं तथा यहां केवल सूचना हेतु संदर्भित हैं।</p>
<h2>5. स्वीकार्य उपयोग</h2>
<p>आप सहमत हैं कि आप साइट को ऐसी दर से स्क्रैप नहीं करेंगे जिससे अन्य उपयोगकर्ताओं की सेवा प्रभावित हो, किसी सिस्टम में अनधिकृत प्रवेश का प्रयास नहीं करेंगे, तथा लिखित अनुमति के बिना हमारी सामग्री के बड़े भाग को पुनःप्रकाशित नहीं करेंगे।</p>
<h2>6. तृतीय-पक्ष लिंक</h2>
<p>हम आधिकारिक वेबसाइटों एवं तृतीय-पक्ष सेवाओं के लिंक देते हैं। उन पर हमारा नियंत्रण नहीं है और उनकी सामग्री, उपलब्धता अथवा गोपनीयता प्रथाओं के लिए हम उत्तरदायी नहीं हैं।</p>
<h2>7. विज्ञापन</h2>
<p>यह साइट विज्ञापन, जिसमें गूगल एडसेंस सम्मिलित है, द्वारा संचालित है। विज्ञापन संपादकीय सामग्री से स्पष्ट रूप से भिन्न होते हैं। हम विज्ञापित उत्पादों अथवा सेवाओं का समर्थन नहीं करते।</p>
<h2>8. परिवर्तन</h2>
<p>हम इन शर्तों को कभी भी अद्यतन कर सकते हैं। परिवर्तन के बाद साइट का निरंतर उपयोग स्वीकृति माना जाएगा।</p>
<h2>9. शासी कानून</h2>
<p>ये शर्तें भारत के कानूनों द्वारा शासित हैं, तथा विशेष क्षेत्राधिकार नई दिल्ली के न्यायालयों का होगा।</p>`,
    },
  },
];

export function getStaticPage(key: StaticPageKey): StaticPage | undefined {
  return STATIC_PAGES.find((page) => page.key === key);
}

/**
 * Replaces the placeholders in the bodies above with live values, so the
 * privacy policy and contact page never drift from the configured site name
 * or contact address.
 */
export function renderStaticBody(
  page: StaticPage,
  lang: Lang,
  values: { site: string; email: string },
): string {
  return page.body[lang]
    .replaceAll('{SITE}', values.site)
    .replaceAll('{EMAIL}', values.email)
    .replaceAll('{DATE}', page.updated);
}

export function renderStaticDescription(page: StaticPage, lang: Lang, site: string): string {
  return page.description[lang].replaceAll('{SITE}', site);
}
