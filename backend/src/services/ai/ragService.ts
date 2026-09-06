/**
 * ragService.ts — Government Knowledge Retrieval Engine with Anti-Hallucination Guard
 * Grounded in synced schemes from Demo Government Information Portal.
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

  // 1. Check for camera document scanning intent
  if (detectCameraIntent(q)) {
    const isMr = language === 'mr';
    const isHi = language === 'hi';
    const text = isMr
      ? 'दस्तऐवज स्कॅन करण्यासाठी कृपया कॅमेरा स्कॅनर उघडा. मी त्यातील मजकूर वाचून संपूर्ण माहिती देईन.'
      : isHi
      ? 'दस्तावेज़ स्कैन करने के लिए कृपया कैमरा स्कैनर खोलें। मैं उसमें लिखा विवरण पढ़कर पूरी सहायता करूँगा।'
      : 'I can see you want me to read a physical document! Please use the Camera Simulator (/camera) to capture the document, and I will extract and explain the text for you.';

    return {
      answer: text,
      sources: [],
      isDemo: true,
      requiresCamera: true,
      canPrint: false,
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

  // 3. If still not found -> Anti-hallucination response
  if (!bestScheme) {
    return {
      answer: ANTI_HALLUCINATION,
      sources: [],
      isDemo: true,
      requiresCamera: false,
      canPrint: false,
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
