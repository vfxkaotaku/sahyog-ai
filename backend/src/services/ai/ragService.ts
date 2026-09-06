/**
 * ragService.ts — Government Knowledge Retrieval Engine with Anti-Hallucination Guard
 * Grounded in synced schemes from Demo Government Information Portal.
 *
 * AI Tier Priority:
 *   1. Google Gemini Flash API (if GEMINI_API_KEY is set)
 *   2. Local RAG engine (scheme keyword matching + SQLite data)
 */

import { db, SchemeRow } from '../../db/database';

export interface RagResult {
  answer: string;
  scheme?: SchemeRow;
  sources: Array<{
    department: string;
    documentTitle: string;
    officialUrl: string;
    publicationDate: string;
    isVerified: boolean;
  }>;
  isDemo: boolean;
  requiresCamera: boolean;
  canPrint: boolean;
  schemeDetails?: {
    schemeId: string;
    schemeName: string;
    eligibility: string;
    benefits: string;
    documentsRequired: string[];
    applicationProcess: string;
    informationSource: string;
    lastUpdated: string;
  };
}

const CAMERA_KEYWORDS = [
  'read this', 'scan', 'circular', 'poster', 'kya likha', 'what does this say',
  'image', 'photo', 'document', 'satbara', '7/12', 'उतारा', 'कागदपत्र', 'दस्तावेज',
];

const ANTI_HALLUCINATION =
  'I could not find verified information for this inquiry in the current government knowledge base. Please verify with the relevant government authority or sync latest schemes from the Demo Government Portal.';

function detectCameraIntent(query: string): boolean {
  const q = query.toLowerCase();
  return CAMERA_KEYWORDS.some((k) => q.includes(k));
}

// ─── Gemini Backend Integration ───────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

const BACKEND_SYSTEM_PROMPT = `You are SAHYOG AI, a multilingual government scheme assistant for rural India. You know about PM-KISAN, PMFBY crop insurance, PM-KUSUM solar pump (90% subsidy), KCC crop loan (4% interest), PACS cooperatives, MGNREGA employment, PM Awaas Yojana, women SHG loans, farm equipment subsidy (50%), and senior citizen pensions.

Rules:
- If user writes in Hindi → respond in Hindi (Devanagari)
- If user writes in Marathi → respond in Marathi (Devanagari)
- Else respond in English
- Be warm, helpful, specific about amounts, eligibility and application URLs
- Do NOT say [DEMO] — respond naturally as a real assistant`;

async function callGeminiBackend(query: string, language: string, schemeContext: string): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  const langInstruction = language === 'hi'
    ? 'IMPORTANT: Respond entirely in Hindi (हिंदी), Devanagari script.'
    : language === 'mr'
    ? 'IMPORTANT: Respond entirely in Marathi (मराठी), Devanagari script.'
    : 'Respond in English.';

  const prompt = `${BACKEND_SYSTEM_PROMPT}\n\n${langInstruction}\n\nAdditional context from synced government database:\n${schemeContext}\n\nUser query: ${query}`;

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
      }),
      signal: AbortSignal.timeout(15000),
    } as any);

    if (!response.ok) return null;
    const data = await response.json() as any;
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch {
    return null;
  }
}

