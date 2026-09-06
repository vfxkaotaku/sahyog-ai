/**
 * mqttBridge.ts — MQTT to Socket.IO bridge for ESP32 devices
 * Handles real-time device status, state machine updates, and commands.
 */

import mqtt, { MqttClient } from 'mqtt';
import { Server as SocketServer } from 'socket.io';
import { db } from '../../db/database';

let client: MqttClient | null = null;

export function initMqttBridge(io: SocketServer): void {
  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883';
  console.log(`[MQTT] Connecting to broker: ${brokerUrl}`);

  try {
    client = mqtt.connect(brokerUrl, {
      connectTimeout: 5000,
      reconnectPeriod: 10000,
      clientId: `sahyog_backend_${Math.random().toString(16).substring(2, 8)}`,
    });

    client.on('connect', () => {
      console.log('[MQTT] Connected to broker successfully.');
      client?.subscribe('sahyog/+/status');
      client?.subscribe('sahyog/+/state');
      client?.subscribe('sahyog/+/telemetry');
      client?.subscribe('sahyog/+/events');
    });

    client.on('message', (topic, message) => {
      try {
        const payloadStr = message.toString();
        const parts = topic.split('/');
        const deviceId = parts[1];
        const subtopic = parts[2];

        let payload: any;
        try {
          payload = JSON.parse(payloadStr);
        } catch {
          payload = { value: payloadStr };
        }

        const device = db.devices.find((d) => d.deviceId === deviceId);

        if (subtopic === 'status') {
          if (device) {
            device.status = payload.status || 'ONLINE';
            if (payload.wifiRssi !== undefined) device.wifiRssi = payload.wifiRssi;
            if (payload.firmwareVersion) device.firmwareVersion = payload.firmwareVersion;
            device.lastSeen = new Date().toISOString();
          }
          io.emit('device_status', { deviceId, ...payload, ts: Date.now() });
        } else if (subtopic === 'state') {
          if (device) {
            device.currentState = payload.state || payload.value || 'IDLE';
            device.lastSeen = new Date().toISOString();
          }
          io.emit('device_state', { deviceId, state: payload.state || payload.value, ts: Date.now() });
        } else if (subtopic === 'telemetry') {
          io.emit('device_telemetry', { deviceId, ...payload, ts: Date.now() });
        }

        console.log(`[MQTT -> Web] ${topic}:`, payloadStr);
      } catch (err) {
        console.error('[MQTT] Message processing error:', err);
      }
    });

    client.on('error', (err) => {
      console.warn('[MQTT] Broker connection error (offline fallback mode):', err.message);
    });

    client.on('offline', () => {
      console.warn('[MQTT] Client offline. Retrying in background...');
    });
  } catch (err: any) {
    console.warn('[MQTT] Failed to initialize MQTT client:', err.message);
  }
}

export function publishDeviceCommand(deviceId: string, command: string, payload: any = {}): boolean {
  if (!client || !client.connected) {
    console.warn(`[MQTT] Cannot send command ${command} to ${deviceId}: broker not connected`);
    return false;
  }
  const topic = `sahyog/${deviceId}/command`;
  const message = JSON.stringify({ command, ...payload, ts: Date.now() });
  client.publish(topic, message);
  console.log(`[Web -> MQTT] ${topic}:`, message);
  return true;
}
