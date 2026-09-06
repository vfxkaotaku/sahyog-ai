/**
 * PrinterPage.tsx — Route: /printer
 * Dedicated Printer Simulator for BOT-001.
 * Formats realistic 58mm thermal receipts with Print, Download, and WhatsApp actions.
 */

import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Printer, Download, MessageCircle, ChevronLeft,
  CheckCircle2, Clock, FileText, Sparkles, RefreshCw
} from 'lucide-react';
import { useChatStore } from '../state/chatStore';
import type { PrintJob } from '../types';

export default function PrinterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deviceId = searchParams.get('deviceId') || 'BOT-001';

  const receiptRef = useRef<HTMLDivElement>(null);
  const pendingPrint = useChatStore((s) => s.pendingPrintReceipt);

  const [phone, setPhone] = useState('');
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [activeJob, setActiveJob] = useState<PrintJob | null>(null);

  // Fetch recent print jobs for BOT-001
  const loadPrintJobs = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/printer/jobs?deviceId=${deviceId}`);
      if (res.ok) {
        const jobs = await res.json();
        setPrintJobs(jobs);
        if (jobs.length > 0 && !activeJob) {
          setActiveJob(jobs[0]);
        }
      }
    } catch (err) {
      console.warn('Could not load print jobs:', err);
    }
  };

  useEffect(() => {
    loadPrintJobs();
  }, [deviceId]);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB');
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Active receipt data
  const question = activeJob?.userQuestion || pendingPrint?.querySummary || 'Which scheme is available for farmers?';
  const solution = activeJob?.schemeName || 'Farmer Equipment Assistance Scheme';
  const answer = activeJob?.chatbotAnswer || pendingPrint?.responseSummary || '50% to 80% subsidy up to ₹1,25,000 for purchasing tractors and machinery.';
  const eligibility = activeJob?.eligibility || 'Small and marginal farmers holding 7/12 land extract under 2 hectares';
  const benefits = activeJob?.benefits || 'Direct financial subsidy up to ₹1,25,000 via DBT';
  const documents = activeJob?.documentsRequired || ['Aadhaar Card', '7/12 Land Record (Satbara)', 'Bank Account Passbook', 'Equipment Dealer Quotation'];
  const applicationProcess = activeJob?.applicationProcess || 'Register on agrimachinery.nic.in and submit quotation';
  const source = activeJob?.informationSource || pendingPrint?.sourceName || 'Demo Government Portal';
  const lastUpdated = activeJob?.lastUpdated || '06/09/2026';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReceipt = () => {
    const textContent = `
================================
       GOVERNMENT ASSISTANT
              DEMO
================================

DEVICE: ${deviceId}
DATE: ${dateStr}, ${timeStr}

QUESTION:
${question}

--------------------------------

SOLUTION:

${solution}

ELIGIBILITY:
${eligibility}

BENEFITS:
${benefits}

DOCUMENTS:
${documents.join('\n')}

APPLICATION PROCESS:
${applicationProcess}

--------------------------------

SOURCE:
${source}

LAST UPDATED:
${lastUpdated}