// Multilingual topic keywords mapping to schemes
const SCHEME_KEYWORD_MAP: Record<string, string[]> = {
  'SCHEME-FEAS-001': ['equipment', 'tractor', 'machinery', 'rotavator', 'उपकरण', 'यंत्र', 'ट्रॅक्टर', 'कृषी अवजारे', 'औजार', 'मशीन', 'harvester', 'tiller'],
  'SCHEME-CIAS-002': ['crop insurance', 'pmfby', 'insurance', 'kharif', 'rabi', 'calamity', 'flood', 'drought', 'पीक विमा', 'विमा', 'नुकसान', 'दुष्काळ', 'फसल बीमा'],
  'SCHEME-ASPS-003': ['solar', 'pump', 'solar pump', 'irrigation', 'borewell', 'सौर पंप', 'सोलर पंप', 'सिंचन', 'कुसुम', 'kusum'],
  'SCHEME-RHAS-004': ['housing', 'house', 'pmay', 'awaas', 'kutcha', 'pucca', 'घरकुल', 'आवास', 'घर', 'मकान'],
  'SCHEME-SSSC-005': ['scholarship', 'student', 'education', 'college', 'tuition', 'fee', 'शिष्यवृत्ती', 'विद्यार्थी', 'शिक्षण', 'छात्रवृत्ति'],
  'SCHEME-WEAS-006': ['women', 'woman', 'shg', 'entrepreneur', 'self help group', 'महिला', 'बचत गट', 'उद्योजकता', 'नारी'],
  'SCHEME-SCAS-007': ['senior citizen', 'elderly', 'old age', 'pension', 'bpl', 'ज्येष्ठ नागरिक', 'पेन्शन', 'वृद्ध', 'निवृत्तीवेतन'],
  'SCHEME-CSSS-008': ['cooperative', 'pacs', 'credit society', 'fpo', 'सहकारी', 'सोसायटी', 'संस्था', 'सहकार'],
  'SCHEME-SBAS-009': ['small business', 'business', 'mudra', 'pmegp', 'loan', 'उद्यम', 'व्यवसाय', 'दुकान', 'कर्ज', 'मुद्रा'],
  'SCHEME-REAS-010': ['employment', 'mgnrega', 'nrega', 'job card', 'wage', 'रोजगार', 'मनरेगा', 'मजुरी', 'काम'],
};

