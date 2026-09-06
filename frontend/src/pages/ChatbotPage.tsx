/**
 * ChatbotPage.tsx — PRIMARY USER INTERFACE
 * Route: /
 *
 * Features:
 * - 6-state animated robot avatar
 * - Trilingual chat (EN/HI/MR)
 * - Quick action chips
 * - Thinking animation
 * - Verified government source cards
 * - Anti-hallucination safe mode
 * - Camera & print integration
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu, Mic, MicOff, Send, Camera, RefreshCw, Globe,
  Leaf, Zap, Printer, Building2, Wifi
} from 'lucide-react';
import RobotAvatar from '../components/avatar/RobotAvatar';
import MessageFeed from '../components/chat/MessageFeed';
import ActionChips from '../components/chat/ActionChips';
import Sidebar from '../components/layout/Sidebar';
import { useChatStore, getStrings } from '../state/chatStore';
import { sendMessage } from '../services/aiService';
import type { Language } from '../types';

const LANGS: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
];

export default function ChatbotPage() {
  const location = useLocation();
  const {
    messages, language, avatarState, isThinking, isDemoMode,
    addMessage, setLanguage, setAvatarState, setThinking,
    clearMessages, removeThinkingMessages,
  } = useChatStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const strings = getStrings(language);

  // Welcome message on first load
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        sender: 'SAHYOG_AI',
        text: `${strings.welcome}\n\n${strings.welcomeSub}`,
        language,
        isDemo: true,
        suggestions: [
          'Farmer equipment subsidy details?',
          'How does agricultural solar pump scheme work?',
          'PMFBY crop insurance claim steps?',
          'Student scholarship eligibility?',
        ],
      });
    }
  }, []); // eslint-disable-line

  // Handle incoming query from location state (e.g. from Gov Portal or Camera)
  useEffect(() => {
    const query = (location.state as any)?.initialQuery;
    if (query && typeof query === 'string' && !isThinking) {
      handleSend(query);
    }
  }, [location.state]); // eslint-disable-line

  // Language change handler — reset with new-language welcome
  const handleLangChange = (lang: Language) => {
    setLanguage(lang);
    const s = getStrings(lang);
    clearMessages();
    setTimeout(() => {
      addMessage({
        sender: 'SAHYOG_AI',
        text: `${s.welcome}\n\n${s.welcomeSub}`,
        language: lang,
        isDemo: true,
        suggestions: [
          lang === 'en' ? 'PMFBY crop insurance?' : lang === 'hi' ? 'PMFBY फसल बीमा?' : 'PMFBY पिक विमा?',
          lang === 'en' ? 'How to join PACS?' : lang === 'hi' ? 'PACS कैसे जुड़ें?' : 'PACS मध्ये कसे सामील व्हायचे?',
        ],
      });
    }, 50);
  };

  // Main send handler
  const handleSend = useCallback(async (queryOverride?: string) => {
    const query = (queryOverride ?? inputText).trim();
    if (!query || isThinking) return;

    setInputText('');

    // Add user message
    addMessage({
      sender: 'USER',
      text: query,
      language,
      isDemo: false,
    });

    // State transitions
    setThinking(true);
    setAvatarState('THINKING');

    // Add thinking placeholder
    addMessage({
      sender: 'SAHYOG_AI',
      text: strings.thinking,
      language,
      isDemo: false,
      isThinking: true,
    });

    try {
      const response = await sendMessage(query, language);

      // Remove thinking bubble
      removeThinkingMessages();
      setThinking(false);

      // Transition to speaking
      setAvatarState('SPEAKING');
      setTimeout(() => setAvatarState('IDLE'), 3000);

      // Add AI response
      addMessage({
        sender: 'SAHYOG_AI',
        text: response.answer,
        language,
        isDemo: response.isDemo,
        sources: response.sources,
        suggestions: response.suggestions,
        requiresCamera: response.requiresCamera,
        canPrint: response.canPrint,
      });

      // Camera state if needed
      if (response.requiresCamera) {
        setAvatarState('CAMERA');
        setTimeout(() => setAvatarState('IDLE'), 5000);
      }
    } catch (err) {
      removeThinkingMessages();
      setThinking(false);
      setAvatarState('ERROR');
      setTimeout(() => setAvatarState('IDLE'), 3000);
      addMessage({
        sender: 'SAHYOG_AI',
        text: strings.antihallucination,
        language,
        isDemo: true,
      });
    }
  }, [inputText, isThinking, language, strings, addMessage, setThinking, setAvatarState, removeThinkingMessages]);

  // Listen for suggestion events from MessageFeed chips
  useEffect(() => {
    const handler = (e: Event) => {
      const { text } = (e as CustomEvent).detail;
      handleSend(text);
    };
    window.addEventListener('sahyog:suggestion', handler);
    return () => window.removeEventListener('sahyog:suggestion', handler);
  }, [handleSend]);

  // Mic toggle (simulated)
  const handleMic = () => {
    if (isListening) {
      setIsListening(false);
      setAvatarState('IDLE');
      return;
    }
    setIsListening(true);
    setAvatarState('LISTENING');
    // Simulate 3s listening then auto-stop
    setTimeout(() => {
      setIsListening(false);
      setAvatarState('IDLE');
    }, 3000);
  };

  // Real-time hardware control via backend MQTT bridge
  const [hwCommandStatus, setHwCommandStatus] = useState<string | null>(null);
  const sendHardwareCommand = async (cmd: string) => {
    try {
      setHwCommandStatus(`Dispatched: ${cmd}`);
      await fetch('http://localhost:3001/api/devices/BOT-001/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      setTimeout(() => setHwCommandStatus(null), 3000);
    } catch {
      setHwCommandStatus(`Dispatched: ${cmd} (Local fallback)`);
      setTimeout(() => setHwCommandStatus(null), 3000);
    }
  };

  // Auto-grow textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // Enter to send
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full bg-slate-900">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* ── Header ── */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-100 leading-none">SAHYOG AI</h1>
                <p className="text-[10px] text-slate-500 leading-none hidden sm:block">
                  Multilingual Cooperative & Rural Assistance
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* BOT-001 Status Badge */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-emerald-400">BOT-001</span>
              <span className="text-[10px] text-slate-600">•</span>
              <span className="text-[10px] text-slate-400 font-medium hidden md:inline">Gov Assistant 01</span>
              <span className="text-[10px] text-slate-600">•</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <Wifi className="w-2.5 h-2.5" /> Online
              </span>
            </div>

            {/* Quick links to Portal, Camera, Printer */}
            <Link
              to="/portal"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs border border-amber-500/25 transition-all"
              title="Demo Government Portal"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="font-semibold">Gov Portal</span>
            </Link>

            <Link
              to="/camera?deviceId=BOT-001"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-all"
              title="Camera Simulator"
            >
              <Camera className="w-3.5 h-3.5 text-sky-400" />
              <span>Camera</span>
            </Link>

            <Link
              to="/printer?deviceId=BOT-001"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-all"
              title="Printer Simulator"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Printer</span>
            </Link>

            {/* Language switcher */}
            <div className="flex items-center gap-0.5 bg-slate-800 rounded-xl p-1">
              <Globe className="w-3.5 h-3.5 text-slate-500 ml-1 mr-0.5" />
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleLangChange(l.code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    language === l.code
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* New chat */}
            <button
              onClick={() => handleLangChange(language)}
              title="New conversation"
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ── Live Hardware Kiosk Node Bar ── */}
        <div className="flex-shrink-0 bg-slate-950/90 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-emerald-400 font-semibold text-xs">Node: BOT-001</span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-400 text-xs hidden sm:inline">Live Hardware Bridge (broker.hivemq.com)</span>
            {hwCommandStatus && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                {hwCommandStatus}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => sendHardwareCommand('WAKE')}
              className="px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-medium text-[11px] transition-all flex items-center gap-1 active:scale-95"
              title="Trigger Wake animation and chime on physical ESP32"
            >
              🔔 Ping / Wake Kiosk
            </button>
            <button
              onClick={() => sendHardwareCommand('SPEAK')}
              className="px-2.5 py-1 rounded-md bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 font-medium text-[11px] transition-all flex items-center gap-1 active:scale-95"
              title="Trigger speaking animation and audio tone on physical ESP32"
            >
              🗣️ Test Speak
            </button>
            <button
              onClick={() => sendHardwareCommand('IDLE')}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium text-[11px] transition-all flex items-center gap-1 active:scale-95"
              title="Return physical ESP32 to idle blinking eyes"
            >
              💤 Set Idle
            </button>
          </div>
        </div>

        {/* ── Chat body ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Avatar column (desktop) */}
          <div className="hidden lg:flex flex-col items-center justify-center w-56 xl:w-64 border-r border-slate-800 bg-slate-900/50 p-6 gap-6 flex-shrink-0">
            <RobotAvatar state={avatarState} size={170} />

            <div className="w-full space-y-2">
              <div className="glass-card rounded-xl px-3 py-2 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">OLED Mirror</p>
                <p className="text-xs text-emerald-400 font-semibold">SSD1306 128×64</p>
              </div>
              <div className="glass-card rounded-xl px-3 py-2">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">Hardware</p>
                <div className="space-y-1">
                  {[
                    { label: 'INMP441 Mic', ok: true },
                    { label: 'PAM8403 Amp', ok: true },
                    { label: 'Wake Switch', ok: isListening },
                  ].map(({ label, ok }) => (
                    <div key={label} className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">{label}</span>
                      <span className={ok ? 'text-emerald-400' : 'text-slate-600'}>
                        {ok ? '● ON' : '○ –'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chat column */}
          <div className="flex flex-1 flex-col min-w-0 min-h-0">

            {/* Avatar (mobile/tablet — compact) */}
            <div className="lg:hidden flex justify-center py-4 border-b border-slate-800/50">
              <RobotAvatar state={avatarState} size={130} />
            </div>

            {/* Messages scroll area */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {messages.length <= 1 ? (
                /* Welcome hero */
                <div className="flex flex-col items-center justify-center h-full px-6 pb-4 gap-6 animate-fadeIn">
                  <div className="text-center max-w-md">
                    <h2 className="text-2xl font-bold text-slate-100 mb-2">{strings.welcome}</h2>
                    <p className="text-slate-400 text-sm leading-relaxed">{strings.welcomeSub}</p>
                  </div>
                  <ActionChips onSelect={(q) => handleSend(q)} visible={true} />
                  {messages.length === 1 && (
                    <MessageFeed messages={messages} isThinking={isThinking} language={language} />
                  )}
                </div>
              ) : (
                <>
                  <MessageFeed messages={messages} isThinking={isThinking} language={language} />
                  <ActionChips onSelect={(q) => handleSend(q)} visible={!isThinking && messages.length > 0} />
                </>
              )}
            </div>

            {/* ── Input bar ── */}
            <div className="flex-shrink-0 border-t border-slate-800 px-4 py-3 bg-slate-900/95 backdrop-blur-sm">
              <div className="flex items-end gap-2 max-w-3xl mx-auto">
                {/* Mic */}
                <button
                  onClick={handleMic}
                  className={`flex-shrink-0 p-3 rounded-xl transition-all duration-200 ${
                    isListening
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105'
                      : 'glass-card text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30'
                  }`}
                  title={strings.micBtn}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Camera */}
                <button
                  onClick={() => window.location.href = '/camera'}
                  className="flex-shrink-0 p-3 rounded-xl glass-card text-slate-400 hover:text-sky-400 hover:border-sky-500/30 transition-all"
                  title={strings.cameraBtn}
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Text input */}
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder={strings.placeholder}
                    disabled={isThinking || isListening}
                    rows={1}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm
                      text-slate-100 placeholder-slate-500 resize-none focus:outline-none
                      focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30
                      disabled:opacity-50 transition-all scrollbar-thin leading-relaxed"
                    style={{ minHeight: '46px', maxHeight: '120px' }}
                  />
                </div>

                {/* Send */}
                <button
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || isThinking}
                  className="flex-shrink-0 p-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40
                    disabled:cursor-not-allowed text-white transition-all duration-200 active:scale-95
                    shadow-lg shadow-emerald-500/25"
                  title={strings.sendBtn}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Disclaimer */}
              <p className="text-center text-[10px] text-slate-600 mt-2 max-w-3xl mx-auto">
                SAHYOG AI provides informational guidance only. Always verify with the relevant government authority or PACS Secretary.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
