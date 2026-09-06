/**
 * aiService.ts — SAHYOG AI
 *
 * AI Response Engine with 3-tier priority:
 *   1. Google Gemini Flash API (real conversational AI — primary)
 *   2. Backend /api/chat (local dev with synced RAG data — secondary)
 *   3. Demo RAG engine (offline hardcoded fallback — tertiary)
 *
 * Anti-hallucination: Gemini is given official scheme context in system prompt.
 */

import type { AIResponse, Language, SourceMetadata } from '../types';

// ─── Gemini API Configuration ─────────────────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// SAHYOG AI system prompt — tells Gemini exactly who it is and what it knows
const SAHYOG_SYSTEM_PROMPT = `You are SAHYOG AI (सहयोग AI), a friendly, warm, and knowledgeable multilingual government scheme assistant deployed on a kiosk at rural Gram Panchayats and cooperative offices across Maharashtra, India.

Your primary mission is to help rural farmers, women self-help groups (SHGs), PACS members, and rural citizens understand and access government welfare schemes in simple language.

## Your Knowledge Base (respond based on these):

### Agriculture & Farmer Schemes:
- **PM-KISAN (Pradhan Mantri Kisan Samman Nidhi):** ₹6,000/year in 3 installments of ₹2,000 each via DBT directly to farmers' bank accounts. Eligibility: all landholding farmer families. Apply at pmkisan.gov.in or CSC centers with Aadhaar + bank passbook + land records.
- **PMFBY (Pradhan Mantri Fasal Bima Yojana):** Crop insurance for Kharif (2% premium), Rabi (1.5%), commercial/horticultural (5%). Government pays remaining premium. Covers losses from sowing to post-harvest. Apply before cut-off dates at banks, CSCs, or pmfby.gov.in.
- **PM-KUSUM Solar Pump:** Up to 90% government subsidy on solar water pumps for irrigation. Apply at kusum.mahadiscom.in.
- **Farm Equipment Subsidy (SMAM/MahaDbt):** 50% subsidy on tractors, rotavators, tillers, harvesters. Apply at mahadbt.maharashtra.gov.in.
- **Kisan Credit Card (KCC):** Revolving crop loan up to ₹3 Lakh at effective 4% p.a. interest (with interest subvention for timely repayment). Apply at PACS, banks, or RRBs with land records + Aadhaar.

### Cooperative & Rural Schemes:
- **PACS (Primary Agricultural Credit Societies):** Grassroots cooperative institutions providing credit, seeds, fertilizers. 63,000 PACS being computerized under NABARD scheme.
- **Women SHG (NRLM/Aajeevika):** Up to ₹1.5 Lakh bank loans at low interest for women self-help groups. "Lakhpati Didi" initiative.
- **Cooperative Governance:** Maharashtra Co-operative Societies Act 1960, MSCS Act 2002 (amended 2023). One member one vote, democratic elections, transparent audits.
- **PACS Computerization:** 100% grant for ERP software, biometric kiosks, digital loan processing.

### Social Welfare:
- **PM Awaas Yojana Gramin (PMAYG):** ₹1.20 Lakh financial assistance for pucca housing for rural poor. Apply at pmayg.nic.in.
- **Senior Citizen Pension (NSAP/Shravan Bal):** Monthly ₹1,500 pension for citizens above 60 years. Apply at district social welfare office.
- **MGNREGA:** 100 days guaranteed wage employment per year for rural households. Job cards issued at Gram Panchayat.
- **Mudra / PMEGP:** Collateral-free loans up to ₹10 Lakh with 35% margin subsidy for small businesses.
- **Higher Education Scholarship:** 100% tuition reimbursement for rural and farming family students. Apply at mahadbt.maharashtra.gov.in.

### Documents commonly used:
- 7/12 Utara (Saat-Baara): Land ownership record from district tehsildar at bhulekh.maharashtra.gov.in
- Aadhaar Card, Ration Card, Caste Certificate, Income Certificate

### Grievance:
- Government scheme grievances: pgportal.gov.in
- PM-KISAN helpline: 155261 / 1800115526 (toll-free)
- Cooperative disputes: District Deputy Registrar of Cooperative Societies

## Language Rules:
- If the user writes in Hindi, respond entirely in Hindi (Devanagari script).
- If the user writes in Marathi, respond entirely in Marathi (Devanagari script).
- If the user writes in English, respond in English.
- If the question mixes languages, respond in the majority language.
- Always be warm, respectful, and use "आप/आपण" (not informal tu/tum).
- Address the user as "ji" in Hindi responses (e.g., "Rishi ji").

## Response Style:
- Use bullet points for lists of features, eligibility, or steps.
- Use bold (**text**) for scheme names and important numbers.
- Keep responses concise but complete — include eligibility, key benefits, how to apply, and official website.
- End responses with 2-3 suggested follow-up questions relevant to the topic.
- Do NOT make up facts. If unsure, say "Please verify at the official government website or your local Gram Panchayat / PACS office."
- Do NOT add [DEMO] tags — respond naturally as a real assistant.
- Do NOT refuse to answer — always provide helpful information from your knowledge base above.`;

