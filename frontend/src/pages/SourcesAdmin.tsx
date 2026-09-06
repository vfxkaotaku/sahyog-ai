/**
 * SourcesAdmin.tsx — Route: /admin/sources
 * Government Data Source Configuration & Central Knowledge Synchronization Console.
 */

import React, { useState, useEffect } from 'react';
import {
  Database, RefreshCw, CheckCircle2, AlertTriangle,
  Building2, ExternalLink, Globe, ShieldAlert,
  Calendar, Layers, Clock, Edit2
} from 'lucide-react';
import type { GovernmentSource, DataSourceConfig } from '../types';

export default function SourcesAdmin() {
  const [sources, setSources] = useState<GovernmentSource[]>([]);
  const [dataSource, setDataSource] = useState<DataSourceConfig>({
    id: 'ds-portal-01',
    name: 'Demo Government Information Portal API',
    url: 'http://localhost:3001/api/portal/schemes',
    type: 'PORTAL_API',
    syncStatus: 'SYNCED',
    lastSync: '06/09/2026, 03:20 PM',
    schemeCount: 10,
  });

  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isEditingSource, setIsEditingSource] = useState(false);

  // Form states for configurable source
  const [sourceName, setSourceName] = useState(dataSource.name);
  const [sourceUrl, setSourceUrl] = useState(dataSource.url);
  const [sourceType, setSourceType] = useState<DataSourceConfig['type']>(dataSource.type);

  const loadData = async () => {
    try {
      // 1. Fetch sources
      const sRes = await fetch('http://localhost:3001/api/sources');
      if (sRes.ok) {
        const s = await sRes.json();
        setSources(s);
      }
      // 2. Fetch portal status
      const pRes = await fetch('http://localhost:3001/api/portal/status');
      if (pRes.ok) {
        const p = await pRes.json();
        setDataSource({
          id: 'ds-portal-01',
          name: p.dataSourceName || 'Demo Government Information Portal API',
          url: p.dataSourceUrl || 'http://localhost:3001/api/portal/schemes',
          type: (p.dataSourceType as any) || 'PORTAL_API',
          syncStatus: p.syncStatus || 'SYNCED',
          lastSync: p.lastSync ? new Date(p.lastSync).toLocaleString() : '06/09/2026',
          schemeCount: p.totalSchemes || 10,
        });
      }
    } catch (err) {
      console.warn('Sources load warning:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncData = async () => {
    try {
      setSyncing(true);
      setSyncFeedback(null);
      const res = await fetch('http://localhost:3001/api/portal/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: 'BOT-001' }),
      });
      const data = await res.json();
      setSyncFeedback(`Successfully synchronized ${data.schemeCount} schemes (${data.chunkCount} knowledge chunks) into Central Database!`);
      loadData();
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveDataSourceConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setDataSource({
      ...dataSource,
      name: sourceName,
      url: sourceUrl,
      type: sourceType,
      lastSync: new Date().toLocaleString(),
    });
    setIsEditingSource(false);
    setSyncFeedback('Data source configuration updated.');
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            Government Data & Knowledge Ingestion
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure primary data sources, view sync status, and trigger updates to the Central RAG Index
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Status
          </button>

          <button
            onClick={handleSyncData}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Synchronizing...' : 'Sync Government Data'}
          </button>
        </div>
      </div>

      {/* Sync Toast */}
      {syncFeedback && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 px-4 py-2.5 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {syncFeedback}
        </div>
      )}

      {/* ── Active Primary Data Source Card (Configurable Architecture) ── */}
      <div className="glass-card p-6 rounded-2xl border border-emerald-500/40 bg-slate-900/70 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Active Ingestion Source
                </span>
                <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {dataSource.syncStatus}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 mt-1">{dataSource.name}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingSource(!isEditingSource)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Configure Source
            </button>
          </div>
        </div>

        {/* Source Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 text-[11px] block">Source URL:</span>
            <a
              href={dataSource.url}
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 font-mono hover:underline flex items-center gap-1 mt-0.5 truncate"
            >
              {dataSource.url}
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>

          <div>
            <span className="text-slate-500 text-[11px] block">Source Type:</span>
            <span className="text-slate-200 font-medium mt-0.5 block">{dataSource.type}</span>
          </div>

          <div>
            <span className="text-slate-500 text-[11px] block">Total Schemes Synced:</span>
            <span className="text-emerald-400 font-bold text-sm mt-0.5 block">{dataSource.schemeCount} Active Schemes</span>
          </div>

          <div>
            <span className="text-slate-500 text-[11px] block">Last Synchronized:</span>
            <span className="text-slate-300 font-medium mt-0.5 block">{dataSource.lastSync}</span>
          </div>
        </div>

        {/* Edit Configuration Form Drawer */}
        {isEditingSource && (
          <form onSubmit={handleSaveDataSourceConfig} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-fadeIn text-xs">
            <div className="font-semibold text-slate-200">Configure Government Data Source Target</div>
            <p className="text-[11px] text-slate-400">
              Easily swap the Demo Portal with a real government API, database, or portal URL without redesigning the chatbot.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-slate-400 mb-1">Data Source Name</label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Data Source URL</label>
                <input
                  type="text"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Source Type</label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="PORTAL_API">Simulated Portal API (Current)</option>
                  <option value="GOV_API">Official Government API</option>
                  <option value="WEBSITE">Web Crawler & Scraper</option>
                  <option value="DATABASE">Central Database Connection</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingSource(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                Save Settings
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Whitelisted Official Government Portals ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200">Registered Official Government Feeds</h3>
          <span className="text-xs text-slate-500">Domain Whitelist (.gov.in, .nic.in, nabard.org)</span>
        </div>

        <div className="space-y-2">
          {sources.map((src) => (
            <div
              key={src.id}
              className="glass-card p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">{src.name}</h4>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-slate-400 hover:text-amber-400 font-mono"
                  >
                    {src.url}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="text-slate-400 text-[11px] hidden sm:inline">{src.department}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {src.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
