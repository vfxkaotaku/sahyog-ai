/**
 * MessageFeed.tsx — Chat message list with streaming simulation.
 */

import React, { useEffect, useRef } from 'react';
import { Bot, User, Camera, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SourceBadge from './SourceBadge';
import type { ChatMessage, Language } from '../../types';
import { useChatStore, getStrings } from '../../state/chatStore';

// ─── Markdown-lite renderer ───────────────────────────────────────────────────
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Bold **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="font-semibold text-slate-100">{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });
    return (
      <span key={i}>
        {parts}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

// ─── Thinking bubble ──────────────────────────────────────────────────────────
function ThinkingBubble({ lang }: { lang: Language }) {
  const strings = getStrings(lang);
  return (
    <div className="flex items-start gap-3 animate-fadeIn">
      <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-1">
        <Bot className="w-4 h-4 text-emerald-400" />
      </div>
      <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{strings.thinking}</span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                style={{ animation: `speechPulse 0.8s ${i * 0.2}s ease-in-out infinite alternate` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Single message ───────────────────────────────────────────────────────────
interface MessageProps {
  msg: ChatMessage;
  onOpenCamera: () => void;
  onPrint: () => void;
  language: Language;
}

function Message({ msg, onOpenCamera, onPrint, language }: MessageProps) {
  const strings = getStrings(language);
  const isUser = msg.sender === 'USER';
  const isSystem = msg.sender === 'SYSTEM';

  const time = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(msg.timestamp));

  if (isSystem) {
    return (
      <div className="flex justify-center animate-fadeIn">
        <span className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
          {msg.text}
        </span>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex items-start gap-3 flex-row-reverse animate-fadeIn">
        <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-4 h-4 text-slate-300" />
        </div>
        <div className="flex flex-col items-end gap-1 max-w-[75%]">
          <div className="bg-emerald-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed">
            {msg.text}
          </div>
          <span className="text-[10px] text-slate-600 pr-1">{time}</span>
        </div>
      </div>
    );
  }

  // AI message
  return (
    <div className="flex items-start gap-3 animate-fadeIn">
      <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-1">
        <Bot className="w-4 h-4 text-emerald-400" />
      </div>
      <div className="flex flex-col gap-1 max-w-[80%]">
        <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
            {renderMarkdown(msg.text)}
          </div>

          {/* Verified source card */}
          {msg.sources && msg.sources.length > 0 && (
            <SourceBadge sources={msg.sources} />
          )}

          {/* Camera required CTA */}
          {msg.requiresCamera && (
            <button
              onClick={onOpenCamera}
              className="mt-3 flex items-center gap-2 w-full justify-center px-3 py-2 rounded-xl text-xs font-semibold text-sky-300 border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              {strings.openCamera}
            </button>
          )}

          {/* Print action for BOT-001 */}
          {msg.canPrint && !msg.requiresCamera && (
            <button
              onClick={() => onPrint()}
              className="mt-3 flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-300 border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 shadow-md shadow-emerald-950/40 transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              🖨️ PRINT SOLUTION (BOT-001)
            </button>
          )}

          {/* Suggestion chips */}
          {msg.suggestions && msg.suggestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {msg.suggestions.map((s, i) => (
                <SuggestionChip key={i} text={s} />
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 pl-1">
          <span className="text-[10px] text-slate-600">{time}</span>
          <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">BOT-001</span>
          {msg.isDemo && (
            <span className="text-[9px] text-amber-600 font-bold tracking-wider">[DEMO]</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Suggestion chip (subscribes to chat store) ───────────────────────────────
function SuggestionChip({ text }: { text: string }) {
  const addMessage = useChatStore((s) => s.addMessage);

  const handleClick = () => {
    addMessage({
      sender: 'USER',
      text,
      language: 'en',
      isDemo: true,
    });
  };

  return (
    <button
      onClick={handleClick}
      className="px-2.5 py-1 rounded-full text-[11px] text-slate-300 border border-slate-700 hover:border-emerald-500/50 hover:text-emerald-300 hover:bg-emerald-500/5 transition-all"
    >
      {text}
    </button>
  );
}

// ─── Main MessageFeed ─────────────────────────────────────────────────────────
interface MessageFeedProps {
  messages: ChatMessage[];
  isThinking: boolean;
  language: Language;
}

export default function MessageFeed({ messages, isThinking, language }: MessageFeedProps) {
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const setPendingPrint = useChatStore((s) => s.setPendingPrint);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleOpenCamera = () => navigate('/camera?deviceId=BOT-001');

  const handlePrint = async (msg: ChatMessage) => {
    const userMsg = [...messages].reverse().find((m) => m.sender === 'USER');
    const userQuestion = userMsg?.text || 'Government scheme query';

    // Dispatch real print job to backend
    try {
      await fetch('http://localhost:3001/api/printer/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'BOT-001',
          userQuestion,
          chatbotAnswer: msg.text,
          schemeName: msg.schemeDetails?.schemeName || msg.sources?.[0]?.documentTitle || 'Government Assistance Scheme',
          eligibility: msg.schemeDetails?.eligibility || 'Rural citizens and farmers',
          benefits: msg.schemeDetails?.benefits || 'Financial & technical assistance',
          documentsRequired: msg.schemeDetails?.documentsRequired || ['Aadhaar Card', 'Land Record / ID', 'Bank Passbook'],
          applicationProcess: msg.schemeDetails?.applicationProcess || 'Apply online or visit Gram Panchayat',
          informationSource: 'Demo Government Portal',
          lastUpdated: '06/09/2026',
        }),
      });
    } catch (err) {
      console.warn('Could not post print job to backend:', err);
    }

    setPendingPrint({
      kioskId: 'BOT-001',
      timestamp: new Date().toISOString(),
      language,
      querySummary: userQuestion,
      responseSummary: msg.text,
      sourceName: msg.sources?.[0]?.documentTitle || 'Demo Government Portal',
      officialUrl: msg.sources?.[0]?.officialUrl || 'http://localhost:3001/api/portal/schemes',
      disclaimer: 'Informational guidance only. Verify with local Gram Panchayat.',
    });
    navigate('/printer?deviceId=BOT-001');
  };

  if (messages.length === 0 && !isThinking) return null;

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {messages.map((msg) => (
        <Message
          key={msg.id}
          msg={msg}
          language={language}
          onOpenCamera={handleOpenCamera}
          onPrint={() => handlePrint(msg)}
        />
      ))}
      {isThinking && <ThinkingBubble lang={language} />}
      <div ref={bottomRef} />
    </div>
  );
}
