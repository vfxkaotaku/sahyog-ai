/**
 * database.ts — Central in-memory database store for SAHYOG AI
 * Stores Schemes, Data Sources, Knowledge Chunks, Multi-Device Fleet,
 * Conversations, Device Activity Logs, and Print Jobs.
 */

export interface SchemeRow {
  schemeId: string;
  name: string;
  department: string;
  category: string;
  description: string;
  eligibility: string;
  benefits: string;
  documentsRequired: string[];
  applicationProcess: string;
  applicationUrl: string;
  contactInfo: string;
  lastUpdated: string;
  isSynced: boolean;
}

export interface DataSourceConfig {
  id: string;
  name: string;
  url: string;
  type: 'PORTAL_API' | 'WEBSITE' | 'DATABASE' | 'GOV_API';
  syncStatus: 'SYNCED' | 'SYNCING' | 'ERROR' | 'IDLE';
  lastSync: string;
  schemeCount: number;
}

export interface SourceRow {
  id: string;
  name: string;
  department: string;
  url: string;
  sourceType: string;
  language: string;
  category: string;
  isVerifiedSource: boolean | number;
  enabled: boolean | number;
  status: string;
  lastFetched: string | null;
  chunkCount: number;
  createdAt: string;
}

export interface ChunkRow {
  id: string;
  documentId: string;
  schemeId?: string;
  content: string;
  department: string;
  officialUrl: string;
  category: string;
}

export interface DeviceRow {
  id: string;
  deviceId: string; // e.g. "BOT-001", "BOT-002"
  name: string;
  locationLabel: string;
  deviceType: 'KIOSK' | 'MOBILE' | 'DESKTOP' | 'ESP32';
  commMethod: 'MQTT' | 'WEBSOCKET' | 'HYBRID';
  mqttServer: string;
  mqttTopic: string;
  firmwareVersion: string;
  status: 'ONLINE' | 'OFFLINE';
  internetStatus: 'CONNECTED' | 'DISCONNECTED' | 'SLOW';
  currentState: string; // "IDLE" | "WAKE" | "LISTENING" | "THINKING" | "SPEAKING"
  wifiRssi: number | null;
  lastSeen: string;
  knowledgeLastUpdated: string;
  enabled: boolean;
  createdAt: string;
}

export interface ConversationRow {
  id: string;
  conversationId: string;
  deviceId: string;
  userQuestion: string;
  aiResponse: string;
  schemeName?: string;
  schemeId?: string;
  informationSource: string;
  timestamp: string;
}

export interface DeviceLogRow {
  id: string;
  timestamp: string;
  deviceId: string;
  event: string;
  status: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
}

export interface PrintJobRow {
  id: string;
  deviceId: string;
  conversationId: string;
  userQuestion: string;
  chatbotAnswer: string;
  schemeName: string;
  eligibility: string;
  benefits: string;
  documentsRequired: string[];
  applicationProcess: string;
  informationSource: string;
  lastUpdated: string;
  status: 'PENDING' | 'PRINTED' | 'DISPATCHED';
  createdAt: string;
}

