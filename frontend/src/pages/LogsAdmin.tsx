/**
 * LogsAdmin.tsx — Route: /admin/logs
 * Real-time and persistent device activity logs viewer for multi-device fleet.
 */

import React, { useState, useEffect } from 'react';
import { History, RefreshCw, Cpu, CheckCircle2, AlertCircle, Info, Clock } from 'lucide-react';
import type { DeviceLogRecord } from '../types';

export default function LogsAdmin() {
  const [logs, setLogs] = useState<DeviceLogRecord[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const url =
        selectedDevice === 'ALL'
          ? 'http://localhost:3001/api/devices/logs'
          : `http://localhost:3001/api/devices/logs?deviceId=${selectedDevice}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.warn('Logs fetch warning:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 6000);
    return () => clearInterval(interval);
  }, [selectedDevice]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            Device Activity & Event Logs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Diagnostic event trail for camera captures, OCR sessions, print requests, knowledge sync, and telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            <span>Device:</span>
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
            onClick={loadLogs}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="divide-y divide-slate-800/60 font-mono text-xs">
          {logs.map((l) => {
            const statusColor =
              l.status === 'SUCCESS'
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : l.status === 'WARNING'
                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                : l.status === 'ERROR'
                ? 'text-red-400 bg-red-500/10 border-red-500/20'
                : 'text-sky-400 bg-sky-500/10 border-sky-500/20';

            return (
              <div
                key={l.id}
                className="p-3.5 hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                    {l.status}
                  </span>
                  <span className="font-bold text-slate-300 text-[11px] bg-slate-800 px-1.5 py-0.5 rounded">
                    {l.deviceId}
                  </span>
                  <span className="text-slate-200 text-xs">{l.event}</span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(l.timestamp).toLocaleTimeString()}</span>
                  <span className="text-slate-600">({new Date(l.timestamp).toLocaleDateString()})</span>
                </div>
              </div>
            );
          })}

          {logs.length === 0 && !loading && (
            <div className="p-12 text-center text-slate-500 text-xs">
              No activity logs found for {selectedDevice}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
