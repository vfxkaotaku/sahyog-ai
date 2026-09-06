import { create } from 'zustand';
import type { Device, AvatarState, SystemHealth } from '../types';

// ─── Seeded demo devices ──────────────────────────────────────────────────────
const DEMO_DEVICES: Device[] = [
  {
    id: '1',
    deviceId: 'SAHYOG-NODE-01',
    name: 'Nashik Gram Panchayat Kiosk',
    locationLabel: 'Nashik, Maharashtra',
    mqttTopic: 'sahyog/SAHYOG-NODE-01',
    firmwareVersion: '1.2.0',
    status: 'OFFLINE',
    currentState: 'IDLE',
    wifiRssi: -62,
    lastSeen: new Date(Date.now() - 5 * 60000).toISOString(),
    telemetry: {
      micStatus: true,
      speakerStatus: true,
      oledStatus: true,
      wakeSwitch: false,
      ipAddress: '192.168.1.145',
    },
  },
  {
    id: '2',
    deviceId: 'SAHYOG-NODE-02',
    name: 'Pune Cooperative Office Kiosk',
    locationLabel: 'Pune, Maharashtra',
    mqttTopic: 'sahyog/SAHYOG-NODE-02',
    firmwareVersion: '1.1.3',
    status: 'OFFLINE',
    currentState: 'IDLE',
    wifiRssi: -71,
    lastSeen: new Date(Date.now() - 25 * 60000).toISOString(),
    telemetry: {
      micStatus: true,
      speakerStatus: false,
      oledStatus: true,
      wakeSwitch: false,
      ipAddress: '192.168.2.88',
    },
  },
];

const DEMO_HEALTH: SystemHealth = {
  connectedDevices: 0,
  mqttStatus: 'DISCONNECTED',
  knowledgeChunks: 247,
  ocrSessions: 12,
  printerJobs: 5,
  sources: 8,
};

// ─── Store interface ──────────────────────────────────────────────────────────
interface DeviceState {
  devices: Device[];
  systemHealth: SystemHealth;
  activeDeviceId: string | null;

  // Actions
  setDevices: (devices: Device[]) => void;
  updateDeviceState: (deviceId: string, state: AvatarState) => void;
  updateDeviceStatus: (deviceId: string, status: Device['status']) => void;
  addDevice: (device: Device) => void;
  removeDevice: (id: string) => void;
  setSystemHealth: (health: SystemHealth) => void;
  setActiveDevice: (deviceId: string | null) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  devices: DEMO_DEVICES,
  systemHealth: DEMO_HEALTH,
  activeDeviceId: null,

  setDevices: (devices) => set({ devices }),

  updateDeviceState: (deviceId, state) =>
    set((s) => ({
      devices: s.devices.map((d) =>
        d.deviceId === deviceId ? { ...d, currentState: state } : d
      ),
    })),

  updateDeviceStatus: (deviceId, status) =>
    set((s) => ({
      devices: s.devices.map((d) =>
        d.deviceId === deviceId
          ? { ...d, status, lastSeen: new Date().toISOString() }
          : d
      ),
    })),

  addDevice: (device) =>
    set((s) => ({ devices: [...s.devices, device] })),

  removeDevice: (id) =>
    set((s) => ({ devices: s.devices.filter((d) => d.id !== id) })),

  setSystemHealth: (health) => set({ systemHealth: health }),
  setActiveDevice: (deviceId) => set({ activeDeviceId: deviceId }),
}));