// ─── Pre-seeded Government Schemes (10 Comprehensive Schemes) ──────────────────
const SEEDED_SCHEMES: SchemeRow[] = [
  {
    schemeId: 'SCHEME-FEAS-001',
    name: 'Farmer Equipment Assistance Scheme',
    department: 'Department of Agriculture & Farmers Welfare',
    category: 'Agriculture & Machinery',
    description: 'Provides 50% to 80% financial subsidy to small, marginal, and cooperative farmers for purchasing modern agricultural machinery such as tractors, rotavators, power tillers, and laser levelers.',
    eligibility: 'Small and marginal farmers holding 7/12 land extract under 2 hectares, cooperative farming societies, and women farmers.',
    benefits: 'Direct financial subsidy up to ₹1,25,000 or 50% of machine invoice value, transferred directly to bank account via DBT.',
    documentsRequired: ['Aadhaar Card', '7/12 Land Record (Satbara Utara)', 'Bank Passbook / Cancelled Cheque', 'Valid Farmer ID', 'Quotation from authorized machinery dealer'],
    applicationProcess: '1. Register online on the portal. 2. Upload land extract and equipment quotation. 3. Verification by Taluka Agriculture Officer. 4. Subsidy disbursed post-inspection.',
    applicationUrl: 'https://agrimachinery.nic.in',
    contactInfo: 'Toll-Free Helpline: 1800-180-1551 | Email: support-agri@gov.in',
    lastUpdated: '06/09/2026',
    isSynced: true,
  },
  {
    schemeId: 'SCHEME-CIAS-002',
    name: 'Crop Insurance Assistance Scheme',
    department: 'Ministry of Agriculture & Farmers Welfare',
    category: 'Crop Insurance',
    description: 'Comprehensive financial cushion protecting insured farmers against yield losses due to non-preventable natural calamities including droughts, unseasonal rainfall, hail, flood, pest attacks, and post-harvest cyclone damage.',
    eligibility: 'All farmers growing notified crops in notified areas including sharecroppers, tenant farmers, and loanee/non-loanee farmers.',
    benefits: 'Full sum insured coverage with nominal farmer premium contribution: 2% for Kharif crops, 1.5% for Rabi food crops, and 5% for commercial/horticultural crops. Remaining premium subsidized by Govt.',
    documentsRequired: ['Aadhaar Card', 'Land Ownership Proof / Tenant Agreement', 'Sowing Certificate / Crop Sowing Declaration', 'Bank Account Details (Aadhaar-seeded)'],
    applicationProcess: 'Enroll via the official portal, nearest Common Service Center (CSC), or bank branch before cutoff date (July 31 for Kharif, Dec 31 for Rabi).',
    applicationUrl: 'https://pmfby.gov.in',
    contactInfo: 'Toll-Free: 1800-200-5142 | WhatsApp Support: +91-11-23382012',
    lastUpdated: '06/09/2026',
    isSynced: true,
  },
  {
    schemeId: 'SCHEME-ASPS-003',
    name: 'Agricultural Solar Pump Scheme',
    department: 'Ministry of New & Renewable Energy (MNRE)',
    category: 'Renewable Energy & Irrigation',
    description: 'Enables rural farmers to install standalone DC/AC solar agricultural water pumps (3HP, 5HP, and 7.5HP) replacing diesel pumps and ensuring daylight irrigation.',
    eligibility: 'Individual farmers, water user associations, and village panchayats with cultivable land and an operational groundwater source/borewell.',
    benefits: 'Up to 90% subsidy: 30% Central Govt subsidy + 30% State Govt subsidy + 30% soft loan from NABARD. Farmer contributes only 10% upfront.',
    documentsRequired: ['Aadhaar Card', 'Land Title Deed (7/12 & 8A)', 'Groundwater Survey / NOC from Water Authority', 'Bank Statement (Last 6 months)'],
    applicationProcess: 'Apply through state renewable energy development agency portal. Select pump vendor from empanelled list after technical field feasibility survey.',
    applicationUrl: 'https://pmkusum.mnre.gov.in',
    contactInfo: 'Helpline: 011-2436-0707 | Email: pmkusum-support@nic.in',
    lastUpdated: '06/09/2026',
    isSynced: true,
  },
  {
    schemeId: 'SCHEME-RHAS-004',
    name: 'Rural Housing Assistance Scheme',
    department: 'Ministry of Rural Development',
    category: 'Rural Housing',
    description: 'Provides direct financial assistance to rural households living in kutcha or dilapidated houses to construct a pucca house with basic amenities including clean cooking space and toilet.',
    eligibility: 'Homeless families or households living in 0, 1, or 2 room kutcha houses identified under the Socio-Economic and Caste Census (SECC) list.',
    benefits: '₹1,20,000 assistance in plain areas and ₹1,30,000 in hilly/difficult areas transferred in 3 construction-linked installments. Additional 90 days unskilled labor under MGNREGA (~₹18,000).',
    documentsRequired: ['Aadhaar Card of head and family members', 'MGNREGA Job Card', 'Bank Account details', 'Geo-tagged photograph of existing kutcha house'],
    applicationProcess: 'Panchayat Gram Sabha verifies beneficiary priority list. Registration by Gram Sevak on AwaasSoft portal. Geo-tagging at each construction stage triggers installment.',
    applicationUrl: 'https://pmayg.nic.in',
    contactInfo: 'Toll-Free Helpline: 1800-11-6446 | Email: support-pmayg@gov.in',
    lastUpdated: '06/09/2026',
    isSynced: true,
  },
  {
    schemeId: 'SCHEME-SSSC-005',
    name: 'Student Scholarship Scheme',
    department: 'Department of Higher Education & Social Justice',
    category: 'Education & Youth',
    description: 'Post-matric and higher education merit-cum-means scholarship program supporting rural, economically backward, and marginalized students pursuing professional, technical, and degree courses.',
    eligibility: 'Regular students enrolled in recognized colleges/universities with family annual income less than ₹2,50,000. Minimum 55% marks in previous examination.',
    benefits: '100% reimbursement of non-refundable tuition fees plus monthly maintenance allowance of ₹1,200 for hostellers and ₹550 for day scholars.',
    documentsRequired: ['Aadhaar Card', 'Income Certificate issued by Tehsildar', 'Caste/Category Certificate (if applicable)', 'Mark sheets of previous qualifying exams', 'College Fee Receipt & Bonafide Certificate'],
    applicationProcess: 'Apply online via National Scholarship Portal (NSP). Institute verification followed by district nodal officer approval and direct DBT credit.',
    applicationUrl: 'https://scholarships.gov.in',
    contactInfo: 'Helpdesk: 0120-6619540 | Email: helpdesk@nsp.gov.in',
    lastUpdated: '06/09/2026',
    isSynced: true,
  },
  {
    schemeId: 'SCHEME-WEAS-006',
    name: 'Women Entrepreneurship Scheme',
    department: 'Ministry of Women and Child Development & SIDBI',
    category: 'Women Empowerment',
    description: 'Collateral-free credit and seed capital grant program empowering rural women self-help groups (SHGs) and individual women entrepreneurs to launch agro-processing, dairy, handloom, and micro-enterprises.',
    eligibility: 'Rural women aged 18 to 55 years, women-led SHGs (with at least 70% women members), possessing basic business plan.',
    benefits: 'Collateral-free loans up to ₹10,00,000 at subsidized interest rate (3% interest subvention for prompt repayment) plus 25% capital grant on capital investments.',
    documentsRequired: ['Aadhaar & PAN Card', 'SHG Registration / Member Resolution', 'Project Business Report', 'Skill Training Certificate (RSETI or NSDC)', 'Bank Passbook'],
    applicationProcess: 'Submit project proposal through nearest District Industries Centre (DIC) or Lead District Bank. 10-day entrepreneurship training provided prior to loan sanction.',
    applicationUrl: 'https://standupmitra.in',
    contactInfo: 'Toll-Free: 1800-180-1111 | Email: support-womengov@nic.in',
    lastUpdated: '06/09/2026',
    isSynced: true,
  },
  {
    schemeId: 'SCHEME-SCAS-007',
    name: 'Senior Citizen Assistance Scheme',
    department: 'Ministry of Social Justice and Empowerment',
    category: 'Social Welfare & Health',
    description: 'Monthly social pension and free healthcare welfare assistance ensuring dignity and financial independence for elderly rural citizens living below poverty line.',
    eligibility: 'Citizens aged 60 years or older belonging to Below Poverty Line (BPL) households or with no permanent source of income/family support.',
    benefits: 'Monthly direct pension of ₹1,000 (aged 60-79) and ₹1,500 (aged 80+). Free health checkups, assistive devices (hearing aids, walking sticks, spectacles), and Ayushman Bharat health card.',
    documentsRequired: ['Aadhaar Card / Age Proof (Birth Certificate or Voter ID)', 'BPL Ration Card', 'Bank Account linked to Aadhaar', 'Passport-size Photographs'],
    applicationProcess: 'Apply at Gram Panchayat office or Taluka Social Welfare office. Physical verification within 15 days by Gram Sevak. Pension credited on the 1st of every month.',
    applicationUrl: 'https://nsap.nic.in',
    contactInfo: 'Elderline National Helpline: 14567 | Email: nsap-support@nic.in',
    lastUpdated: '06/09/2026',
    isSynced: true,
  },
  {
    schemeId: 'SCHEME-CSSS-008',
    name: 'Cooperative Society Support Scheme',
    department: 'Ministry of Cooperation & State Cooperative Dept',
    category: 'Cooperative Governance',
    description: 'Modernization, computerization, and infrastructure grant assistance for Primary Agricultural Credit Societies (PACS) and dairy/fishery cooperatives to transition into multi-purpose rural service centers.',
    eligibility: 'Registered PACS, FPOs (Farmer Producer Organizations), and village cooperative societies affiliated with District Central Cooperative Banks (DCCB).',
    benefits: 'Financial grant up to ₹4,00,000 per society for cloud-based ERP software, hardware setup, solar inverter backup, and establishment of Common Service Centre (CSC) kiosks.',
    documentsRequired: ['Cooperative Society Registration Certificate', 'Audited Balance Sheets (Last 3 years)', 'Managing Committee Resolution', 'DCCB Affiliation Letter', 'PACS Bank Account Details'],
    applicationProcess: 'Managing committee submits modernization proposal to District Deputy Registrar (DDR) of Cooperatives. Approval routed through state cooperative development portal.',
    applicationUrl: 'https://cooperation.gov.in',
    contactInfo: 'Helpline: 011-2338-3911 | Email: pacs-computerization@gov.in',
    lastUpdated: '06/09/2026',
    isSynced: true,
  },
  {
    schemeId: 'SCHEME-SBAS-009',
    name: 'Small Business Assistance Scheme',
    department: 'Ministry of Micro, Small and Medium Enterprises (MSME)',
    category: 'Business & Employment',
    description: 'Provides collateral-free working capital and term loans under Mudra (Shishu, Kishore, Tarun) and PMEGP to rural non-farm micro enterprises, artisans, shopkeepers, and repair units.',
    eligibility: 'Any individual rural citizen aged 18+ with a viable non-farm business or service idea (groceries, tailoring, repair, food processing, logistics).',
    benefits: 'Loans up to ₹50,000 (Shishu), up to ₹5,00,000 (Kishore), and up to ₹10,00,000 (Tarun) with no collateral requirement. Margin money capital subsidy up to 35% under PMEGP for rural beneficiaries.',
    documentsRequired: ['Aadhaar Card & PAN Card', 'Udyam Registration Certificate (Free online)', 'Project Profile / Quotation of Machinery', 'Bank Statement (6 months)', 'Proof of business address / Shop license'],
    applicationProcess: 'Apply online on Udyam / Udyami Mitra portal or visit nearest rural nationalized/Gramin bank branch with business proposal.',
    applicationUrl: 'https://udyamimitra.in',
    contactInfo: 'Mudra Toll-Free: 1800-180-1111 | Email: support@mudra.org.in',
    lastUpdated: '06/09/2026',
    isSynced: true,
  },
  {
    schemeId: 'SCHEME-REAS-010',
    name: 'Rural Employment Assistance Scheme',
    department: 'Ministry of Rural Development',
    category: 'Employment Guarantee',
    description: 'Legal guarantee of at least 100 days of wage employment in a financial year to every rural household whose adult members volunteer to do unskilled manual work.',
    eligibility: 'All adult members of rural households who are willing to perform unskilled manual public works.',
    benefits: 'Statutory minimum wage (₹273 to ₹374 per day depending on state) paid directly via Aadhaar-based DBT within 15 days. Unemployment allowance payable if work not provided within 15 days.',
    documentsRequired: ['Aadhaar Card', 'Ration Card / Proof of residence in Gram Panchayat', 'Passport-size Photographs of all adult applicants', 'Bank / Post Office Account details'],
    applicationProcess: 'Apply orally or in writing to Gram Panchayat. Free MGNREGA Job Card issued within 15 days. Submit written demand for work specifying dates required.',
    applicationUrl: 'https://nrega.nic.in',
    contactInfo: 'National Toll-Free: 1800-11-1555 | Email: nrega-support@nic.in',
    lastUpdated: '06/09/2026',
    isSynced: true,
  }
];

