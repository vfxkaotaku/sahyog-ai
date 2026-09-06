/**
 * aiService.ts — SAHYOG AI
 *
 * Demo AI Response Engine
 * Architecture: Chat UI → ChatStore → aiService (demo) → AIResponse
 *                                   → /api/chat (future real backend)
 *
 * Anti-hallucination: All responses cite demo sources.
 * No government facts are invented — all data is clearly marked [DEMO].
 */

import type { AIResponse, Language, SourceMetadata } from '../types';

// ─── Camera-intent keywords ───────────────────────────────────────────────────
const CAMERA_KEYWORDS = [
  'read this', 'scan', 'circular', 'poster', 'notice', 'document', 'pamphlet',
  'kya likha', 'काय लिहिले', 'काय आहे', 'यात काय', 'हे काय', 'explain this',
  'what does this say', 'padhna hai', 'पढ़ना', 'वाचा', 'image', 'photo',
];

function requiresCamera(query: string): boolean {
  const lower = query.toLowerCase();
  return CAMERA_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── Category matcher ─────────────────────────────────────────────────────────
type Category =
  | 'cropInsurance'
  | 'cooperative'
  | 'financial'
  | 'grievance'
  | 'document'
  | 'kcc'
  | 'pmkisan'
  | 'pacs'
  | 'legal'
  | 'general';

function matchCategory(query: string): Category {
  const q = query.toLowerCase();

  if (/pmfby|fasal bima|crop insurance|pik vima|पिक विमा|फसल बीमा/.test(q)) return 'cropInsurance';
  if (/pm.?kisan|kisan samman|किसान सम्मान|किसान निधि|pm किसान/.test(q)) return 'pmkisan';
  if (/kcc|kisan credit|kisan card|किसान क्रेडिट|किसान कार्ड|शेतकरी पतपत्र/.test(q)) return 'kcc';
  if (/pacs|primary agri|प्राथमिक कृषि|प्राथमिक शेती|पैक्स/.test(q)) return 'pacs';
  if (/cooperative|sahakari|सहकारी|सहकार|bylaw|bye.?law|नियम|अधिनियम/.test(q)) return 'cooperative';
  if (/legal|law|act|adhikaar|हक|अधिकार|कायदा|kanoon|कानून/.test(q)) return 'legal';
  if (/financial|literacy|interest|loan|ब्याज|व्याज|loan|कर्ज|ऋण|बचत|saving/.test(q)) return 'financial';
  if (/grievance|complaint|shikayat|तक्रार|शिकायत/.test(q)) return 'grievance';
  if (/document|form|7\/12|satbara|सातबारा|aadhaar|आधार|ration|राशन/.test(q)) return 'document';

  return 'general';
}

// ─── Demo sources ─────────────────────────────────────────────────────────────
const SOURCES: Record<string, SourceMetadata> = {
  pmfby: {
    department: 'Ministry of Agriculture & Farmers Welfare',
    documentTitle: 'Pradhan Mantri Fasal Bima Yojana — Operational Guidelines 2023',
    officialUrl: 'https://pmfby.gov.in',
    publicationDate: 'January 2023',
    isVerified: true,
  },
  pmkisan: {
    department: 'Ministry of Agriculture & Farmers Welfare',
    documentTitle: 'PM-KISAN Samman Nidhi — Farmer Registration Guidelines',
    officialUrl: 'https://pmkisan.gov.in',
    publicationDate: 'March 2024',
    isVerified: true,
  },
  kcc: {
    department: 'Reserve Bank of India & NABARD',
    documentTitle: 'Kisan Credit Card Scheme — Revised Guidelines 2022',
    officialUrl: 'https://www.nabard.org/content1.aspx?id=580',
    publicationDate: 'February 2022',
    isVerified: true,
  },
  cooperative: {
    department: 'Ministry of Cooperation, Government of India',
    documentTitle: 'Multi-State Cooperative Societies Act (MSCS) 2002 — Amended 2023',
    officialUrl: 'https://mscs.dac.gov.in',
    publicationDate: 'August 2023',
    isVerified: true,
  },
  pacs: {
    department: 'NABARD & Ministry of Cooperation',
    documentTitle: 'PACS Computerization Programme — Implementation Guidelines',
    officialUrl: 'https://www.nabard.org/pacs-computerization.aspx',
    publicationDate: 'June 2023',
    isVerified: true,
  },
  maharashtra: {
    department: 'Maharashtra State Cooperative Department',
    documentTitle: 'Maharashtra Co-operative Societies Act 1960 — Revised Bye-laws 2022',
    officialUrl: 'https://cooperation.maharashtra.gov.in',
    publicationDate: 'September 2022',
    isVerified: true,
  },
};

// ─── Trilingual response database ─────────────────────────────────────────────
type ResponseEntry = {
  content: string;
  suggestions: string[];
  sources: SourceMetadata[];
  canPrint: boolean;
};

const RESPONSES: Record<Category, Record<Language, ResponseEntry>> = {
  cropInsurance: {
    en: {
      content: `🌾 **Pradhan Mantri Fasal Bima Yojana (PMFBY)**

PMFBY is India's flagship crop insurance scheme protecting farmers from crop losses due to natural calamities.

**Key Features:**
• Kharif crops: 2% of Sum Insured (farmer premium)
• Rabi crops: 1.5% of Sum Insured
• Commercial/Horticultural crops: 5%
• Government pays the remaining premium on your behalf
• Covers losses from sowing to post-harvest for 14 days

**Who is eligible:**
All farmers (loanee & non-loanee) growing notified crops in notified areas.

**How to apply:**
Visit your nearest bank branch, CSC centre, or register online at pmfby.gov.in before the cut-off date.

⚠️ [DEMO] This response uses illustrative information. Please verify current premium rates and enrollment dates at your district agriculture office.`,
      suggestions: ['How to claim PMFBY?', 'What documents are needed for PMFBY?', 'What crops are covered?'],
      sources: [SOURCES.pmfby],
      canPrint: true,
    },
    hi: {
      content: `🌾 **प्रधानमंत्री फसल बीमा योजना (PMFBY)**

PMFBY भारत की प्रमुख फसल बीमा योजना है जो किसानों को प्राकृतिक आपदाओं से फसल नुकसान से बचाती है।

**मुख्य विशेषताएं:**
• खरीफ फसलें: बीमित राशि का 2% (किसान प्रीमियम)
• रबी फसलें: 1.5%
• बागवानी फसलें: 5%
• शेष प्रीमियम सरकार भरती है
• बुवाई से कटाई के 14 दिन बाद तक नुकसान कवर

**पात्रता:**
सभी किसान (ऋणी और गैर-ऋणी) जो अधिसूचित क्षेत्रों में अधिसूचित फसलें उगाते हैं।

**आवेदन:**
नजदीकी बैंक शाखा, CSC केंद्र पर जाएं या pmfby.gov.in पर ऑनलाइन पंजीकरण करें।

⚠️ [डेमो] यह उत्तर प्रदर्शनात्मक जानकारी पर आधारित है। कृपया अपने जिला कृषि कार्यालय से सत्यापित करें।`,
      suggestions: ['PMFBY दावा कैसे करें?', 'कौन से दस्तावेज चाहिए?', 'कौन सी फसलें शामिल हैं?'],
      sources: [SOURCES.pmfby],
      canPrint: true,
    },
    mr: {
      content: `🌾 **प्रधानमंत्री पिक विमा योजना (PMFBY)**

PMFBY ही भारताची प्रमुख पिक विमा योजना आहे जी शेतकऱ्यांना नैसर्गिक आपत्तींमुळे पिक नुकसानापासून संरक्षण देते.

**मुख्य वैशिष्ट्ये:**
• खरीप पिके: विम्याच्या रकमेच्या 2% (शेतकरी हप्ता)
• रब्बी पिके: 1.5%
• बागायती पिके: 5%
• उर्वरित हप्ता सरकार भरते
• पेरणीपासून काढणीनंतर 14 दिवसांपर्यंत नुकसान कव्हर

**पात्रता:**
सर्व शेतकरी (कर्जदार व बिगर-कर्जदार) जे अधिसूचित क्षेत्रात अधिसूचित पिके घेतात.

**अर्ज:**
जवळच्या बँक शाखा, CSC केंद्रावर जा किंवा pmfby.gov.in वर ऑनलाइन नोंदणी करा.

⚠️ [डेमो] हे उत्तर प्रात्यक्षिक माहितीवर आधारित आहे. कृपया तुमच्या जिल्हा कृषी कार्यालयात सत्यापित करा.`,
      suggestions: ['PMFBY दावा कसा करायचा?', 'कोणती कागदपत्रे लागतात?', 'कोणती पिके समाविष्ट आहेत?'],
      sources: [SOURCES.pmfby],
      canPrint: true,
    },
  },

  pmkisan: {
    en: {
      content: `🧑‍🌾 **PM Kisan Samman Nidhi (PM-KISAN)**

PM-KISAN provides direct income support to farmer families across India.

**Benefits:**
• ₹6,000 per year paid in 3 equal instalments of ₹2,000
• Transferred directly to bank account via DBT
• Covers all landholding farmer families

**Who is NOT eligible:**
• Farmers paying income tax
• Retired/serving government employees
• Professionals (doctors, engineers, lawyers, etc.)

**Registration:**
Register online at pmkisan.gov.in or visit your nearest CSC centre with Aadhaar, bank passbook, and land records.

⚠️ [DEMO] Verify eligibility and current instalment status at pmkisan.gov.in`,
      suggestions: ['How to check PM-KISAN instalment status?', 'What is KCC loan?', 'What is PMFBY?'],
      sources: [SOURCES.pmkisan],
      canPrint: true,
    },
    hi: {
      content: `🧑‍🌾 **पीएम किसान सम्मान निधि (PM-KISAN)**

PM-KISAN भारत भर में किसान परिवारों को सीधे आय सहायता प्रदान करती है।

**लाभ:**
• ₹6,000 प्रति वर्ष, 3 किश्तों में ₹2,000 प्रत्येक
• DBT के माध्यम से बैंक खाते में सीधे ट्रांसफर
• सभी भूमिधारक किसान परिवार शामिल

**कौन पात्र नहीं:**
• आयकर देने वाले किसान
• सेवानिवृत्त/सेवारत सरकारी कर्मचारी
• पेशेवर लोग

⚠️ [डेमो] pmkisan.gov.in पर पात्रता और किश्त स्थिति सत्यापित करें।`,
      suggestions: ['PM-KISAN किश्त की जांच कैसे करें?', 'KCC लोन क्या है?', 'PMFBY क्या है?'],
      sources: [SOURCES.pmkisan],
      canPrint: true,
    },
    mr: {
      content: `🧑‍🌾 **पीएम किसान सन्मान निधी (PM-KISAN)**

PM-KISAN संपूर्ण भारतातील शेतकरी कुटुंबांना थेट उत्पन्न सहाय्य प्रदान करते.

**फायदे:**
• दरवर्षी ₹6,000, ₹2,000 च्या 3 हप्त्यांमध्ये
• DBT द्वारे बँक खात्यात थेट हस्तांतरण
• सर्व जमीनधारक शेतकरी कुटुंबे समाविष्ट

**कोण पात्र नाही:**
• आयकर भरणारे शेतकरी
• निवृत्त/सेवारत सरकारी कर्मचारी
• व्यावसायिक

⚠️ [डेमो] pmkisan.gov.in वर पात्रता आणि हप्त्याची स्थिती तपासा.`,
      suggestions: ['PM-KISAN हप्ता कसा तपासायचा?', 'KCC कर्ज काय आहे?', 'PMFBY काय आहे?'],
      sources: [SOURCES.pmkisan],
      canPrint: true,
    },
  },

  kcc: {
    en: {
      content: `💳 **Kisan Credit Card (KCC)**

KCC provides farmers with flexible, revolving credit for agricultural needs at concessional interest rates.

**Key Features:**
• Short-term credit limit based on land holding & crop pattern
• Interest subvention: Effective rate as low as 4% p.a. for prompt repayment
• Covers: Seeds, fertilisers, pesticides, post-harvest, maintenance
• Also covers consumption needs and asset maintenance

**Eligibility:**
All farmers, tenant farmers, oral lessees, sharecroppers, and SHGs.

**How to Apply:**
Visit your nearest PACS, Commercial Bank, or Regional Rural Bank (RRB) with: Land records, Aadhaar, Passport photo, and loan application form.

⚠️ [DEMO] Verify current interest rates with your bank.`,
      suggestions: ['PMFBY crop insurance?', 'PM-KISAN details?', 'How to register at PACS?'],
      sources: [SOURCES.kcc],
      canPrint: true,
    },
    hi: {
      content: `💳 **किसान क्रेडिट कार्ड (KCC)**

KCC किसानों को रियायती ब्याज दरों पर कृषि आवश्यकताओं के लिए लचीला ऋण प्रदान करता है।

**मुख्य विशेषताएं:**
• भूमि और फसल के आधार पर क्रेडिट सीमा
• ब्याज सब्सिडी: समय पर चुकाने पर प्रभावी दर 4% तक
• बीज, खाद, कीटनाशक, कटाई के बाद के खर्च शामिल

**पात्रता:**
सभी किसान, काश्तकार, बटाईदार और SHG।

⚠️ [डेमो] वर्तमान ब्याज दरों के लिए अपने बैंक से संपर्क करें।`,
      suggestions: ['PMFBY फसल बीमा?', 'PM-KISAN विवरण?', 'PACS में पंजीकरण?'],
      sources: [SOURCES.kcc],
      canPrint: true,
    },
    mr: {
      content: `💳 **किसान क्रेडिट कार्ड (KCC)**

KCC शेतकऱ्यांना कृषी गरजांसाठी सवलतीच्या व्याजदराने लवचिक पत उपलब्ध करून देते.

**मुख्य वैशिष्ट्ये:**
• जमीन व पीक पद्धतीनुसार पत मर्यादा
• व्याज अनुदान: वेळेवर परतफेडीसाठी 4% पर्यंत प्रभावी दर
• बियाणे, खते, कीटकनाशके, कापणीनंतरचे खर्च समाविष्ट

⚠️ [डेमो] सध्याच्या व्याजदरांसाठी तुमच्या बँकेशी संपर्क साधा.`,
      suggestions: ['PMFBY पिक विमा?', 'PM-KISAN तपशील?', 'PACS मध्ये नोंदणी?'],
      sources: [SOURCES.kcc],
      canPrint: true,
    },
  },

  pacs: {
    en: {
      content: `🏦 **Primary Agricultural Credit Societies (PACS)**

PACS are the grassroots-level cooperative institutions providing credit and other services to farmers.

**Services provided by PACS:**
• Short-term agricultural credit
• Input supply (seeds, fertilisers)
• Procurement and marketing support
• Ration card distribution (in some states)
• Computerization through NABARD scheme (63,000 PACS digitized)

**Membership:**
Any farmer in the operational area can become a member by purchasing shares.

**PACS Computerization (2023):**
Under a central scheme, 63,000 PACS are being computerized with ERP software for transparent records, audit trails, and digital loan processing.

⚠️ [DEMO] Visit your nearest PACS office for membership and services.`,
      suggestions: ['What is KCC through PACS?', 'What is cooperative society?', 'How to file grievance?'],
      sources: [SOURCES.pacs],
      canPrint: true,
    },
    hi: {
      content: `🏦 **प्राथमिक कृषि ऋण समिति (PACS)**

PACS जमीनी स्तर की सहकारी संस्थाएं हैं जो किसानों को ऋण और अन्य सेवाएं प्रदान करती हैं।

**PACS द्वारा प्रदान सेवाएं:**
• अल्पकालिक कृषि ऋण
• इनपुट आपूर्ति (बीज, खाद)
• खरीद और विपणन सहायता
• डिजिटाइजेशन: 63,000 PACS का कम्प्यूटरीकरण

⚠️ [डेमो] सदस्यता और सेवाओं के लिए नजदीकी PACS कार्यालय जाएं।`,
      suggestions: ['PACS से KCC?', 'सहकारी समिति क्या है?', 'शिकायत कैसे दर्ज करें?'],
      sources: [SOURCES.pacs],
      canPrint: true,
    },
    mr: {
      content: `🏦 **प्राथमिक शेती पतसंस्था (PACS)**

PACS या तळागाळातील सहकारी संस्था शेतकऱ्यांना पत व इतर सेवा पुरवतात.

**PACS द्वारे दिल्या जाणाऱ्या सेवा:**
• अल्पमुदतीचे शेती कर्ज
• बियाणे, खते पुरवठा
• खरेदी व विपणन सहाय्य
• NABARD योजनेद्वारे संगणकीकरण (63,000 PACS)

⚠️ [डेमो] सदस्यत्व व सेवांसाठी जवळच्या PACS कार्यालयात जा.`,
      suggestions: ['PACS द्वारे KCC?', 'सहकारी संस्था काय आहे?', 'तक्रार कशी दाखल करायची?'],
      sources: [SOURCES.pacs],
      canPrint: true,
    },
  },

  cooperative: {
    en: {
      content: `🤝 **Cooperative Societies — Governance & Rules**

A cooperative society is a voluntary, democratic member-owned organization operating for collective economic benefit.

**Types of Cooperatives:**
• Agricultural Credit (PACS, DCCBs)
• Dairy (Amul model)
• Housing Cooperatives
• Consumer Cooperatives
• Multi-State Cooperative Societies (MSCS Act 2002, amended 2023)

**Democratic Principles:**
• One member, one vote
• Open and voluntary membership
• Profits distributed as dividends to members

**Registration (Maharashtra):**
Under Maharashtra Co-operative Societies Act 1960. Contact your District Deputy Registrar of Cooperative Societies.

**Recent Reform (2023):**
New MSCS Act strengthens governance, mandatory elections through cooperative electoral authority, and enhanced audit transparency.

⚠️ [DEMO] Rules vary by state. Contact your District Cooperative Department for local regulations.`,
      suggestions: ['What is PACS?', 'How to register a cooperative?', 'Cooperative law in Maharashtra?'],
      sources: [SOURCES.cooperative, SOURCES.maharashtra],
      canPrint: true,
    },
    hi: {
      content: `🤝 **सहकारी समितियां — शासन और नियम**

सहकारी समिति एक स्वैच्छिक, लोकतांत्रिक सदस्य-स्वामित्व वाला संगठन है।

**प्रकार:**
• कृषि ऋण (PACS, DCCBs)
• डेयरी (अमूल मॉडल)
• आवास, उपभोक्ता
• बहु-राज्य सहकारी (MSCS अधिनियम 2002)

**लोकतांत्रिक सिद्धांत:**
• एक सदस्य, एक वोट
• खुली और स्वैच्छिक सदस्यता

**हालिया सुधार (2023):**
नए MSCS अधिनियम से शासन मजबूत, अनिवार्य चुनाव, और ऑडिट पारदर्शिता।

⚠️ [डेमो] नियम राज्य के अनुसार भिन्न हो सकते हैं।`,
      suggestions: ['PACS क्या है?', 'सहकारी कैसे पंजीकृत करें?', 'महाराष्ट्र में सहकारी कानून?'],
      sources: [SOURCES.cooperative, SOURCES.maharashtra],
      canPrint: true,
    },
    mr: {
      content: `🤝 **सहकारी संस्था — प्रशासन व नियम**

सहकारी संस्था ही स्वैच्छिक, लोकशाही सदस्य-मालकीची संस्था आहे.

**प्रकार:**
• शेती पत (PACS, DCCBs)
• दुग्धव्यवसाय (अमूल मॉडेल)
• गृहनिर्माण, ग्राहक
• बहु-राज्य सहकारी (MSCS कायदा 2002)

**लोकशाही तत्त्वे:**
• एक सदस्य, एक मत
• खुली व स्वैच्छिक सदस्यता

**अलीकडील सुधारणा (2023):**
नवीन MSCS कायद्याने प्रशासन बळकट, अनिवार्य निवडणुका, ऑडिट पारदर्शकता.

⚠️ [डेमो] नियम राज्यानुसार बदलतात. स्थानिक नियमांसाठी जिल्हा सहकार विभागाशी संपर्क साधा.`,
      suggestions: ['PACS काय आहे?', 'सहकारी संस्था कशी नोंदवायची?', 'महाराष्ट्रातील सहकार कायदा?'],
      sources: [SOURCES.cooperative, SOURCES.maharashtra],
      canPrint: true,
    },
  },

  legal: {
    en: {
      content: `⚖️ **Cooperative Legal Rights & Bylaws**

Cooperative members have important legal rights under Indian cooperative law.

**Key Rights of Members:**
• Right to participate in General Body meetings
• Right to vote in elections
• Right to inspect books of account (with notice)
• Right to receive dividends declared
• Right to appeal disputes to the Cooperative Court

**Dispute Resolution:**
Disputes between members and the cooperative society are adjudicated by the Cooperative Court / Cooperative Arbitrator, NOT civil courts.

**Maharashtra Specific:**
Under Maharashtra Co-operative Societies Act 1960, a member can file a complaint with the District Deputy Registrar.

⚠️ [DEMO] This is informational guidance, NOT legal advice. Consult a qualified legal advisor for your specific situation.`,
      suggestions: ['How to file a cooperative dispute?', 'What are cooperative society bylaws?', 'What is PACS?'],
      sources: [SOURCES.cooperative, SOURCES.maharashtra],
      canPrint: true,
    },
    hi: {
      content: `⚖️ **सहकारी कानूनी अधिकार और उपनियम**

भारतीय सहकारी कानून के तहत सदस्यों के महत्वपूर्ण अधिकार हैं।

**सदस्यों के अधिकार:**
• सामान्य निकाय बैठकों में भाग लेने का अधिकार
• चुनाव में मतदान
• खातों की पुस्तकें जांचने का अधिकार (नोटिस के साथ)
• लाभांश प्राप्त करने का अधिकार
• सहकारी न्यायालय में अपील

⚠️ [डेमो] यह जानकारी कानूनी सलाह नहीं है।`,
      suggestions: ['सहकारी विवाद कैसे दर्ज करें?', 'उपनियम क्या हैं?', 'PACS क्या है?'],
      sources: [SOURCES.cooperative, SOURCES.maharashtra],
      canPrint: true,
    },
    mr: {
      content: `⚖️ **सहकारी कायदेशीर हक्क व उपविधी**

भारतीय सहकारी कायद्यांतर्गत सदस्यांना महत्त्वाचे कायदेशीर हक्क आहेत.

**सदस्यांचे हक्क:**
• सर्वसाधारण सभेत सहभागी होण्याचा हक्क
• निवडणुकीत मतदान
• खाते पुस्तके तपासण्याचा हक्क (नोटिससह)
• घोषित लाभांश मिळवण्याचा हक्क
• सहकारी न्यायालयात अपील

⚠️ [डेमो] ही माहितीपर मार्गदर्शन आहे, कायदेशीर सल्ला नाही. तुमच्या परिस्थितीसाठी पात्र कायदेशीर सल्लागाराचा सल्ला घ्या.`,
      suggestions: ['सहकारी वाद कसा दाखल करायचा?', 'उपविधी काय आहेत?', 'PACS काय आहे?'],
      sources: [SOURCES.cooperative, SOURCES.maharashtra],
      canPrint: true,
    },
  },

  financial: {
    en: {
      content: `💰 **Financial Literacy for Rural Communities**

**Understanding Interest:**
• Simple Interest: Principal × Rate × Time / 100
• Compound Interest: Grows exponentially — important for long-term savings
• Always ask for the Annual Percentage Rate (APR) before taking a loan

**Banking Basics:**
• Jan Dhan Account: Zero balance, free RuPay card, ₹10,000 overdraft facility
• UPI: Free digital payments via PhonePe, GPay, Paytm, BHIM app
• Fixed Deposits (FD): Safe, guaranteed returns (typically 6–7% p.a.)

**Avoiding Debt Traps:**
• Never borrow from unregistered moneylenders
• Beware of schemes promising >15% returns — likely fraudulent
• Always read loan agreement carefully before signing

⚠️ [DEMO] For financial planning guidance, contact your nearest NABARD-sponsored Financial Literacy Centre.`,
      suggestions: ['What is Jan Dhan account?', 'KCC loan details?', 'How to file a grievance?'],
      sources: [SOURCES.kcc],
      canPrint: true,
    },
    hi: {
      content: `💰 **ग्रामीण समुदायों के लिए वित्तीय साक्षरता**

**ब्याज को समझें:**
• सरल ब्याज: मूलधन × दर × समय / 100
• चक्रवृद्धि ब्याज: दीर्घकालिक बचत के लिए महत्वपूर्ण

**बैंकिंग मूल बातें:**
• जन धन खाता: शून्य शेष, मुफ्त RuPay कार्ड, ₹10,000 ओवरड्राफ्ट
• UPI: मुफ्त डिजिटल भुगतान

**कर्ज के जाल से बचें:**
• अपंजीकृत साहूकारों से कभी उधार न लें
• 15% से अधिक रिटर्न वाली योजनाओं से सावधान रहें

⚠️ [डेमो] NABARD वित्तीय साक्षरता केंद्र से संपर्क करें।`,
      suggestions: ['जन धन खाता क्या है?', 'KCC लोन विवरण?', 'शिकायत कैसे करें?'],
      sources: [SOURCES.kcc],
      canPrint: true,
    },
    mr: {
      content: `💰 **ग्रामीण समुदायांसाठी आर्थिक साक्षरता**

**व्याज समजून घ्या:**
• साधे व्याज: मूळ × दर × वेळ / 100
• चक्रवाढ व्याज: दीर्घकालीन बचतीसाठी महत्त्वाचे

**बँकिंग मूलतत्त्वे:**
• जन धन खाते: शून्य शिल्लक, मोफत RuPay कार्ड, ₹10,000 ओव्हरड्राफ्ट
• UPI: मोफत डिजिटल पेमेंट

**कर्जाच्या सापळ्यापासून वाचा:**
• अनोंदणीकृत सावकाराकडून कधीही कर्ज घेऊ नका

⚠️ [डेमो] NABARD आर्थिक साक्षरता केंद्राशी संपर्क साधा.`,
      suggestions: ['जन धन खाते काय आहे?', 'KCC कर्ज तपशील?', 'तक्रार कशी करायची?'],
      sources: [SOURCES.kcc],
      canPrint: true,
    },
  },

  grievance: {
    en: {
      content: `📢 **Grievance Redressal for Farmers & Cooperative Members**

**For Government Scheme Grievances (PMFBY, PM-KISAN, etc.):**
1. Raise complaint at Centralized Public Grievance Redressal & Monitoring System: **pgportal.gov.in**
2. Call PM-KISAN Helpline: **155261 / 1800115526** (Toll-Free)
3. Contact your District Agriculture Officer

**For Cooperative Society Disputes:**
1. First, approach the Management Committee of the society
2. If unresolved, file complaint with **District Deputy Registrar of Cooperative Societies**
3. Escalate to **Cooperative Court** (not civil courts) for formal adjudication

**For Bank/Loan Grievances:**
1. Bank's Internal Grievance Redressal System
2. Banking Ombudsman: **rbi.org.in/Scripts/Complaints.aspx**

⚠️ [DEMO] Contact information may change. Always verify with official government websites.`,
      suggestions: ['File PMFBY complaint?', 'Cooperative court process?', 'Banking ombudsman?'],
      sources: [SOURCES.pmfby, SOURCES.maharashtra],
      canPrint: true,
    },
    hi: {
      content: `📢 **किसानों और सहकारी सदस्यों के लिए शिकायत निवारण**

**सरकारी योजनाओं की शिकायत:**
1. pgportal.gov.in पर ऑनलाइन शिकायत दर्ज करें
2. PM-KISAN हेल्पलाइन: **155261 / 1800115526** (टोल-फ्री)
3. जिला कृषि अधिकारी से संपर्क

**सहकारी विवाद:**
1. पहले समिति की प्रबंधन समिति से मिलें
2. जिला उप रजिस्ट्रार सहकारी समितियों में शिकायत करें
3. सहकारी न्यायालय में अपील

⚠️ [डेमो] संपर्क जानकारी बदल सकती है। सरकारी वेबसाइटों से सत्यापित करें।`,
      suggestions: ['PMFBY शिकायत?', 'सहकारी न्यायालय?', 'बैंकिंग लोकपाल?'],
      sources: [SOURCES.pmfby, SOURCES.maharashtra],
      canPrint: true,
    },
    mr: {
      content: `📢 **शेतकरी व सहकारी सदस्यांसाठी तक्रार निवारण**

**शासकीय योजनांच्या तक्रारी:**
1. pgportal.gov.in वर ऑनलाइन तक्रार दाखल करा
2. PM-KISAN हेल्पलाइन: **155261 / 1800115526** (टोल-फ्री)
3. जिल्हा कृषी अधिकाऱ्याशी संपर्क

**सहकारी वाद:**
1. प्रथम संस्थेच्या व्यवस्थापन समितीकडे जा
2. जिल्हा उप निबंधक सहकारी संस्थांकडे तक्रार
3. सहकारी न्यायालयात अपील

⚠️ [डेमो] संपर्क माहिती बदलू शकते. अधिकृत सरकारी वेबसाइटवर सत्यापित करा.`,
      suggestions: ['PMFBY तक्रार?', 'सहकारी न्यायालय?', 'बँकिंग लोकपाल?'],
      sources: [SOURCES.pmfby, SOURCES.maharashtra],
      canPrint: true,
    },
  },

  document: {
    en: {
      content: `📄 **Government Document Assistance**

I can help you understand common government documents used in rural Maharashtra.

**Common Documents:**
• **7/12 Extract (Saat-Baara Utara):** Land ownership record issued by district tehsildar. Available at bhulekh.maharashtra.gov.in
• **8-A Extract:** Land revenue record showing survey number details
• **Caste Certificate:** Issued by SDO/Tehsildar for SC/ST/OBC benefits
• **Income Certificate:** Required for scholarship, scheme eligibility

**How to Read 7/12:**
- Column 1: Survey Number
- Column 2: Area (in hectares/acres)
- Column 3: Owner name(s)
- Column 4: Crop details (current season)
- Column 5: Rights/Encumbrances

💡 **Tip:** You can scan your document and send it to me — I will read and explain it for you!

⚠️ [DEMO] For official certified copies, contact your local Tehsil office.`,
      suggestions: ['How to read 7/12 extract?', 'Caste certificate process?', 'PACS membership?'],
      sources: [SOURCES.maharashtra],
      canPrint: true,
    },
    hi: {
      content: `📄 **सरकारी दस्तावेज़ सहायता**

मैं महाराष्ट्र में उपयोग किए जाने वाले सामान्य सरकारी दस्तावेजों को समझने में मदद कर सकता हूँ।

**सामान्य दस्तावेज़:**
• **7/12 उतारा:** जमीन स्वामित्व रिकॉर्ड — bhulekh.maharashtra.gov.in पर उपलब्ध
• **8-A उतारा:** भूमि राजस्व रिकॉर्ड
• **जाति प्रमाण पत्र:** SC/ST/OBC लाभों के लिए
• **आय प्रमाण पत्र:** छात्रवृत्ति के लिए

💡 अपना दस्तावेज़ स्कैन करके मुझे भेजें — मैं पढ़कर समझाऊंगा!

⚠️ [डेमो] आधिकारिक प्रतियों के लिए तहसील कार्यालय जाएं।`,
      suggestions: ['7/12 उतारा कैसे पढ़ें?', 'जाति प्रमाण पत्र?', 'PACS सदस्यता?'],
      sources: [SOURCES.maharashtra],
      canPrint: true,
    },
    mr: {
      content: `📄 **शासकीय कागदपत्र सहाय्य**

मी महाराष्ट्रात वापरल्या जाणाऱ्या सामान्य शासकीय कागदपत्रे समजून घेण्यास मदत करू शकतो.

**सामान्य कागदपत्रे:**
• **7/12 उतारा (सातबारा):** जमीन मालकी नोंद — bhulekh.maharashtra.gov.in वर उपलब्ध
• **8-अ उतारा:** जमीन महसूल नोंद
• **जात प्रमाणपत्र:** SC/ST/OBC फायद्यांसाठी
• **उत्पन्न प्रमाणपत्र:** शिष्यवृत्ती/योजना पात्रतेसाठी

**7/12 कसा वाचायचा:**
- स्तंभ 1: सर्वे नंबर
- स्तंभ 2: क्षेत्रफळ (हेक्टर/एकर)
- स्तंभ 3: मालकाचे नाव
- स्तंभ 4: पिकाचा तपशील

💡 तुमचे कागदपत्र स्कॅन करून मला पाठवा — मी वाचून समजावून सांगेन!

⚠️ [डेमो] अधिकृत प्रतींसाठी स्थानिक तहसील कार्यालयाशी संपर्क साधा.`,
      suggestions: ['7/12 उतारा कसा वाचायचा?', 'जात प्रमाणपत्र?', 'PACS सदस्यत्व?'],
      sources: [SOURCES.maharashtra],
      canPrint: true,
    },
  },

  general: {
    en: {
      content: `I could not find verified information for this question in the current government knowledge base. Please verify with the relevant government authority.

You can ask me about:
• 🌾 Crop Insurance (PMFBY)
• 💳 Kisan Credit Card (KCC)
• 🧑‍🌾 PM-KISAN Scheme
• 🏦 PACS & Cooperative Societies
• ⚖️ Cooperative Laws & Bylaws
• 💰 Financial Literacy
• 📢 Grievance Filing
• 📄 Government Documents (7/12, 8-A)`,
      suggestions: ['PMFBY crop insurance?', 'Cooperative society rules?', 'PM-KISAN scheme?'],
      sources: [],
      canPrint: false,
    },
    hi: {
      content: `मुझे इस प्रश्न के लिए वर्तमान सरकारी ज्ञानकोष में सत्यापित जानकारी नहीं मिली। कृपया संबंधित सरकारी प्राधिकरण से सत्यापित करें।

आप मुझसे पूछ सकते हैं:
• 🌾 फसल बीमा (PMFBY)
• 💳 किसान क्रेडिट कार्ड
• 🧑‍🌾 PM-KISAN
• 🏦 PACS और सहकारी
• ⚖️ सहकारी कानून
• 💰 वित्तीय साक्षरता
• 📢 शिकायत`,
      suggestions: ['PMFBY फसल बीमा?', 'सहकारी नियम?', 'PM-KISAN?'],
      sources: [],
      canPrint: false,
    },
    mr: {
      content: `मला या प्रश्नासाठी सध्याच्या शासकीय ज्ञानकोषात सत्यापित माहिती आढळली नाही. कृपया संबंधित शासकीय प्राधिकरणाकडे सत्यापित करा.

तुम्ही मला विचारू शकता:
• 🌾 पिक विमा (PMFBY)
• 💳 किसान क्रेडिट कार्ड
• 🧑‍🌾 PM-KISAN
• 🏦 PACS व सहकारी
• ⚖️ सहकारी कायदा
• 💰 आर्थिक साक्षरता
• 📢 तक्रार`,
      suggestions: ['PMFBY पिक विमा?', 'सहकारी नियम?', 'PM-KISAN?'],
      sources: [],
      canPrint: false,
    },
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────
export async function sendMessage(
  query: string,
  language: Language
): Promise<AIResponse> {
  // Check if backend is reachable — if so, use real API with synced government data
  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, language, deviceId: 'BOT-001' }),
      signal: AbortSignal.timeout(4000),
    });
    if (resp.ok) {
      const data = await resp.json();
      return {
        answer: data.answer,
        sources: data.sources || [],
        suggestions: ['How to apply?', 'Eligibility criteria?', 'Documents required?'],
        requiresCamera: data.requiresCamera || false,
        isDemo: true,
        language,
        canPrint: data.canPrint !== false,
        schemeDetails: data.schemeDetails,
        deviceId: 'BOT-001',
        conversationId: data.conversationId,
      };
    }
  } catch {
    // Backend unavailable — fall through to demo engine
  }

  // Camera intent check
  const needsCamera = requiresCamera(query);

  // Categorize
  const category = matchCategory(query);
  const entry = RESPONSES[category][language];

  return {
    answer: entry.content,
    sources: entry.sources,
    suggestions: entry.suggestions,
    requiresCamera: needsCamera,
    isDemo: true,
    language,
    canPrint: entry.canPrint,
  };
}
