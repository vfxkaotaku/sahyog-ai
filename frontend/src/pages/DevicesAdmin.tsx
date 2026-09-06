/**
 * DevicesAdmin.tsx — Route: /admin/devices
 * Full CRUD device fleet manager for multi-device chatbot architecture.
 */

import React, { useState, useEffect } from 'react';
import {
  Cpu, Plus, Trash2, Edit2, CheckCircle2,
  XCircle, Wifi, RefreshCw, Send, Radio,
  Activity, ArrowRight, Eye, ShieldCheck
} from 'lucide-react';
import type { Device, DeviceType, CommMethod } from '../types';

export default function DevicesAdmin() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formId, setFormId] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formType, setFormType] = useState<DeviceType>('KIOSK');
  const [formComm, setFormComm] = useState<CommMethod>('MQTT');
  const [formMqttServer, setFormMqttServer] = useState('broker.hivemq.com:1883');
  const [formMqttTopic, setFormMqttTopic] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/devices');
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      }
    } catch (err) {
      console.warn('Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const openAddModal = () => {
    setEditingDevice(null);
    setFormName('');
    const nextId = `BOT-00${devices.length + 1}`;
    setFormId(nextId);
    setFormLocation('Gram Panchayat Kiosk Center');
    setFormType('KIOSK');
    setFormComm('MQTT');
    setFormMqttServer('broker.hivemq.com:1883');
    setFormMqttTopic(`chatbot/${nextId}`);
    setShowAddModal(true);
  };

  const openEditModal = (dev: Device) => {
    setEditingDevice(dev);
    setFormName(dev.name);
    setFormId(dev.deviceId);
    setFormLocation(dev.locationLabel);
    setFormType(dev.deviceType || 'KIOSK');
    setFormComm(dev.commMethod || 'MQTT');
    setFormMqttServer(dev.mqttServer || 'broker.hivemq.com:1883');
    setFormMqttTopic(dev.mqttTopic);
    setShowAddModal(true);
  };

  const handleSaveDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId.trim() || !formName.trim()) {
      alert('Device ID and Name are required.');
      return;
    }

    try {
      if (editingDevice) {
        // Update
        const res = await fetch(`http://localhost:3001/api/devices/${editingDevice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName.trim(),
            locationLabel: formLocation.trim(),
            deviceType: formType,
            commMethod: formComm,
            mqttServer: formMqttServer.trim(),
            mqttTopic: formMqttTopic.trim(),
          }),
        });
        if (res.ok) {
          setFeedback(`Updated ${editingDevice.deviceId} successfully!`);
        }
      } else {
        // Add new
        const res = await fetch('http://localhost:3001/api/devices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: formId.trim().toUpperCase(),
            name: formName.trim(),
            locationLabel: formLocation.trim(),
            deviceType: formType,
            commMethod: formComm,
            mqttServer: formMqttServer.trim(),
            mqttTopic: formMqttTopic.trim() || `chatbot/${formId.trim().toUpperCase()}`,
          }),
        });
        if (res.ok) {
          setFeedback(`Added new device ${formId.toUpperCase()} successfully!`);
        } else {
          const errData = await res.json();
          alert(errData.error || 'Failed to add device');
          return;
        }
      }

      setShowAddModal(false);
      loadDevices();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      console.error('Save device error:', err);
    }
  };

  const handleToggleEnable = async (dev: Device) => {
    try {
      const newEnabled = dev.enabled !== false ? false : true;
      const res = await fetch(`http://localhost:3001/api/devices/${dev.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: newEnabled,
          status: newEnabled ? 'ONLINE' : 'OFFLINE',
        }),
      });
      if (res.ok) {
        setFeedback(`${dev.deviceId} is now ${newEnabled ? 'Enabled' : 'Disabled'}`);
        loadDevices();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      console.error('Toggle enable error:', err);
    }
  };

  const handleDeleteDevice = async (id: string, devId: string) => {
    if (!confirm(`Are you sure you want to remove device ${devId}?`)) return;
    try {
      const res = await fetch(`http://localhost:3001/api/devices/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFeedback(`Device ${devId} removed.`);
        loadDevices();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            Chatbot Device Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure multi-device IoT fleet, communication topics, and live operational status
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Chatbot Device
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 px-4 py-2.5 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {feedback}
        </div>
      )}

      {/* ── Device Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {devices.map((dev) => {
          const isEnabled = dev.enabled !== false;
          const isOnline = dev.status === 'ONLINE';

          return (
            <div
              key={dev.id}
              className={`glass-card p-6 rounded-2xl border transition-all ${
                dev.deviceId === 'BOT-001'
                  ? 'border-emerald-500/40 bg-slate-900/70 shadow-lg shadow-emerald-950/20'
                  : 'border-slate-800 bg-slate-900/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <Cpu className={`w-5 h-5 ${isOnline ? 'text-emerald-400' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {dev.deviceId}
                      </span>
                      {dev.deviceId === 'BOT-001' && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          PRIMARY KIOSK
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-100 mt-1">{dev.name}</h3>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${
                    isOnline
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  {dev.status}
                </span>
              </div>

              {/* Device Specs & Location */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Location:</span>
                  <span className="text-slate-300 font-medium">{dev.locationLabel}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Type & Protocol:</span>
                  <span className="text-slate-300 font-medium">{dev.deviceType || 'KIOSK'} • {dev.commMethod || 'MQTT'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">MQTT Topic:</span>
                  <span className="text-amber-400 font-mono text-[11px]">{dev.mqttTopic}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Knowledge Updated:</span>
                  <span className="text-slate-300">{dev.knowledgeLastUpdated || '06/09/2026'}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleToggleEnable(dev)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isEnabled
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      : 'bg-amber-600 hover:bg-amber-500 text-white'
                  }`}
                >
                  {isEnabled ? 'Disable Device' : 'Enable Device'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(dev)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Edit Configuration"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {dev.deviceId !== 'BOT-001' && (
                    <button
                      onClick={() => handleDeleteDevice(dev.id, dev.deviceId)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      title="Remove Device"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Add / Edit Device Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                {editingDevice ? `Edit Chatbot ${editingDevice.deviceId}` : 'Register New Chatbot Device'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-100 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDevice} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Device ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BOT-002"
                    value={formId}
                    disabled={Boolean(editingDevice)}
                    onChange={(e) => {
                      setFormId(e.target.value);
                      setFormMqttTopic(`chatbot/${e.target.value.trim().toUpperCase()}`);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-emerald-500/50 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Device Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Government Assistant 02"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Nashik Gram Panchayat Hall"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Device Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as DeviceType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="KIOSK">KIOSK (Fixed Station)</option>
                    <option value="ESP32">ESP32 Hardware Node</option>
                    <option value="DESKTOP">Desktop Workstation</option>
                    <option value="MOBILE">Mobile Assistant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Communication</label>
                  <select
                    value={formComm}
                    onChange={(e) => setFormComm(e.target.value as CommMethod)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="MQTT">MQTT Broker</option>
                    <option value="WEBSOCKET">WebSocket</option>
                    <option value="HYBRID">Hybrid (MQTT + WS)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">MQTT Server</label>
                  <input
                    type="text"
                    value={formMqttServer}
                    onChange={(e) => setFormMqttServer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">MQTT Topic Root</label>
                  <input
                    type="text"
                    value={formMqttTopic}
                    onChange={(e) => setFormMqttTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-950/40"
                >
                  {editingDevice ? 'Save Changes' : 'Register Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