// Helper to convert schemes into RAG knowledge chunks
function generateChunksFromSchemes(schemes: SchemeRow[]): ChunkRow[] {
  const chunks: ChunkRow[] = [];
  schemes.forEach((s, idx) => {
    chunks.push({
      id: `chunk-scheme-${idx}-overview`,
      documentId: s.schemeId,
      schemeId: s.schemeId,
      content: `${s.name} (${s.schemeId}): ${s.description} Administered by ${s.department}. Category: ${s.category}. Contact: ${s.contactInfo}. Official portal: ${s.applicationUrl}.`,
      department: s.department,
      officialUrl: s.applicationUrl,
      category: s.category,
    });
    chunks.push({
      id: `chunk-scheme-${idx}-eligibility`,
      documentId: s.schemeId,
      schemeId: s.schemeId,
      content: `Eligibility & Benefits for ${s.name}: ELIGIBILITY: ${s.eligibility} BENEFITS: ${s.benefits}`,
      department: s.department,
      officialUrl: s.applicationUrl,
      category: s.category,
    });
    chunks.push({
      id: `chunk-scheme-${idx}-process`,
      documentId: s.schemeId,
      schemeId: s.schemeId,
      content: `How to apply for ${s.name}: REQUIRED DOCUMENTS: ${s.documentsRequired.join(', ')}. APPLICATION PROCESS: ${s.applicationProcess} Portal: ${s.applicationUrl}.`,
      department: s.department,
      officialUrl: s.applicationUrl,
      category: s.category,
    });
  });
  return chunks;
}

