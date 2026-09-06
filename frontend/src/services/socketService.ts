/**
 * socketService.ts — SAHYOG AI
 * Manages Socket.IO connection for real-time ESP32 ↔ Web sync.
 * Gracefully degrades when backend is offline.
 */

import { io, Socket } from 'socket.io-client';
import { useChatStore } from '../state/chatStore';
import { useDeviceStore } from '../state/deviceStore';
import type { AvatarState } from '../types';

let socket: Socket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3001';

// ─── Event types from backend ─────────────────────────────────────────────────
interface DeviceStateChange {
  deviceId: string;
  state: AvatarState;
}

interface DeviceStatusChange {
  deviceId: string;
  status: 'ONLINE' | 'OFFLINE';
  rssi?: number;
  ip?: string;
  firmware?: string;
}

// ─── Initialize connection ────────────────────────────────────────────────────
export function connectSocket(): void {
  if (socket?.connected) return;

  try {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionDelay: 2000,
      reconnectionAttempts: 5,
      timeout: 5000,
    });

    socket.on('connect', () => {
      console.log('[SAHYOG Socket] Connected:', socket?.id);
      useDeviceStore.getState().setSystemHealth({
        ...useDeviceStore.getState().systemHealth,
        mqttStatus: 'CONNECTED',
      });
    });

    socket.on('disconnect', () => {
      console.log('[SAHYOG Socket] Disconnected');
      useDeviceStore.getState().setSystemHealth({
        ...useDeviceStore.getState().systemHealth,
        mqttStatus: 'DISCONNECTED',
      });
    });

    socket.on('reconnecting', () => {
      useDeviceStore.getState().setSystemHealth({
        ...useDeviceStore.getState().systemHealth,
        mqttStatus: 'RECONNECTING',
      });
    });

    // Device state change (e.g. ESP32 touch wakes → LISTENING)
    socket.on('device_state_change', (data: DeviceStateChange) => {
      useDeviceStore.getState().updateDeviceState(data.deviceId, data.state);
      // If any device starts listening, sync the web avatar
      if (data.state === 'LISTENING') {
        useChatStore.getState().setAvatarState('LISTENING');
      } else if (data.state === 'IDLE') {
        useChatStore.getState().setAvatarState('IDLE');
      }
    });

    // Device online/offline
    socket.on('device_status_change', (data: DeviceStatusChange) => {
      useDeviceStore.getState().updateDeviceStatus(data.deviceId, data.status);
    });

  } catch (err) {
    console.warn('[SAHYOG Socket] Could not connect, running in offline demo mode.', err);
  }
}

// ─── Send command to device via server ───────────────────────────────────────
export function sendDeviceCommand(
  deviceId: string,
  command: string,
  payload?: Record<string, unknown>
): void {
  if (!socket?.connected) {
    console.warn('[SAHYOG Socket] Not connected — command not sent:', command);
    return;
  }
  socket.emit('device_command', { deviceId, command, payload });
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────
export function disconnectSocket(): void {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  socket?.disconnect();
  socket = null;
}

export function isConnected(): boolean {
  return socket?.connected ?? false;
}