/**
 * Call Google Gemini Flash API directly from browser.
 * Returns null if API key is not configured or if the call fails.
 */
async function callGemini(query: string, language: Language, conversationHistory: Array<{role: string, text: string}> = []): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  const langInstruction = language === 'hi'
    ? 'IMPORTANT: Respond in Hindi (हिंदी) using Devanagari script only.'
    : language === 'mr'
    ? 'IMPORTANT: Respond in Marathi (मराठी) using Devanagari script only.'
    : 'Respond in clear English.';

  try {
    // Build conversation history for context
    const contents: Array<{role: string, parts: Array<{text: string}>}> = [
      // Seed the model with system context as first user+model exchange
      {
        role: 'user',
        parts: [{ text: `${SAHYOG_SYSTEM_PROMPT}\n\n${langInstruction}\n\nUser query: ${query}` }]
      }
    ];

    // If there's prior conversation, add it for context (last 6 turns max)
    if (conversationHistory.length > 0) {
      const recent = conversationHistory.slice(-6);
      const historyContents: Array<{role: string, parts: Array<{text: string}>}> = [];
      for (const turn of recent) {
        historyContents.push({
          role: turn.role === 'user' ? 'user' : 'model',
          parts: [{ text: turn.text }]
        });
      }
      // Restructure: system prompt first, then history, then current query
      contents.splice(0, 1,
        { role: 'user', parts: [{ text: `${SAHYOG_SYSTEM_PROMPT}\n\n${langInstruction}` }] },
        { role: 'model', parts: [{ text: 'Understood. I am SAHYOG AI, ready to assist.' }] },
        ...historyContents,
        { role: 'user', parts: [{ text: query }] }
      );
    }

    const resp = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.9,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.warn('[Gemini] API error:', resp.status, err);
      return null;
    }

    const data = await resp.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    return text.trim();
  } catch (e) {
    console.warn('[Gemini] Request failed:', e);
    return null;
  }
}