// ─── Central Database Singleton ────────────────────────────────────────────────
const db: {
  schemes: SchemeRow[];
  dataSources: DataSourceConfig[];
  sources: SourceRow[];
  chunks: ChunkRow[];
  devices: DeviceRow[];
  conversations: ConversationRow[];
  deviceLogs: DeviceLogRow[];
  printJobs: PrintJobRow[];
} = {
  schemes: [...SEEDED_SCHEMES],
  dataSources: [
    {
      id: 'ds-portal-01',
      name: 'Demo Government Information Portal API',
      url: 'http://localhost:3001/api/portal/schemes',
      type: 'PORTAL_API',
      syncStatus: 'SYNCED',
      lastSync: new Date().toISOString(),
      schemeCount: SEEDED_SCHEMES.length,
    },
  ],
  sources: [
    { id: '1', name: 'Demo Gov Portal API', department: 'Central Scheme Registry', url: 'http://localhost:3001/api/portal/schemes', sourceType: 'GOV_API', language: 'en', category: 'All Categories', isVerifiedSource: 1, enabled: 1, status: 'SUCCESSFUL', lastFetched: new Date().toISOString(), chunkCount: 30, createdAt: new Date().toISOString() },
    { id: '2', name: 'PMFBY Portal', department: 'Ministry of Agriculture', url: 'https://pmfby.gov.in', sourceType: 'WEBSITE', language: 'hi', category: 'Crop Insurance', isVerifiedSource: 1, enabled: 1, status: 'SUCCESSFUL', lastFetched: new Date().toISOString(), chunkCount: 42, createdAt: new Date().toISOString() },
    { id: '3', name: 'PM-KISAN Portal', department: 'Ministry of Agriculture', url: 'https://pmkisan.gov.in', sourceType: 'WEBSITE', language: 'hi', category: 'Farmer Support', isVerifiedSource: 1, enabled: 1, status: 'SUCCESSFUL', lastFetched: new Date().toISOString(), chunkCount: 31, createdAt: new Date().toISOString() },
    { id: '4', name: 'NABARD KCC', department: 'NABARD', url: 'https://www.nabard.org/content1.aspx?id=580', sourceType: 'GUIDELINE', language: 'en', category: 'Credit', isVerifiedSource: 1, enabled: 1, status: 'SUCCESSFUL', lastFetched: new Date().toISOString(), chunkCount: 18, createdAt: new Date().toISOString() },
  ],
  chunks: generateChunksFromSchemes(SEEDED_SCHEMES),
  devices: [
    {
      id: 'dev-001',
      deviceId: 'BOT-001',
      name: 'Government Assistant 01',
      locationLabel: 'Kiosk Terminal 01 - Main Gram Panchayat Hall',
      deviceType: 'KIOSK',
      commMethod: 'MQTT',
      mqttServer: 'broker.hivemq.com:1883',
      mqttTopic: 'chatbot/BOT-001',
      firmwareVersion: '1.2.0',
      status: 'ONLINE',
      internetStatus: 'CONNECTED',
      currentState: 'IDLE',
      wifiRssi: -58,
      lastSeen: new Date().toISOString(),
      knowledgeLastUpdated: '06/09/2026',
      enabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'dev-002',
      deviceId: 'BOT-002',
      name: 'Government Assistant 02 (Standby)',
      locationLabel: 'Nashik Tehsil Sub-Office',
      deviceType: 'KIOSK',
      commMethod: 'WEBSOCKET',
      mqttServer: 'broker.hivemq.com:1883',
      mqttTopic: 'chatbot/BOT-002',
      firmwareVersion: '1.1.4',
      status: 'OFFLINE',
      internetStatus: 'DISCONNECTED',
      currentState: 'IDLE',
      wifiRssi: -74,
      lastSeen: new Date(Date.now() - 3600000).toISOString(),
      knowledgeLastUpdated: '05/09/2026',
      enabled: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  conversations: [
    {
      id: 'conv-init-1',
      conversationId: 'c-101',
      deviceId: 'BOT-001',
      userQuestion: 'Which scheme can help a farmer buy a tractor or agricultural machinery?',
      aiResponse: 'You can apply for the Farmer Equipment Assistance Scheme (SCHEME-FEAS-001) by the Dept of Agriculture. It provides 50% to 80% subsidy (up to ₹1,25,000) for small and marginal farmers.',
      schemeName: 'Farmer Equipment Assistance Scheme',
      schemeId: 'SCHEME-FEAS-001',
      informationSource: 'Demo Government Portal',
      timestamp: new Date(Date.now() - 600000).toISOString(),
    },
  ],
  deviceLogs: [
    { id: 'log-1', timestamp: new Date(Date.now() - 1200000).toISOString(), deviceId: 'BOT-001', event: 'BOT-001 connected', status: 'SUCCESS' },
    { id: 'log-2', timestamp: new Date(Date.now() - 900000).toISOString(), deviceId: 'BOT-001', event: 'BOT-001 received knowledge update (10 schemes synced)', status: 'INFO' },
    { id: 'log-3', timestamp: new Date(Date.now() - 600000).toISOString(), deviceId: 'BOT-001', event: 'BOT-001 received question: "Farmer equipment assistance"', status: 'INFO' },
    { id: 'log-4', timestamp: new Date(Date.now() - 598000).toISOString(), deviceId: 'BOT-001', event: 'BOT-001 generated response with scheme citation', status: 'SUCCESS' },
  ],
  printJobs: [
    {
      id: 'pj-init-1',
      deviceId: 'BOT-001',
      conversationId: 'c-101',
      userQuestion: 'Which scheme can help a farmer buy a tractor or agricultural machinery?',
      chatbotAnswer: 'Farmer Equipment Assistance Scheme provides 50% to 80% subsidy up to ₹1,25,000 for purchasing tractors and modern implements.',
      schemeName: 'Farmer Equipment Assistance Scheme',
      eligibility: 'Small and marginal farmers (<2 hectares), cooperative societies, women farmers.',
      benefits: 'Direct financial subsidy up to ₹1,25,000 via DBT.',
      documentsRequired: ['Aadhaar Card', '7/12 Land Record (Satbara)', 'Bank Passbook', 'Equipment Quotation'],
      applicationProcess: 'Register on agrimachinery.nic.in, submit quotation, inspection by Taluka Agri Officer.',
      informationSource: 'Demo Government Portal',
      lastUpdated: '06/09/2026',
      status: 'PRINTED',
      createdAt: new Date(Date.now() - 500000).toISOString(),
    },
  ],
};

export { db, SEEDED_SCHEMES, generateChunksFromSchemes };

export async function initDatabase(): Promise<void> {
  console.log('[DB] Central database initialized.');
  console.log(`[DB] Schemes: ${db.schemes.length}, Devices: ${db.devices.length}, Chunks: ${db.chunks.length}, Logs: ${db.deviceLogs.length}`);
}