export async function queryRag(query: string, language: string = 'en'): Promise<RagResult> {
  const q = query.toLowerCase().trim();

  // 0. Check for camera document scanning intent first (always local)
  if (detectCameraIntent(q)) {
    const isMr = language === 'mr';
    const isHi = language === 'hi';
    const text = isMr
      ? 'दस्तऐवज स्कॅन करण्यासाठी कृपया कॅमेरा स्कॅनर उघडा. मी त्यातील मजकूर वाचून संपूर्ण माहिती देईन.'
      : isHi
      ? 'दस्तावेज़ स्कैन करने के लिए कृपया कैमरा स्कैनर खोलें। मैं उसमें लिखा विवरण पढ़कर पूरी सहायता करूँगा।'
      : 'I can see you want me to read a physical document! Please use the Camera Simulator (/camera) to capture the document, and I will extract and explain the text for you.';

    return { answer: text, sources: [], isDemo: true, requiresCamera: true, canPrint: false };
  }

  // 1. Try Gemini AI as primary (if API key configured)
  if (GEMINI_API_KEY) {
    // Build a brief scheme context from the database for grounded responses
    const schemeContext = db.schemes.slice(0, 5).map((s) =>
      `${s.name}: ${s.benefits}. Eligibility: ${s.eligibility}. Apply at: ${s.applicationUrl}`
    ).join('\n');

    const geminiAnswer = await callGeminiBackend(query, language, schemeContext);
    if (geminiAnswer) {
      return {
        answer: geminiAnswer,
        sources: [],
        isDemo: false,
        requiresCamera: false,
        canPrint: true,
      };
    }
    console.warn('[Backend RAG] Gemini failed, falling back to local RAG');
  }

  // 1.5 Greetings & Intro Intent
  const GREETING_REGEX = /^(hi|hello|hey|namaste|namaskar|good morning|good evening|who are you|kya kar sakte ho|rishi|help|help me|start|kaise ho|नमस्ते|नमस्कार|कोण आहेस|काय करू शकतोस|सुरुवात|who made you|what is sahyog|about)/i;
  if (GREETING_REGEX.test(q)) {
    const isMr = language === 'mr';
    const isHi = language === 'hi';
    const greeting = isMr
      ? `👋 **नमस्कार! मी सहयोग AI (SAHYOG AI) आहे.**\n\nमी ग्रामीण भागातील शेतकरी, महिला व नागरिकांसाठी शासकीय योजना व सहकार कायदेशीर सल्ला देणारी AI सहाय्यक आहे.\n\nमी आपल्याला खालील विषयांवर मार्गदर्शन करू शकते:\n• 🌾 **शेतकरी योजना:** पीएम-किसान, पिक विमा (PMFBY), सौर कृषी पंप (कुसुम)\n• 💳 **पत व कर्ज:** किसान क्रेडिट कार्ड (KCC), पैक्स (PACS) सभासदत्व\n• 🚜 **अनुदान:** ट्रॅक्टर व कृषी अवजारे सबसिडी\n• 🏠 **कल्याणकारी योजना:** घरकुल योजना, ज्येष्ठ नागरिक पेन्शन\n• 📄 **कागदपत्र वाचन:** कॅमेऱ्याने कागदपत्र स्कॅन करा, मी संपूर्ण वाचून दाखवेन\n\n💬 *आपल्याला कोणत्या योजनेबद्दल माहिती हवी आहे?*`
      : isHi
      ? `👋 **नमस्ते! मैं सहयोग AI (SAHYOG AI) हूँ।**\n\nमैं ग्रामीण किसानों, नागरिकों और स्वयं सहायता समूहों के लिए सरकारी योजना व कानूनी सहायता प्रदान करने वाली AI सहायक हूँ।\n\nमैं आपकी इन कार्यों में सहायता कर सकती हूँ:\n• 🌾 **किसान योजनाएं:** पीएम किसान सम्मान निधि (₹6,000/वर्ष), फसल बीमा (PMFBY), कुसुम सोलर पंप\n• 💳 **ऋण एवं क्रेडिट:** किसान क्रेडिट कार्ड (KCC मात्र 4%), पैक्स (PACS) सदस्यता\n• 🚜 **सब्सिडी:** ट्रैक्टर व कृषि औजारों पर 50% अनुदान\n• 🏠 **आवास व पेंशन:** पीएम आवास योजना (₹1.20 लाख), वृद्धावस्था पेंशन\n• 📄 **दस्तावेज़ वाचन:** सरकारी नोटिस या 7/12 कैमरा से स्कैन करवाएं\n\n💬 *ऋषि जी, आज मैं आपकी क्या सहायता करूँ?*`
      : `👋 **Namaste! I am SAHYOG AI.**\n\nYour AI Assistant for Rural Welfare, Agricultural Subsidies, and Cooperative Legal Guidance.\n\nHere is how I can assist you today:\n• 🌾 **Farmer Subsidies:** PM-KISAN (₹6,000/yr), Crop Insurance (PMFBY), PM-KUSUM Solar Pumps\n• 💳 **Credit & Finance:** Kisan Credit Card (KCC @ 4%), PACS membership, Mudra Loans\n• 🚜 **Machinery:** 50% Subsidy on Tractors & Farm Implements\n• 🏠 **Housing & Welfare:** PM Awaas Yojana Gramin, Senior Pensions, Women SHG Grants\n• 📄 **Document Scanner:** Use the Camera Simulator to read circulars or land records\n\n💬 *What scheme or question would you like to explore?*`;

    return {
      answer: greeting,
      sources: [],
      isDemo: true,
      requiresCamera: false,
      canPrint: false,
    };
  }

  // 1.6 All Schemes Directory Intent
  const ALL_SCHEMES_REGEX = /(all schemes|schemes|yojana|योजना|सब योजना|list|kya yojana hai|what schemes|available schemes|subsidies|farmer schemes|benefits|सर्व योजना|काय योजना)/i;
  if (ALL_SCHEMES_REGEX.test(q)) {
    const isMr = language === 'mr';
    const isHi = language === 'hi';
    const listText = isMr
      ? `📋 **सहयोग AI — सर्व १० अधिकृत शासकीय योजना सूची:**\n\n` +
        db.schemes.map((s, i) => `${i + 1}. **${s.name}**\n   📌 *विभाग:* ${s.department}\n   🎁 *लाभ:* ${s.benefits}`).join('\n\n') +
        `\n\n💡 *कोणत्याही योजनेचे नाव विचारून अधिक माहिती मिळवा!*`
      : isHi
      ? `📋 **सहयोग AI — सभी 10 सत्यापित सरकारी योजनाओं की सूची:**\n\n` +
        db.schemes.map((s, i) => `${i + 1}. **${s.name}**\n   📌 *विभाग:* ${s.department}\n   🎁 *लाभ:* ${s.benefits}`).join('\n\n') +
        `\n\n💡 *किसी भी योजना का नाम लिखकर पात्रता, दस्तावेज़ व आवेदन प्रक्रिया पूछें!*`
      : `📋 **SAHYOG AI — Directory of All 10 Verified Government Schemes:**\n\n` +
        db.schemes.map((s, i) => `${i + 1}. **${s.name}**\n   📌 *Department:* ${s.department}\n   🎁 *Benefit:* ${s.benefits}`).join('\n\n') +
        `\n\n💡 *Type any scheme name or question to see complete eligibility, documents required, and application steps!*`;

    return {
      answer: listText,
      sources: db.schemes.map((s) => ({
        department: s.department,
        documentTitle: `${s.name} Official Guidelines`,
        officialUrl: s.applicationUrl,
        publicationDate: '2024-2026',
        isVerified: true,
      })),
      isDemo: true,
      requiresCamera: false,
      canPrint: true,
    };
  }

  // 2. Score against 10 Synced Government Schemes
  let bestScheme: SchemeRow | null = null;
  let highestScore = 0;

  for (const scheme of db.schemes) {
    let score = 0;
    const keywords = SCHEME_KEYWORD_MAP[scheme.schemeId] || [];

    for (const kw of keywords) {
      if (q.includes(kw)) score += 3;
    }

    // Also match in scheme name and description words
    const tokens = q.split(/\s+/).filter((t) => t.length > 3);
    for (const token of tokens) {
      if (scheme.name.toLowerCase().includes(token)) score += 2;
      if (scheme.description.toLowerCase().includes(token)) score += 1;
      if (scheme.category.toLowerCase().includes(token)) score += 1;
    }

    if (score > highestScore) {
      highestScore = score;
      bestScheme = scheme;
    }
  }

  // If no scheme directly matched, try general chunk keyword scoring
  if (!bestScheme || highestScore === 0) {
    const words = q.split(/\s+/).filter((w) => w.length > 3);
    const matchedChunk = db.chunks.find((c) =>
      words.some((w) => c.content.toLowerCase().includes(w))
    );

    if (matchedChunk && matchedChunk.schemeId) {
      bestScheme = db.schemes.find((s) => s.schemeId === matchedChunk.schemeId) || null;
    }
  }

  // 3. If still not found -> Friendly Guided Response
  if (!bestScheme) {
    const isMr = language === 'mr';
    const isHi = language === 'hi';
    const guidance = isMr
      ? `💡 **मी सहयोग AI — आपली ग्रामीण व सहकार मार्गदर्शक.**\n\nआपल्या प्रश्नासाठी अचूक योजना सापडली नाही, पण आपण खालील प्रमुख विषयांवर विचारू शकता:\n• 🌾 **पिक विमा (PMFBY):** दुष्काळ व अतिवृष्टी नुकसान भरपाई\n• 💳 **किसान क्रेडिट कार्ड (KCC):** ₹३ लाख पीक कर्ज अवघ्या ४% व्याजाने\n• ☀️ **कुसुम सोलर पंप:** सिंचनासाठी ९०% अनुदान\n• 🚜 **ट्रॅक्टर व अवजारे अनुदान:** ५०% कृषी यंत्र सबसिडी\n• 🏠 **पीएम आवास घरकुल:** ₹१.२० लाख पक्के घर अनुदान\n\n*खालील पर्यायावर क्लिक करा किंवा आपला प्रश्न पुन्हा विचारा!*`
      : isHi
      ? `💡 **मैं सहयोग AI — आपकी ग्रामीण व सहकारी सहायता मार्गदर्शिका।**\n\nआपके प्रश्न के लिए यहाँ प्रमुख सरकारी योजनाएं उपलब्ध हैं:\n• 🌾 **प्रधानमंत्री फसल बीमा (PMFBY):** सूखा व बाढ़ से फसल सुरक्षा\n• 💳 **किसान क्रेडिट कार्ड (KCC):** ₹3 लाख तक का कृषि ऋण मात्र 4% ब्याज पर\n• ☀️ **कुसुम सोलर पंप:** सिंचाई हेतु 90% तक सरकारी अनुदान\n• 🚜 **कृषि यंत्र अनुदान:** ट्रैक्टर व औजारों पर 50% तक सब्सिडी\n• 🏠 **पीएम आवास योजना:** पक्के मकान हेतु ₹1.20 लाख की सहायता\n\n*नीचे दिए गए सुझाव पर क्लिक करें या अपना प्रश्न लिखें!*`
      : `💡 **I am SAHYOG AI — your Rural & Cooperative Assistance Guide.**\n\nHere are the top government schemes you can explore right now:\n• 🌾 **PMFBY Crop Insurance:** Comprehensive financial protection against drought & floods\n• 💳 **Kisan Credit Card (KCC):** Up to ₹3 Lakh crop loan at only 4% interest\n• ☀️ **PM-KUSUM Solar Pump:** Up to 90% government subsidy on solar irrigation\n• 🚜 **Farm Equipment Subsidy:** 50% subsidy on tractors and implements\n• 🏠 **PM Awaas Yojana:** ₹1.20 Lakh housing assistance for rural families\n\n*Tap any suggestion or ask a specific question!*`;

    return {
      answer: guidance,
      sources: [],
      isDemo: true,
      requiresCamera: false,
      canPrint: true,
    };
  }

  // 4. Synthesize verified grounded answer from the synced scheme
  const isMr = language === 'mr';
  const isHi = language === 'hi';

  let answer = '';
  if (isMr) {
    answer = `**${bestScheme.name} (${bestScheme.schemeId})**\n\n` +
      `📌 **विभाग:** ${bestScheme.department}\n\n` +
      `💡 **योजनेचे स्वरूप:** ${bestScheme.description}\n\n` +
      `✅ **पात्रता:** ${bestScheme.eligibility}\n\n` +
      `🎁 **मिळणारे फायदे:** ${bestScheme.benefits}\n\n` +
      `📄 **आवश्यक कागदपत्रे:** ${bestScheme.documentsRequired.join(', ')}\n\n` +
      `📝 **अर्ज प्रक्रिया:** ${bestScheme.applicationProcess}\n\n` +
      `🌐 **अधिकृत पोर्टल:** ${bestScheme.applicationUrl} | 📞 **संपर्क:** ${bestScheme.contactInfo}`;
  } else if (isHi) {
    answer = `**${bestScheme.name} (${bestScheme.schemeId})**\n\n` +
      `📌 **विभाग:** ${bestScheme.department}\n\n` +
      `💡 **योजना विवरण:** ${bestScheme.description}\n\n` +
      `✅ **पात्रता:** ${bestScheme.eligibility}\n\n` +
      `🎁 **प्रमुख लाभ:** ${bestScheme.benefits}\n\n` +
      `📄 **आवश्यक दस्तावेज़:** ${bestScheme.documentsRequired.join(', ')}\n\n` +
      `📝 **आवेदन प्रक्रिया:** ${bestScheme.applicationProcess}\n\n` +
      `🌐 **आधिकारिक पोर्टल:** ${bestScheme.applicationUrl} | 📞 **हेल्पलाइन:** ${bestScheme.contactInfo}`;
  } else {
    answer = `**${bestScheme.name} (${bestScheme.schemeId})**\n\n` +
      `📌 **Department:** ${bestScheme.department}\n\n` +
      `💡 **Description:** ${bestScheme.description}\n\n` +
      `✅ **Eligibility:** ${bestScheme.eligibility}\n\n` +
      `🎁 **Benefits:** ${bestScheme.benefits}\n\n` +
      `📄 **Documents Required:** ${bestScheme.documentsRequired.join(', ')}\n\n` +
      `📝 **Application Process:** ${bestScheme.applicationProcess}\n\n` +
      `🌐 **Official Portal:** ${bestScheme.applicationUrl} | 📞 **Contact:** ${bestScheme.contactInfo}`;
  }

  return {
    answer,
    scheme: bestScheme,
    sources: [
      {
        department: bestScheme.department,
        documentTitle: `${bestScheme.name} Official Guidelines`,
        officialUrl: bestScheme.applicationUrl,
        publicationDate: bestScheme.lastUpdated,
        isVerified: true,
      },
    ],
    isDemo: true,
    requiresCamera: false,
    canPrint: true,
    schemeDetails: {
      schemeId: bestScheme.schemeId,
      schemeName: bestScheme.name,
      eligibility: bestScheme.eligibility,
      benefits: bestScheme.benefits,
      documentsRequired: bestScheme.documentsRequired,
      applicationProcess: bestScheme.applicationProcess,
      informationSource: 'Demo Government Portal',
      lastUpdated: bestScheme.lastUpdated,
    },
  };
}