// Store recent conversation turns for Gemini context
const _conversationHistory: Array<{role: string, text: string}> = [];

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
  | 'greeting'
  | 'allSchemes'
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
  const q = query.toLowerCase().trim();

  // 1. Greetings & Personal Intro
  if (/^(hi|hello|hey|namaste|namaskar|good morning|good afternoon|good evening|who are you|kya kar sakte ho|rishi|help|help me|start|kaise ho|नमस्ते|नमस्कार|कोण आहेस|काय करू शकतोस|सुरुवात|kya hai)/i.test(q)) return 'greeting';
  if (/who (made|created) you|what is sahyog|about sahyog|tell me about yourself|introduction|intro|परिचय|सहयोग क्या है/i.test(q)) return 'greeting';

  // 2. All Schemes Directory
  if (/all schemes|sab yojana|list of schemes|kya yojana|available schemes|all government schemes|yojana list|योजना सूची|सर्व योजना|काय योजना/i.test(q)) return 'allSchemes';

  // 3. Domain Schemes
  if (/pmfby|fasal bima|crop insurance|pik vima|पिक विमा|फसल बीमा|insurance/.test(q)) return 'cropInsurance';
  if (/pm.?kisan|kisan samman|किसान सम्मान|किसान निधि|pm किसान|₹6,?000/.test(q)) return 'pmkisan';
  if (/kcc|kisan credit|kisan card|किसान क्रेडिट|किसान कार्ड|शेतकरी पतपत्र/.test(q)) return 'kcc';
  if (/pacs|primary agri|प्राथमिक कृषि|प्राथमिक शेती|पैक्स/.test(q)) return 'pacs';
  if (/cooperative|sahakari|सहकारी|सहकार|bylaw|bye.?law|नियम|अधिनियम/.test(q)) return 'cooperative';
  if (/legal|law|act|adhikaar|हक|अधिकार|कायदा|kanoon|कानून/.test(q)) return 'legal';
  if (/financial|literacy|interest|loan|ब्याज|व्याज|loan|कर्ज|ऋण|बचत|saving/.test(q)) return 'financial';
  if (/grievance|complaint|shikayat|तक्रार|शिकायत/.test(q)) return 'grievance';
  if (/document|form|7\/12|satbara|सातबारा|aadhaar|आधार|ration|राशन/.test(q)) return 'document';

  // Broad keywords
  if (/kisan|farmer|शेती|किसान|कृषि|शेतीमाल/.test(q)) return 'pmkisan';
  if (/yojana|योजना|scheme/.test(q)) return 'allSchemes';

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

  greeting: {
    en: {
      content: `👋 **Namaste! I am SAHYOG AI** — your AI Assistant for Rural Welfare, Farmer Subsidies, and Cooperative Legal Guidance.

I am connected to your local kiosk hardware and central knowledge base. Here is what I can assist you with:
• 🌾 **Farmer Subsidies & Schemes:** PM-KISAN (₹6,000/yr), PMFBY Crop Insurance, PM-KUSUM Solar Pumps
• 💳 **Credit & Loans:** Kisan Credit Card (KCC @ 4% interest), PACS Membership, Mudra Loans
• 🚜 **Machinery Subsidy:** 50% subsidy on Tractors & Farm Implements
• 🏠 **Housing & Pensions:** PM Awaas Yojana Gramin (₹1.20 Lakh), Senior Citizen Pensions
• ⚖️ **Cooperative Law:** Bylaws, member voting rights, dispute resolution
• 📄 **Document Reader:** Use the Camera Simulator to read circulars, notices, or land records (7/12)

💬 *What would you like to explore today?*`,
      suggestions: ['Tell me all schemes', 'What is PM-KISAN?', 'Crop Insurance PMFBY', 'Kisan Credit Card (KCC)'],
      sources: [SOURCES.pmkisan, SOURCES.pmfby, SOURCES.kcc],
      canPrint: false,
    },
    hi: {
      content: `👋 **नमस्ते! मैं सहयोग AI (SAHYOG AI) हूँ** — ग्रामीण कल्याण, किसान योजनाओं और सहकारी कानूनी सहायता हेतु आपकी समर्पित डिजिटल सहायक।

मैं आपके हार्डवेयर कियोस्क और केंद्रीय डेटाबेस से जुड़ी हुई हूँ। मैं इन प्रमुख विषयों पर आपकी पूरी सहायता कर सकती हूँ:
• 🌾 **किसान योजनाएं व अनुदान:** पीएम किसान सम्मान निधि (₹6,000/वर्ष), पीएम फसल बीमा (PMFBY), कुसुम सोलर पंप (90% सब्सिडी)
• 💳 **ऋण एवं क्रेडिट कार्ड:** किसान क्रेडिट कार्ड (KCC मात्र 4% ब्याज), पैक्स (PACS) सदस्यता
• 🚜 **कृषि यंत्र अनुदान:** ट्रैक्टर व रोटावेटर पर 50% तक सरकारी सब्सिडी
• 🏠 **आवास व पेंशन:** पीएम आवास योजना ग्रामीण (₹1.20 लाख), वृद्धावस्था पेंशन
• ⚖️ **सहकारी अधिकार:** समिति उपनियम, चुनाव व लाभांश अधिकार, विवाद निवारण
• 📄 **दस्तावेज़ वाचन:** सरकारी नोटिस, आदेश या 7/12 सातबारा कैमरा से स्कैन करवाएं

💬 *ऋषि जी, आज मैं आपकी क्या सहायता करूँ?*`,
      suggestions: ['सभी सरकारी योजनाएं बताएं', 'PM-KISAN क्या है?', 'फसल बीमा PMFBY विवरण', 'किसान क्रेडिट कार्ड KCC'],
      sources: [SOURCES.pmkisan, SOURCES.pmfby, SOURCES.kcc],
      canPrint: false,
    },
    mr: {
      content: `👋 **नमस्कार! मी सहयोग AI (SAHYOG AI) आहे** — ग्रामीण विकास, शेतकरी योजना व सहकार कायदेशीर मार्गदर्शनासाठी आपली डिजिटल सहाय्यक.

मी आपल्या हार्डवेअर कियोस्क आणि मध्यवर्ती ज्ञानकोषाशी थेट जोडलेली आहे. मी खालील विषयांवर आपल्याला संपूर्ण मार्गदर्शन करू शकते:
• 🌾 **शेतकरी योजना व अनुदान:** पीएम-किसान (₹६,०००/वर्ष), प्रधानमंत्री पीक विमा (PMFBY), सौर कृषी पंप (कुसुम)
• 💳 **पत व कर्ज सहाय्य:** किसान क्रेडिट कार्ड (KCC अवघ्या ४% व्याजाने), पैक्स (PACS) सभासदत्व
• 🚜 **यंत्रसामग्री सबसिडी:** ट्रॅक्टर व अवजारांवर ५०% पर्यंत अनुदान
• 🏠 **घरकुल व पेन्शन:** पीएम आवास योजना ग्रामीण (₹१.२० लाख), ज्येष्ठ नागरिक पेन्शन
• ⚖️ **सहकार हक्क व कायदे:** संस्था उपविधी, निवडणुका, नफा वाटप व वाद निवारण
• 📄 **कागदपत्र वाचन:** शासकीय जीआर किंवा ७/१२ सातबारा उतारा कॅमेऱ्याने स्कॅन करा

💬 *आपल्याला कोणत्या योजनेबद्दल माहिती हवी आहे?*`,
      suggestions: ['सर्व शासकीय योजनांची यादी', 'पीएम-किसान योजना काय आहे?', 'पीक विमा माहिती', 'किसान क्रेडिट कार्ड KCC'],
      sources: [SOURCES.pmkisan, SOURCES.pmfby, SOURCES.kcc],
      canPrint: false,
    },
  },

  allSchemes: {
    en: {
      content: `📋 **SAHYOG AI — Directory of All 10 Verified Government Schemes:**

1. 🚜 **Farm Equipment Subsidy (SMAM):** 50% subsidy on tractors, tillers, rotavators (mahadbt.maharashtra.gov.in)
2. 🌾 **Crop Insurance (PMFBY):** Comprehensive protection against drought, flood, pests (pmfby.gov.in)
3. ☀️ **PM-KUSUM Solar Pump:** Up to 90% subsidy on solar water pumps for off-grid irrigation (kusum.mahadiscom.in)
4. 🏠 **PM Awaas Yojana Gramin:** ₹1.20 Lakh direct financial assistance for pucca housing (pmayg.nic.in)
5. 🎓 **Higher Education Scholarship:** 100% tuition reimbursement for rural and farming families (mahadbt.maharashtra.gov.in)
6. 👩 **Women SHG Micro-Enterprise (NRLM):** ₹1.5 Lakh low-interest bank loans for self-help groups (aajeevika.gov.in)
7. 👴 **Senior Citizen Pension (NSAP):** Monthly pension of ₹1,500 for elderly rural citizens (nsap.nic.in)
8. 🏦 **PACS Cooperative Revitalization:** Modernized Primary Agricultural Credit Societies for fertilizers & seeds
9. 💼 **Mudra & PMEGP Small Business Loan:** Collateral-free loans up to ₹10 Lakh with 35% margin subsidy (kviconline.gov.in)
10. 👷 **MGNREGA Rural Employment:** 100 days guaranteed wage employment per financial year (nrega.nic.in)

💡 *Click any suggestion chip below or ask for eligibility, required documents, and application steps!*`,
      suggestions: ['PM-KISAN details', 'Solar Pump Kusum', 'Farm Equipment Subsidy', 'KCC Crop Loan'],
      sources: [SOURCES.pmkisan, SOURCES.pmfby, SOURCES.kcc, SOURCES.maharashtra],
      canPrint: true,
    },
    hi: {
      content: `📋 **सहयोग AI — सभी 10 सत्यापित सरकारी योजनाओं की संपूर्ण सूची:**

1. 🚜 **कृषि यंत्र अनुदान (SMAM / महाडीबीटी):** ट्रैक्टर, रोटावेटर और कृषि औजारों पर 50% तक सरकारी अनुदान
2. 🌾 **प्रधानमंत्री फसल बीमा (PMFBY):** सूखा, बाढ़ व ओलावृष्टि से फसल सुरक्षा, केवल 2% प्रीमियम
3. ☀️ **पीएम कुसुम सोलर पंप:** किसानों को सिंचाई हेतु 90% तक सरकारी सब्सिडी (kusum.mahadiscom.in)
4. 🏠 **प्रधानमंत्री आवास योजना ग्रामीण:** पक्के मकान निर्माण हेतु ₹1.20 लाख की सीधी सहायता
5. 🎓 **उच्च शिक्षा व छात्रवृत्ति योजना:** ग्रामीण व किसान परिवारों के बच्चों हेतु 100% फीस प्रतिपूर्ति
6. 👩 **महिला स्वयं सहायता समूह (NRLM):** लखपति दीदी पहल के तहत ₹1.5 लाख तक कम ब्याज ऋण
7. 👴 **वरिष्ठ नागरिक पेंशन (NSAP):** 60 वर्ष से अधिक आयु के बुजुर्गों को ₹1,500 मासिक पेंशन
8. 🏦 **पैक्स (PACS) सहकारी पुनरुद्धार:** सस्ती खाद, बीज और कृषि सेवा केंद्र की सीधी सुविधा
9. 💼 **मुद्रा व PMEGP लघु उद्योग ऋण:** बिना किसी गारंटी ₹10 लाख तक लोन व 35% सरकारी सब्सिडी
10. 👷 **मनरेगा (MGNREGA) ग्रामीण रोजगार:** प्रत्येक परिवार को प्रतिवर्ष 100 दिन का पक्का गारंटीकृत रोजगार

💡 *किसी भी योजना का नाम लिखें, मैं पात्रता, आवश्यक दस्तावेज़ और आवेदन करने का लिंक तुरंत बताऊँगी!*`,
      suggestions: ['PM-KISAN विवरण', 'सोलर पंप कुसुम योजना', 'ट्रैक्टर सब्सिडी योजना', 'किसान क्रेडिट कार्ड KCC'],
      sources: [SOURCES.pmkisan, SOURCES.pmfby, SOURCES.kcc, SOURCES.maharashtra],
      canPrint: true,
    },
    mr: {
      content: `📋 **सहयोग AI — सर्व १० अधिकृत शासकीय योजनांची संपूर्ण यादी:**

1. 🚜 **कृषी यांत्रिकीकरण योजना (महाडीबीटी):** ट्रॅक्टर, रोटाव्हेटर व अवजारांवर ५०% थेट अनुदान
2. 🌾 **प्रधानमंत्री पीक विमा योजना (PMFBY):** दुष्काळ, महापूर व कीडरोग नुकसानीपासून संपूर्ण विमा संरक्षण
3. ☀️ **कुसुम सौर कृषी पंप योजना:** शेतकऱ्यांना सिंचनासाठी ९०% पर्यंत शासकीय सबसिडी
4. 🏠 **प्रधानमंत्री आवास घरकुल योजना:** ग्रामीण पक्के घर बांधकामासाठी ₹१.२० लाख थेट अनुदान
5. 🎓 **उच्च शिक्षण शिष्यवृत्ती:** शेतकरी व ग्रामीण विद्यार्थ्यांसाठी १००% शिक्षण शुल्क प्रतिपूर्ती
6. 👩 **महिला बचत गट योजना (NRLM):** महिला सक्षमीकरणासाठी ₹१.५ लाखांपर्यंत कमी व्याजाचे कर्ज
7. 👴 **ज्येष्ठ नागरिक पेन्शन (श्रावणबाळ / NSAP):** ६० वर्षांवरील ज्येष्ठांना दरमहा ₹१,५०० निवृत्तीवेतन
8. 🏦 **पैक्स (PACS) सहकार बळकटीकरण:** खते, बियाणे व वाजवी दरात कृषी पतपुरवठा
9. 💼 **मुद्रा व PMEGP व्यवसाय कर्ज:** विनातारण ₹१० लाखांपर्यंत कर्ज व ३५% शासकीय अनुदान
10. 👷 **मनरेगा (MGNREGA) रोजगार हमी:** ग्रामीण कुटुंबांना वर्षातून १०० दिवसांचा हक्काचा रोजगार

💡 *खालील पर्यायावर क्लिक करा किंवा कोणत्याही योजनेची सविस्तर माहिती विचारा!*`,
      suggestions: ['पीएम-किसान माहिती', 'सोलर पंप योजना', 'ट्रॅक्टर सबसिडी योजना', 'किसान क्रेडिट कार्ड KCC'],
      sources: [SOURCES.pmkisan, SOURCES.pmfby, SOURCES.kcc, SOURCES.maharashtra],
      canPrint: true,
    },
  },

  general: {
    en: {
      content: `💡 **I am SAHYOG AI — your Rural & Cooperative Assistance Guide.**

Here are the top government schemes and legal services you can access right now:
• 🌾 **PM-KISAN:** Direct ₹6,000/year income support for landholding farmers
• 🛡️ **PMFBY Crop Insurance:** Financial protection against drought, flood, and pests
• ☀️ **PM-KUSUM Solar Pump:** Up to 90% government subsidy on solar irrigation
• 💳 **Kisan Credit Card (KCC):** Up to ₹3 Lakh crop loan at only 4% interest
• 🚜 **Farm Equipment Subsidy:** 50% subsidy on tractors and agricultural implements
• 📄 **7/12 Satbara & Documents:** Guidance on land records and certificate applications

*Tap any suggestion below or type your question!*`,
      suggestions: ['Tell me all schemes', 'PMFBY crop insurance?', 'PM-KISAN scheme?', 'Kisan Credit Card KCC'],
      sources: [SOURCES.pmkisan, SOURCES.pmfby, SOURCES.kcc],
      canPrint: true,
    },
    hi: {
      content: `💡 **मैं सहयोग AI (SAHYOG AI) हूँ — आपकी ग्रामीण व सहकारी सहायता मार्गदर्शिका।**

यहाँ किसानों और ग्रामीणों के लिए सबसे अधिक लाभकारी सरकारी योजनाएं उपलब्ध हैं:
• 🌾 **पीएम किसान (PM-KISAN):** सभी पात्र किसानों को ₹6,000 वार्षिक सीधी सहायता
• 🛡️ **प्रधानमंत्री फसल बीमा (PMFBY):** सूखा, बाढ़ व ओलावृष्टि से फसल सुरक्षा
• ☀️ **कुसुम सोलर पंप योजना:** सिंचाई हेतु 90% तक सरकारी अनुदान
• 💳 **किसान क्रेडिट कार्ड (KCC):** ₹3 लाख तक का कृषि ऋण मात्र 4% ब्याज पर
• 🚜 **कृषि यंत्र अनुदान:** ट्रैक्टर व रोटावेटर पर 50% तक सरकारी सब्सिडी
• 📄 **7/12 सातबारा व दस्तावेज़:** भूलेख व सरकारी प्रमाणपत्र सहायता

*नीचे दिए गए सुझाव पर क्लिक करें या अपना प्रश्न पूछें!*`,
      suggestions: ['सभी सरकारी योजनाएं बताएं', 'PM-KISAN क्या है?', 'फसल बीमा PMFBY', 'किसान क्रेडिट कार्ड KCC'],
      sources: [SOURCES.pmkisan, SOURCES.pmfby, SOURCES.kcc],
      canPrint: true,
    },
    mr: {
      content: `💡 **मी सहयोग AI (SAHYOG AI) आहे — आपली ग्रामीण व सहकार मार्गदर्शक.**

येथे शेतकरी व ग्रामीण बांधवांसाठी सर्वात महत्त्वाच्या शासकीय योजना उपलब्ध आहेत:
• 🌾 **पीएम-किसान (PM-KISAN):** पात्र शेतकऱ्यांना ₹६,००० वार्षिक थेट आर्थिक सहाय्य
• 🛡️ **प्रधानमंत्री पीक विमा (PMFBY):** दुष्काळ व अतिवृष्टीपासून पिकांचे संरक्षण
• ☀️ **कुसुम सोलर कृषी पंप:** सिंचनासाठी ९०% पर्यंत शासकीय सबसिडी
• 💳 **किसान क्रेडिट कार्ड (KCC):** ₹३ लाखांपर्यंतचे पीक कर्ज अवघ्या ४% व्याजाने
• 🚜 **कृषी अवजारे अनुदान:** ट्रॅक्टर व यंत्रांवर ५०% पर्यंत सबसिडी
• 📄 **७/१२ सातबारा व कागदपत्रे:** महसूल व शासकीय दाखले मार्गदर्शन

*खालील पर्यायावर क्लिक करा किंवा आपला प्रश्न विचारा!*`,
      suggestions: ['सर्व शासकीय योजनांची यादी', 'पीएम-किसान योजना काय आहे?', 'पीक विमा माहिती', 'किसान क्रेडिट कार्ड KCC'],
      sources: [SOURCES.pmkisan, SOURCES.pmfby, SOURCES.kcc],
      canPrint: true,
    },
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────
export async function sendMessage(
  query: string,
  language: Language
): Promise<AIResponse> {

  // ─── TIER 1: Google Gemini Flash API (Real AI) ────────────────────────────
  if (GEMINI_API_KEY) {
    const geminiAnswer = await callGemini(query, language, _conversationHistory);
    if (geminiAnswer) {
      // Store this turn for future context
      _conversationHistory.push({ role: 'user', text: query });
      _conversationHistory.push({ role: 'model', text: geminiAnswer });
      // Keep only last 20 turns (10 exchanges)
      if (_conversationHistory.length > 20) _conversationHistory.splice(0, _conversationHistory.length - 20);

      const needsCamera = requiresCamera(query);
      return {
        answer: geminiAnswer,
        sources: [],      // Gemini answers in-context — no hardcoded sources needed
        suggestions: [],  // Gemini includes suggestions in the answer text itself
        requiresCamera: needsCamera,
        isDemo: false,    // This is real AI — not demo!
        language,
        canPrint: true,
        deviceId: 'BOT-001',
      };
    }
    console.warn('[AI] Gemini call returned null, falling back to backend...');
  }

  // ─── TIER 2: Backend /api/chat (local dev with synced portal data) ────────
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

  // ─── TIER 3: Demo RAG engine (offline hardcoded fallback) ─────────────────
  const needsCamera = requiresCamera(query);
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

/** Reset conversation history (call on "new chat") */
export function resetConversationHistory(): void {
  _conversationHistory.length = 0;
}

/** Check if Gemini API key is configured */
export function isGeminiConfigured(): boolean {
  return !!(GEMINI_API_KEY && GEMINI_API_KEY.length > 10);
}
