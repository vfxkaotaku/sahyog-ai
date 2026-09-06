/**
 * SourceBadge.tsx — Verified Government Source card for AI responses.
 * Shown beneath each SAHYOG AI message with a verified source.
 */

import React from 'react';
import { ShieldCheck, ExternalLink, Calendar, Building2 } from 'lucide-react';
import type { SourceMetadata } from '../../types';

interface SourceBadgeProps {
  sources: SourceMetadata[];
}

export default function SourceBadge({ sources }: SourceBadgeProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {sources.map((src, i) => (
        <div key={i} className="source-card">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Verified Source
              </span>
            </div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="text-[11px] text-slate-300 font-medium truncate">{src.department}</span>
            </div>
            <p className="text-[12px] text-slate-200 font-semibold leading-tight mb-1.5">
              {src.documentTitle}
            </p>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Calendar className="w-3 h-3" />
                {src.publicationDate}
              </div>
              <a
                href={src.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
                Official Source
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
