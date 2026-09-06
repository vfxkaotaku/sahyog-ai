/**
 * Dashboard.tsx — Route: /admin
 * Central System Dashboard displaying live metrics, multi-device status,
 * government data synchronization health, and quick actions.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu, Database, ScanLine, Printer, Wifi, RefreshCw,
  BookOpen, MessageSquare, History, CheckCircle2, ArrowRight,
  ExternalLink, Building2, Camera
} from 'lucide-react';
import type { Device } from '../types';

interface PortalStatus {
  totalSchemes: number;
  totalChunks: number;
  syncStatus: string;
  lastSync: string;
  dataSourceName: string;
}

export default function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [portalStatus, setPortalStatus] = useState<PortalStatus | null>(null);
  const [convCount, setConvCount] = useState<number>(0);
  const [jobCount, setJobCount] = useState<number>(0);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      // 1. Fetch devices
      const devRes = await fetch('http://localhost:3001/api/devices');
      if (devRes.ok) {
        const d = await devRes.json();
        setDevices(d);
      }
      // 2. Fetch portal status
      const pRes = await fetch('http://localhost:3001/api/portal/status');
      if (pRes.ok) {
        const p = await pRes.json();
        setPortalStatus(p);
      }
      // 3. Fetch conversations
      const cRes = await fetch('http://localhost:3001/api/conversations');
      if (cRes.ok) {
        const c = await cRes.json();
        setConvCount(c.length);
      }
      // 4. Fetch print jobs
      const jRes = await fetch('http://localhost:3001/api/printer/jobs');
      if (jRes.ok) {
        const j = await jRes.json();
        setJobCount(j.length);
      }
    } catch (err) {
      console.warn('Dashboard data fetch warning:', err);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncMsg(null);
      const res = await fetch('http://localhost:3001/api/portal/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: 'BOT-001' }),
      });
      const data = await res.json();
      setSyncMsg(`Synced ${data.schemeCount} schemes (${data.chunkCount} knowledge chunks) to BOT-001!`);
      loadData();
      setTimeout(() => setSyncMsg(null), 5000);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const onlineCount = devices.filter((d) => d.status === 'ONLINE').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Central Management Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            System overview for Chatbot Kiosk Fleet, Government Knowledge Sync, and Device Logs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing Schemes...' : 'Sync Government Data'}
          </button>
        </div>
      </div>

      {/* Sync Toast */}
      {syncMsg && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 px-4 py-2.5 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {syncMsg}
        </div>
      )}

      {/* ── Metrics Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Chatbot Fleet</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-100">{onlineCount} / {devices.length}</p>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            BOT-001 Online (Active)
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Synced Schemes</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-100">{portalStatus?.totalSchemes || 10}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {portalStatus?.totalChunks || 30} Knowledge Chunks
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Conversations</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-100">{convCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Stored interactions</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Printer Jobs</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-100">{jobCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Receipts generated</p>
        </div>
      </div>

      {/* ── Quick Simulator Navigation Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/"
          className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 bg-slate-900/40 hover:bg-slate-900/70 transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                BOT-001
              </span>
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
              Chatbot Device Interface
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Open the primary Government Assistant 01 kiosk with multilingual chat and scheme answers.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-emerald-400 font-semibold flex items-center justify-between">
            <span>Launch BOT-001</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/camera?deviceId=BOT-001"
          className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-sky-500/40 bg-slate-900/40 hover:bg-slate-900/70 transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                OPTICAL SCANNER
              </span>
              <Camera className="w-4 h-4 text-sky-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
              Camera Simulator (BOT-001)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Webcam document scanner with OCR text extraction linked to BOT-001.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-sky-400 font-semibold flex items-center justify-between">
            <span>Launch Camera</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/printer?deviceId=BOT-001"
          className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-amber-500/40 bg-slate-900/40 hover:bg-slate-900/70 transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                58MM THERMAL POS
              </span>
              <Printer className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
              Printer Simulator (BOT-001)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Virtual POS thermal receipt printer with print preview and download capabilities.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-amber-400 font-semibold flex items-center justify-between">
            <span>Launch Printer</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* ── Active Fleet Status ── */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Registered Chatbot Devices</h3>
            <p className="text-xs text-slate-400">Dynamic Device ID routing across MQTT, WebSocket, and Central API</p>
          </div>
          <Link
            to="/admin/devices"
            className="text-xs text-emerald-400 font-semibold hover:underline flex items-center gap-1"
          >
            Manage Fleet <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {devices.map((d) => (
            <div
              key={d.id}
              className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${d.status === 'ONLINE' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-400">{d.deviceId}</span>
                    <span className="text-xs font-semibold text-slate-200">{d.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{d.locationLabel}</p>
                </div>
              </div>

              <div className="text-right text-xs">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  d.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                }`}>
                  {d.status}
                </span>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">{d.mqttTopic}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
