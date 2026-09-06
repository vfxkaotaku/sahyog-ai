/**
 * mqttService.ts — Real-time Web ↔ ESP32 MQTT Client over Secure WebSockets (WSS)
 * Connects directly to wss://broker.hivemq.com:8884/mqtt
 * Enables instant two-way control between the website and physical ESP32 kiosk node,
 * working seamlessly on both Localhost and GitHub Pages (HTTPS).
 */

import mqtt, { MqttClient } from 'mqtt';
import { useChatStore } from '../state/chatStore';
import { useDeviceStore } from '../state/deviceStore';
import type { AvatarState } from '../types';

let client: MqttClient | null = null;
let isConnecting = false;

export function initMqttClient(): void {
  if (client?.connected || isConnecting) return;

  const brokerUrl = 'wss://broker.hivemq.com:8884/mqtt';
  const clientId = `sahyog_web_${Math.random().toString(16).substring(2, 8)}`;

  console.log(`[Web MQTT] Connecting to ${brokerUrl} (Client: ${clientId})...`);
  isConnecting = true;

  try {
    client = mqtt.connect(brokerUrl, {
      clientId,
      keepalive: 30,
      clean: true,
      reconnectPeriod: 4000,
      connectTimeout: 8000,
    });

    client.on('connect', () => {
      isConnecting = false;
      console.log('[Web MQTT] Connected to broker.hivemq.com successfully!');
      useDeviceStore.getState().setSystemHealth({
        ...useDeviceStore.getState().systemHealth,
        mqttStatus: 'CONNECTED',
      });

      // Subscribe to all SAHYOG node topics
      client?.subscribe('sahyog/+/state', { qos: 0 });
      client?.subscribe('sahyog/+/status', { qos: 0 });
      client?.subscribe('sahyog/+/telemetry', { qos: 0 });
    });

    client.on('message', (topic: string, message: Uint8Array) => {
      try {
        const payloadStr = new TextDecoder().decode(message);
        const parts = topic.split('/');
        const deviceId = parts[1] || 'BOT-001';
        const subtopic = parts[2];

        let data: any;
        try {
          data = JSON.parse(payloadStr);
        } catch {
          data = { value: payloadStr };
        }

        console.log(`[Web MQTT RX] ${topic}:`, data);

        if (subtopic === 'state') {
          const rawState = (data.state || data.value || 'IDLE').toString().toUpperCase();
          let state: AvatarState = 'IDLE';
          if (rawState === 'WAKE' || rawState === 'LISTENING') {
            state = 'LISTENING';
          } else if (rawState === 'THINKING') {
            state = 'THINKING';
          } else if (rawState === 'SPEAKING') {
            state = 'SPEAKING';
          } else if (rawState === 'ERROR') {
            state = 'ERROR';
          } else if (rawState === 'CAMERA') {
            state = 'CAMERA';
          } else {
            state = 'IDLE';
          }

          useDeviceStore.getState().updateDeviceState(deviceId, state);
          if (deviceId === 'BOT-001') {
            useChatStore.getState().setAvatarState(state);
          }
        } else if (subtopic === 'status') {
          const status = data.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE';
          useDeviceStore.getState().updateDeviceStatus(deviceId, status);
        }
      } catch (e) {
        console.error('[Web MQTT] Failed to parse message:', e);
      }
    });

    client.on('error', (err) => {
      isConnecting = false;
      console.warn('[Web MQTT] Connection warning:', err.message);
    });

    client.on('close', () => {
      isConnecting = false;
      console.log('[Web MQTT] Connection closed.');
    });
  } catch (err) {
    isConnecting = false;
    console.error('[Web MQTT] Initialization error:', err);
  }
}

export function isMqttConnected(): boolean {
  return client?.connected || false;
}

export async function publishHardwareCommand(
  deviceId: string = 'BOT-001',
  command: string,
  payload: Record<string, any> = {}
): Promise<{ success: boolean; method: string }> {
  const topic = `sahyog/${deviceId}/command`;
  const message = JSON.stringify({ command, ...payload, ts: Date.now() });

  let sentViaMqtt = false;

  // 1. Direct publish via Secure WebSockets to HiveMQ (instant live bridge)
  if (client && client.connected) {
    client.publish(topic, message, { qos: 1 }, (err) => {
      if (err) console.warn('[Web MQTT] Direct publish error:', err);
      else console.log(`[Web MQTT TX] Dispatched to ${topic}:`, message);
    });
    sentViaMqtt = true;
  }

  // 2. Also dispatch to local backend if available (syncs database logs)
  try {
    fetch(`/api/devices/${deviceId}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, payload }),
      signal: AbortSignal.timeout(1500),
    }).catch(() => {});
  } catch {}

  return {
    success: true,
    method: sentViaMqtt ? 'MQTT (HiveMQ WSS)' : 'HTTP Backend',
  };
}
