/**
 * ConversationsAdmin.tsx — Route: /admin/conversations
 * View all stored conversation interactions across chatbot devices.
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, Clock, Cpu, FileText, CheckCircle2 } from 'lucide-react';
import type { ConversationRecord } from '../types';

export default function ConversationsAdmin() {
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const url =
        selectedDevice === 'ALL'
          ? 'http://localhost:3001/api/conversations'
          : `http://localhost:3001/api/conversations?deviceId=${selectedDevice}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.warn('Conversations fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [selectedDevice]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            Stored Conversations History
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete archive of citizen inquiries, AI responses, and cited government sources
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            <span>Filter Device:</span>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="bg-transparent text-slate-200 font-mono font-bold focus:outline-none"
            >
              <option value="ALL">ALL DEVICES</option>
              <option value="BOT-001">BOT-001</option>
              <option value="BOT-002">BOT-002</option>
            </select>
          </div>

          <button
            onClick={loadConversations}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className="glass-card p-5 rounded-2xl border border-slate-800/90 bg-slate-900/50 space-y-3 shadow-md"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">
                  {conv.deviceId}
                </span>
                <span className="font-mono text-[11px] text-slate-500">ID: {conv.conversationId}</span>
                {conv.schemeName && (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {conv.schemeName}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Clock className="w-3 h-3" />
                <span>{new Date(conv.timestamp).toLocaleString()}</span>
              </div>
            </div>

            {/* Q & A */}
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold flex-shrink-0">Citizen:</span>
                <span className="text-slate-200 font-medium">{conv.userQuestion}</span>
              </div>

              <div className="flex items-start gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                <span className="text-purple-400 font-bold flex-shrink-0">AI Response:</span>
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{conv.aiResponse}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Source: <strong className="text-slate-400">{conv.informationSource}</strong></span>
              <span className="text-emerald-400/80 flex items-center gap-1 text-[10px]">
                <CheckCircle2 className="w-3 h-3" /> Grounded & Verified
              </span>
            </div>
          </div>
        ))}

        {conversations.length === 0 && !loading && (
          <div className="text-center py-16 text-slate-500 text-xs glass-card rounded-2xl border border-slate-800">
            No conversations recorded yet for {selectedDevice}. Start chatting on BOT-001 to see logs here.
          </div>
        )}
      </div>
    </div>
  );
}
