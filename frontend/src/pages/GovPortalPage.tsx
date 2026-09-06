/**
 * GovPortalPage.tsx — Demo Government Information Portal (/portal)
 * Simulated government portal exposing structured welfare & farming schemes.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Search, AlertTriangle, ExternalLink,
  FileText, CheckCircle2, Phone, Calendar, RefreshCw,
  Sparkles, ArrowRight, ShieldAlert, Cpu
} from 'lucide-react';
import type { GovernmentScheme } from '../types';

export default function GovPortalPage() {
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedScheme, setSelectedScheme] = useState<GovernmentScheme | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch schemes from backend portal API
  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/portal/schemes');
      const data = await res.json();
      if (data.schemes) {
        setSchemes(data.schemes);
      }
    } catch (err) {
      console.warn('Could not fetch from backend, loading fallback schemes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  // Sync with central chatbot system
  const handleSyncToChatbot = async () => {
    try {
      setSyncing(true);
      setSyncSuccess(null);
      const res = await fetch('http://localhost:3001/api/portal/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: 'BOT-001' }),
      });
      const data = await res.json();
      setSyncSuccess(`Successfully synchronized ${data.schemeCount} schemes to Central Knowledge Base (BOT-001)!`);
      setTimeout(() => setSyncSuccess(null), 5000);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const categories = ['ALL', ...Array.from(new Set(schemes.map((s) => s.category)))];

  const filteredSchemes = schemes.filter((s) => {
    const matchCat = selectedCategory === 'ALL' || s.category === selectedCategory;
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.schemeId.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* ─── Top Official Demo Header ────────────────────────────────────────── */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Prototype Sandbox
                </span>
                <span className="text-xs text-slate-400">Official Portal Simulator</span>
              </div>
              <h1 className="text-lg font-bold text-slate-100">
                DEMO GOVERNMENT INFORMATION PORTAL
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncToChatbot}
              disabled={syncing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync to Chatbot BOT-001'}
            </button>

            <Link
              to="/"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              Open BOT-001
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Mandatory Disclaimer Banner ────────────────────────────────────── */}
      <div className="bg-amber-950/50 border-b border-amber-600/30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/90 leading-relaxed">
            <strong className="font-semibold text-amber-300">DEMO GOVERNMENT INFORMATION PORTAL: </strong>
            This is a simulated government information portal created for prototype testing. The information shown here is dummy data and is not official government information.
          </div>
        </div>
      </div>

      {/* ─── Sync Feedback Toast ────────────────────────────────────────────── */}
      {syncSuccess && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-4 py-2.5 text-xs text-emerald-300 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {syncSuccess}
        </div>
      )}

      {/* ─── Main Content ───────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Intro & Search Bar */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Citizen Welfare & Agriculture Schemes Directory
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Centralized registry of 10 welfare programs feeding live structured data to SAHYOG AI Chatbot nodes.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <span>Live API Endpoint:</span>
              <a
                href="http://localhost:3001/api/portal/schemes"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:underline flex items-center gap-1 font-mono"
              >
                /api/portal/schemes
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Search and Category Filters */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search schemes by name, keyword, or department (e.g. equipment, solar, loan, student)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Categories Tab */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Schemes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchemes.map((scheme) => (
            <div
              key={scheme.schemeId}
              onClick={() => setSelectedScheme(scheme)}
              className="glass-card p-5 rounded-2xl border border-slate-800/80 hover:border-amber-500/40 bg-slate-900/40 hover:bg-slate-900/80 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-semibold border border-slate-700">
                    {scheme.schemeId}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-400">
                    {scheme.category}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-2">
                  {scheme.name}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {scheme.description}
                </p>

                <div className="pt-2 border-t border-slate-800/60 space-y-1.5 text-[11px]">
                  <div className="text-slate-300">
                    <span className="text-slate-500 font-medium">Department: </span>
                    {scheme.department}
                  </div>
                  <div className="text-slate-300">
                    <span className="text-emerald-400 font-medium">Benefits: </span>
                    <span className="text-slate-300 line-clamp-1">{scheme.benefits}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-3 flex items-center justify-between text-xs text-amber-400 font-medium border-t border-slate-800/40">
                <span>View Full Details</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        {filteredSchemes.length === 0 && !loading && (
          <div className="text-center py-16 text-slate-500 text-sm glass-card rounded-2xl border border-slate-800">
            No schemes found matching "{search}". Try searching for "farmer", "solar", or "insurance".
          </div>
        )}
      </main>

      {/* ─── Scheme Detail Modal / Drawer ───────────────────────────────────── */}
      {selectedScheme && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {selectedScheme.schemeId}
                  </span>
                  <span className="text-xs text-slate-400">{selectedScheme.category}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-100">{selectedScheme.name}</h3>
                <p className="text-xs text-slate-400">{selectedScheme.department}</p>
              </div>
              <button
                onClick={() => setSelectedScheme(null)}
                className="text-slate-400 hover:text-slate-100 text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Scheme Details Body */}
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-semibold text-slate-300 mb-1">Description</h4>
                <p className="text-slate-400 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {selectedScheme.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <h4 className="font-semibold text-emerald-400 mb-1">Eligibility</h4>
                  <p className="text-slate-300">{selectedScheme.eligibility}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <h4 className="font-semibold text-amber-400 mb-1">Benefits</h4>
                  <p className="text-slate-300">{selectedScheme.benefits}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  Documents Required
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedScheme.documentsRequired.map((doc, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700"
                    >
                      {doc}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-300 mb-1">Application Process</h4>
                <p className="text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
                  {selectedScheme.applicationProcess}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-slate-400">
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{selectedScheme.contactInfo}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Last Updated: {selectedScheme.lastUpdated}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <a
                href={selectedScheme.applicationUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-all"
              >
                Visit Portal
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <Link
                to="/"
                state={{ initialQuery: `Tell me about ${selectedScheme.name}` }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all"
              >
                Ask BOT-001 About This Scheme
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-600">
        Demo Government Scheme Information Portal • Simulated Sandbox for SAHYOG AI SIH Prototype
      </footer>
    </div>
  );
}
