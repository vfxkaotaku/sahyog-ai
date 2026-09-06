/**
 * SchemesAdmin.tsx — Route: /admin/schemes
 * Admin view of all synchronized government schemes in the central database.
 */

import React, { useState, useEffect } from 'react';
import { ListFilter, Search, Building2, FileText, ExternalLink, Calendar, RefreshCw } from 'lucide-react';
import type { GovernmentScheme } from '../types';
import { FALLBACK_SCHEMES } from '../data/fallbackSchemes';

export default function SchemesAdmin() {
  const [schemes, setSchemes] = useState<GovernmentScheme[]>(FALLBACK_SCHEMES);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const loadSchemes = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/portal/schemes', {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.schemes && data.schemes.length > 0) {
          setSchemes(data.schemes);
        }
      }
    } catch {
      // Keeps FALLBACK_SCHEMES on GitHub Pages or offline
    }
  };

  useEffect(() => {
    loadSchemes();
  }, []);

  const filtered = schemes.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.schemeId.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-emerald-400" />
            Synchronized Government Schemes ({schemes.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active scheme records currently indexed in the Central Knowledge Base for AI retrieval
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter schemes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <button
            onClick={loadSchemes}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Scheme ID</th>
                <th className="py-3.5 px-4 font-semibold">Scheme Name</th>
                <th className="py-3.5 px-4 font-semibold">Department</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Eligibility Summary</th>
                <th className="py-3.5 px-4 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((s) => (
                <tr key={s.schemeId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-amber-400 font-bold">{s.schemeId}</td>
                  <td className="py-3 px-4 font-semibold text-slate-100">{s.name}</td>
                  <td className="py-3 px-4 text-slate-400">{s.department}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                      {s.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{s.eligibility}</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px] font-mono">{s.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
