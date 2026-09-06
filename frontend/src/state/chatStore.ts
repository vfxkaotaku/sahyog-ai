import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, Language, AvatarState, PrinterReceipt } from '../types';

// ─── UI Strings (trilingual) ──────────────────────────────────────────────────
export const UI_STRINGS: Record<Language, {
  placeholder: string;
  thinking: string;
  welcome: string;
  welcomeSub: string;
  newChat: string;
  sendBtn: string;
  micBtn: string;
  cameraBtn: string;
  demoMode: string;
  openCamera: string;
  printSummary: string;
  antihallucination: string;
}> = {
  en: {
    placeholder: 'Ask SAHYOG AI anything about government schemes, cooperative rules, or your rights...',
    thinking: 'SAHYOG AI is thinking...',
    welcome: 'Namaste 👋  I am SAHYOG AI',
    welcomeSub: 'Your multilingual assistant for cooperative governance, government schemes, and rural welfare. Ask me anything.',
    newChat: 'New Conversation',
    sendBtn: 'Send',
    micBtn: 'Voice Input',
    cameraBtn: 'Scan Document',
    demoMode: 'DEMO MODE',
    openCamera: '📷 Open Document Scanner',
    printSummary: '🖨️ Print Summary Receipt',
    antihallucination: 'I could not find verified information for this question in the current government knowledge base. Please verify with the relevant government authority.',
  },
  hi: {
    placeholder: 'सरकारी योजनाओं, सहकारी नियमों या अपने अधिकारों के बारे में पूछें...',
    thinking: 'सहयोग AI सोच रहा है...',
    welcome: 'नमस्ते 👋  मैं सहयोग AI हूँ',
    welcomeSub: 'सहकारी शासन, सरकारी योजनाओं और ग्रामीण कल्याण के लिए आपका बहुभाषी सहायक।',
    newChat: 'नई बातचीत',
    sendBtn: 'भेजें',
    micBtn: 'आवाज़ इनपुट',
    cameraBtn: 'दस्तावेज़ स्कैन',
    demoMode: 'डेमो मोड',
    openCamera: '📷 दस्तावेज़ स्कैनर खोलें',
    printSummary: '🖨️ सारांश रसीद प्रिंट करें',
    antihallucination: 'मुझे इस प्रश्न के लिए वर्तमान सरकारी ज्ञानकोष में सत्यापित जानकारी नहीं मिली। कृपया संबंधित सरकारी प्राधिकरण से सत्यापित करें।',
  },
  mr: {
    placeholder: 'शासकीय योजना, सहकारी नियम किंवा आपले हक्कांबद्दल विचारा...',
    thinking: 'सहयोग AI विचार करत आहे...',
    welcome: 'नमस्कार 👋  मी सहयोग AI आहे',
    welcomeSub: 'सहकारी प्रशासन, शासकीय योजना आणि ग्रामीण कल्याणासाठी तुमचा बहुभाषिक सहाय्यक।',
    newChat: 'नवीन संवाद',
    sendBtn: 'पाठवा',
    micBtn: 'आवाज इनपुट',
    cameraBtn: 'दस्तऐवज स्कॅन',
    demoMode: 'डेमो मोड',
    openCamera: '📷 दस्तऐवज स्कॅनर उघडा',
    printSummary: '🖨️ सारांश पावती मुद्रित करा',
    antihallucination: 'मला या प्रश्नासाठी सध्याच्या शासकीय ज्ञानकोषात सत्यापित माहिती आढळली नाही. कृपया संबंधित शासकीय प्राधिकरणाकडे सत्यापित करा.',
  },
};

// ─── State interface ──────────────────────────────────────────────────────────
interface ChatState {
  messages: ChatMessage[];
  language: Language;
  avatarState: AvatarState;
  isThinking: boolean;
  isDemoMode: boolean;
  pendingPrintReceipt: PrinterReceipt | null;

  // Actions
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => ChatMessage;
  setLanguage: (lang: Language) => void;
  setAvatarState: (state: AvatarState) => void;
  setThinking: (thinking: boolean) => void;
  clearMessages: () => void;
  setPendingPrint: (receipt: PrinterReceipt | null) => void;
  removeThinkingMessages: () => void;
}

let idCounter = 0;
function genId(): string {
  return `msg_${Date.now()}_${++idCounter}`;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      language: 'mr',
      avatarState: 'IDLE',
      isThinking: false,
      isDemoMode: true,
      pendingPrintReceipt: null,

      addMessage: (partial) => {
        const msg: ChatMessage = {
          id: genId(),
          timestamp: new Date(),
          ...partial,
        };
        set((state) => ({ messages: [...state.messages, msg] }));
        return msg;
      },

      setLanguage: (lang) => set({ language: lang }),
      setAvatarState: (avatarState) => set({ avatarState }),
      setThinking: (isThinking) => set({ isThinking }),
      clearMessages: () => set({ messages: [], avatarState: 'IDLE', isThinking: false }),
      setPendingPrint: (receipt) => set({ pendingPrintReceipt: receipt }),

      removeThinkingMessages: () => {
        set((state) => ({
          messages: state.messages.filter((m) => !m.isThinking),
        }));
      },
    }),
    {
      name: 'sahyog-ai-chat',
      partialize: (state) => ({
        messages: state.messages.slice(-30), // persist last 30 messages
        language: state.language,
      }),
    }
  )
);

// Re-export strings helper
export function getStrings(language: Language) {
  return UI_STRINGS[language];
}
