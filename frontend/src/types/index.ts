// ─── Avatar States ───────────────────────────────────────────────────────────
export type AvatarState =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'CAMERA'
  | 'ERROR';

// ─── Language ────────────────────────────────────────────────────────────────
export type Language = 'en' | 'hi' | 'mr';

// ─── Government Scheme Data Model ────────────────────────────────────────────
export interface GovernmentScheme {
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
  isSynced?: boolean;
}

// ─── Configurable Data Source ────────────────────────────────────────────────
export interface DataSourceConfig {
  id: string;
  name: string;
  url: string;
  type: 'PORTAL_API' | 'WEBSITE' | 'DATABASE' | 'GOV_API';
  syncStatus: 'SYNCED' | 'SYNCING' | 'ERROR' | 'IDLE';
  lastSync: string;
  schemeCount: number;
}

// ─── Source Metadata (attached to AI responses) ──────────────────────────────
export interface SourceMetadata {
  department: string;
  documentTitle: string;
  officialUrl: string;
  publicationDate: string;
  isVerified: boolean;
}

// ─── Scheme Details on Chat Message ──────────────────────────────────────────
export interface SchemeDetails {
  schemeId: string;
  schemeName: string;
  eligibility: string;
  benefits: string;
  documentsRequired: string[];
  applicationProcess: string;
  informationSource: string;
  lastUpdated: string;
}

// ─── Chat Message ────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  sender: 'USER' | 'SAHYOG_AI' | 'SYSTEM';
  text: string;
  language: Language;
  timestamp: Date;
  isDemo: boolean;
  deviceId?: string;
  isThinking?: boolean;
  requiresCamera?: boolean;
  sources?: SourceMetadata[];
  suggestions?: string[];
  canPrint?: boolean;
  schemeDetails?: SchemeDetails;
}

// ─── AI Service Response ─────────────────────────────────────────────────────
export interface AIResponse {
  answer: string;
  sources: SourceMetadata[];
  suggestions: string[];
  requiresCamera: boolean;
  isDemo: boolean;
  language: Language;
  canPrint: boolean;
  schemeDetails?: SchemeDetails;
  deviceId?: string;
  conversationId?: string;
}

// ─── Government Source ───────────────────────────────────────────────────────
export interface GovernmentSource {
  id: string;
  name: string;
  department: string;
  url: string;
  sourceType: 'WEBSITE' | 'PDF' | 'GUIDELINE' | 'NOTIFICATION' | 'GOV_API';
  language: Language;
  category: string;
  isVerifiedSource: boolean | number;
  enabled: boolean | number;
  status: 'ACTIVE' | 'FETCHING' | 'SUCCESSFUL' | 'FAILED' | 'NEEDS_REVIEW' | 'DISABLED';
  lastFetched?: string | null;
  chunkCount?: number;
}

// ─── Device ──────────────────────────────────────────────────────────────────
export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'CONNECTING' | 'ERROR';
export type InternetStatus = 'CONNECTED' | 'DISCONNECTED' | 'SLOW';
export type DeviceType = 'KIOSK' | 'MOBILE' | 'DESKTOP' | 'ESP32';
export type CommMethod = 'MQTT' | 'WEBSOCKET' | 'HYBRID';

export interface Device {
  id: string;
  deviceId: string; // e.g. "BOT-001"
  name: string;
  locationLabel: string;
  deviceType?: DeviceType;
  commMethod?: CommMethod;
  mqttServer?: string;
  mqttTopic: string;
  firmwareVersion: string;
  status: DeviceStatus;
  internetStatus?: InternetStatus;
  currentState: AvatarState;
  wifiRssi?: number | null;
  lastSeen?: string | null;
  knowledgeLastUpdated?: string;
  enabled?: boolean;
  telemetry?: {
    micStatus: boolean;
    speakerStatus: boolean;
    oledStatus: boolean;
    wakeSwitch: boolean;
    ipAddress?: string;
  };
}

// ─── Conversation Record ─────────────────────────────────────────────────────
export interface ConversationRecord {
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

// ─── Device Activity Log ─────────────────────────────────────────────────────
export interface DeviceLogRecord {
  id: string;
  timestamp: string;
  deviceId: string;
  event: string;
  status: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
}

// ─── Print Job ───────────────────────────────────────────────────────────────
export interface PrinterReceipt {
  kioskId: string;
  timestamp: string;
  language: Language;
  querySummary: string;
  responseSummary: string;
  sourceName: string;
  officialUrl: string;
  disclaimer: string;
}

export interface PrintJob {
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

// ─── OCR Result ──────────────────────────────────────────────────────────────
export interface OcrResult {
  extractedText: string;
  confidence: number;
  language: string;
  documentType?: string;
  suggestedChatQuery?: string;
}

// ─── System Health ───────────────────────────────────────────────────────────
export interface SystemHealth {
  connectedDevices: number;
  mqttStatus: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';
  knowledgeChunks: number;
  ocrSessions: number;
  printerJobs: number;
  sources: number;
}
