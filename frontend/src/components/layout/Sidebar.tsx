/**
 * Sidebar.tsx — Navigation sidebar for SAHYOG AI
 * Includes BOT-001 shortcuts, Demo Gov Portal, Camera & Printer Simulators, and Admin modules.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  MessageSquare, Camera, Printer, Building2,
  LayoutDashboard, Database, Cpu, X, Leaf,
  ListFilter, History, FileText
} from 'lucide-react';
import { useDeviceStore } from '../../state/deviceStore';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { to: '/', icon: MessageSquare, label: 'Chatbot (BOT-001)', primary: true },
  { to: '/portal', icon: Building2, label: 'Demo Gov Portal' },
  { to: '/camera?deviceId=BOT-001', icon: Camera, label: 'Camera Simulator' },
  { to: '/printer?deviceId=BOT-001', icon: Printer, label: 'Printer Simulator' },
];

const ADMIN_ITEMS = [
  { to: '/admin', icon: LayoutDashboard, label: 'System Dashboard' },
  { to: '/admin/devices', icon: Cpu, label: 'Chatbot Devices' },
  { to: '/admin/sources', icon: Database, label: 'Gov Data & Sync' },
  { to: '/admin/schemes', icon: ListFilter, label: 'Schemes' },
  { to: '/admin/conversations', icon: MessageSquare, label: 'Conversations' },
  { to: '/admin/logs', icon: History, label: 'Device Logs' },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const devices = useDeviceStore((s) => s.devices);
  const online = devices.filter((d) => d.status === 'ONLINE').length;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed left-0 top-0 bottom-0 z-50 w-64 bg-slate-900 border-r border-slate-800
          flex flex-col transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:flex
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100">SAHYOG AI</h1>
              <p className="text-[10px] text-slate-500 leading-none">Rural Assistant Node</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest px-2 mb-2 font-semibold">
            Device Interface
          </p>
          {NAV_ITEMS.map(({ to, icon: Icon, label, primary }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200
                ${isActive
                  ? primary
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                    : 'bg-slate-800 text-slate-100 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}

          <div className="mt-5 mb-2">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest px-2 font-semibold">
              Central Control Console
            </p>
          </div>
          {ADMIN_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200
                ${isActive
                  ? 'bg-slate-800 text-slate-100 border border-slate-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer: device status */}
        <div className="p-4 border-t border-slate-800">
          <div className="glass-card rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                Active Fleet
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                BOT-001
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-300">
                Kiosk Online • 10 Schemes
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
