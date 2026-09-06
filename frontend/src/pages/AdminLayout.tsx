/**
 * AdminLayout.tsx — Central Management & Control Console
 * Navigation for Dashboard, Chatbot Devices, Government Data, Schemes,
 * Conversations, and Device Activity Logs.
 */

import React from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Database, Cpu, ChevronLeft,
  MessageSquare, History, ListFilter, Camera,
  Printer, Building2, ExternalLink
} from 'lucide-react';

const ADMIN_TABS = [
  { to: '/admin', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/devices', end: false, icon: Cpu, label: 'Chatbot Devices' },
  { to: '/admin/sources', end: false, icon: Database, label: 'Government Data' },
  { to: '/admin/schemes', end: false, icon: ListFilter, label: 'Schemes' },
  { to: '/admin/conversations', end: false, icon: MessageSquare, label: 'Conversations' },
  { to: '/admin/logs', end: false, icon: History, label: 'Device Logs' },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* ── Admin Header ── */}
      <header className="flex-shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-100">Chatbot Control & Management Console</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                SYSTEM CONTROL
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Centralized fleet monitoring, synchronized data feeds, and device diagnostics
            </p>
          </div>
        </div>

        {/* Quick Simulator Jump Links */}
        <div className="flex items-center gap-2">
          <Link
            to="/portal"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs border border-amber-500/25 transition-all"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Demo Portal</span>
          </Link>

          <Link
            to="/camera?deviceId=BOT-001"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-all"
          >
            <Camera className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Camera</span>
          </Link>

          <Link
            to="/printer?deviceId=BOT-001"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Printer</span>
          </Link>
        </div>
      </header>

      {/* ── Sub Navigation Tabs ── */}
      <div className="flex-shrink-0 flex items-center gap-1 px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 overflow-x-auto text-xs">
        {ADMIN_TABS.map(({ to, end, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`
            }
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </NavLink>
        ))}
      </div>

      {/* ── Tab Content Outlet ── */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