================================
    `;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt_${deviceId}_${Date.now().toString().slice(-4)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleWhatsapp = async () => {
    if (!phone.match(/^[6-9]\d{9}$/)) {
      alert('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    try {
      await fetch('http://localhost:3001/api/printer/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, deviceId, schemeName: solution }),
      });
      setWhatsappSent(true);
      setTimeout(() => setWhatsappSent(false), 4000);
    } catch (err) {
      console.warn('WhatsApp dispatch failed:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* ── Header ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-100">Printer Simulator</h1>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Device: {deviceId}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              58mm POS thermal receipt printer output for {deviceId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-300 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Status: Ready</span>
          </div>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left / Center Column: The 58mm Thermal Receipt Preview */}
          <div className="lg:col-span-2 flex flex-col items-center">
            <div className="text-center text-xs text-slate-500 mb-3 no-print">
              [SIMULATED] 58mm POS Thermal Roll Output
            </div>

            {/* Thermal Slip Card */}
            <div
              ref={receiptRef}
              className="w-full max-w-[340px] bg-amber-50 text-slate-950 p-6 rounded-sm shadow-2xl font-mono text-[11px] leading-snug border-t-4 border-slate-400 select-all print-receipt"
              style={{ minHeight: '440px' }}
            >
              {/* Header */}
              <div className="text-center space-y-0.5 pb-2">
                <div className="text-xs font-black tracking-widest leading-none">================================</div>
                <div className="text-xs font-black tracking-wider py-0.5">GOVERNMENT ASSISTANT</div>
                <div className="text-[10px] font-bold text-slate-600">DEMO</div>
                <div className="text-xs font-black tracking-widest leading-none">================================</div>
              </div>

              {/* Metadata */}
              <div className="py-2 text-[10px] border-b border-slate-300 space-y-0.5">
                <div><strong>DEVICE:</strong> {deviceId}</div>
                <div><strong>DATE / TIME:</strong> {dateStr} {timeStr}</div>
              </div>

              {/* User Question */}
              <div className="py-2.5">
                <div className="font-bold text-[10px] uppercase text-slate-600">QUESTION:</div>
                <div className="font-semibold text-slate-900 mt-0.5 whitespace-pre-wrap">{question}</div>
              </div>

              <div className="border-t border-dashed border-slate-400 my-1"></div>

              {/* Solution / Scheme Breakdown */}
              <div className="py-2 space-y-2">
                <div>
                  <div className="font-bold text-[10px] uppercase text-slate-600">SOLUTION:</div>
                  <div className="font-bold text-slate-950 text-xs mt-0.5">{solution}</div>
                </div>

                <div>
                  <div className="font-bold text-[10px] uppercase text-slate-600">ELIGIBILITY:</div>
                  <div className="text-slate-800 text-[10px] mt-0.5">{eligibility}</div>
                </div>

                <div>
                  <div className="font-bold text-[10px] uppercase text-slate-600">BENEFITS:</div>
                  <div className="text-slate-800 text-[10px] mt-0.5">{benefits}</div>
                </div>

                <div>
                  <div className="font-bold text-[10px] uppercase text-slate-600">DOCUMENTS:</div>
                  <div className="text-slate-800 text-[10px] mt-0.5">
                    {documents.map((d, i) => (
                      <div key={i}>• {d}</div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="font-bold text-[10px] uppercase text-slate-600">APPLICATION PROCESS:</div>
                  <div className="text-slate-800 text-[10px] mt-0.5">{applicationProcess}</div>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-400 my-1"></div>

              {/* Footer Source */}
              <div className="py-2 space-y-1 text-[10px]">
                <div><strong>SOURCE:</strong> {source}</div>
                <div><strong>LAST UPDATED:</strong> {lastUpdated}</div>
              </div>

              <div className="text-center text-xs font-black tracking-widest pt-1">
                ================================
              </div>

              <div className="text-center text-[9px] text-slate-500 pt-2">
                * * * TAKE-HOME CITIZEN SLIP * * *
              </div>
            </div>
          </div>

          {/* Right Column: Actions & Recent Print Jobs */}
          <div className="space-y-5 no-print">

            {/* Print & Download Action Box */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-emerald-400" />
                Printer Actions
              </h3>

              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all"
              >
                <Printer className="w-4 h-4" />
                PRINT SOLUTION
              </button>

              <button
                onClick={handleDownloadReceipt}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                Download Receipt (.txt)
              </button>

              {/* WhatsApp Option */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <label className="text-[11px] text-slate-400 font-medium block">
                  Send copy to citizen WhatsApp:
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                  />
                  <button
                    onClick={handleWhatsapp}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-all flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Send
                  </button>
                </div>
                {whatsappSent && (
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Receipt dispatched to WhatsApp successfully!
                  </p>
                )}
              </div>
            </div>

            {/* Recent Print Jobs for BOT-001 */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Recent Print Jobs ({deviceId})
                </h3>
                <button
                  onClick={loadPrintJobs}
                  className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {printJobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => setActiveJob(job)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                      activeJob?.id === job.id
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-slate-100 line-clamp-1">{job.schemeName}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">Q: {job.userQuestion}</div>
                    <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1">
                      <span>{new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-emerald-400 uppercase font-mono">{job.status}</span>
                    </div>
                  </button>
                ))}

                {printJobs.length === 0 && (
                  <p className="text-xs text-slate-600 text-center py-4">
                    No print jobs yet for {deviceId}. Ask a question on the chatbot and click "PRINT SOLUTION".
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
