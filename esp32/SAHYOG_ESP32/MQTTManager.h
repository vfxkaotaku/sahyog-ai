/**
 * ==============================================================================
 * MQTTManager.h — WiFi & MQTT Client for SAHYOG AI Hardware Kiosk Node
 * Publishes state transitions, telemetry, and receives remote commands.
 * ==============================================================================
 */

#ifndef SAHYOG_MQTT_MANAGER_H
#define SAHYOG_MQTT_MANAGER_H

#include <WiFi.h>
#include <PubSubClient.h>
#include "Config.h"

typedef void (*CommandCallback)(const char* command, const char* payload);

class MQTTManager {
private:
  WiFiClient espClient;
  PubSubClient mqttClient;
  CommandCallback onCommandReceived;
  uint32_t lastReconnectAttempt;
  uint32_t lastHeartbeat;

public:
  MQTTManager() : mqttClient(espClient), onCommandReceived(nullptr), lastReconnectAttempt(0), lastHeartbeat(0) {}

  void begin(CommandCallback cmdCb = nullptr) {
    onCommandReceived = cmdCb;
    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
    
    // Set callback lambda
    mqttClient.setCallback([this](char* topic, byte* payload, unsigned int length) {
      char message[256];
      unsigned int copyLen = min(length, (unsigned int)(sizeof(message) - 1));
      memcpy(message, payload, copyLen);
      message[copyLen] = '\0';

      Serial.printf("[MQTT RX] %s: %s\n", topic, message);

      if (this->onCommandReceived) {
        this->onCommandReceived(topic, message);
      }
    });

    connectWiFi();
  }

  void connectWiFi() {
    Serial.printf("[WiFi] Connecting to %s...\n", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  }

  bool isConnected() {
    return WiFi.status() == WL_CONNECTED && mqttClient.connected();
  }

  void loop() {
    if (WiFi.status() != WL_CONNECTED) {
      // WiFi disconnected
      return;
    }

    if (!mqttClient.connected()) {
      uint32_t now = millis();
      if (now - lastReconnectAttempt > 5000) {
        lastReconnectAttempt = now;
        if (reconnect()) {
          lastReconnectAttempt = 0;
        }
      }
    } else {
      mqttClient.loop();

      // Periodic heartbeat (every 15s)
      uint32_t now = millis();
      if (now - lastHeartbeat > 15000) {
        lastHeartbeat = now;
        publishStatus("ONLINE");
      }
    }
  }

  bool reconnect() {
    Serial.printf("[MQTT] Connecting to broker %s:%d...\n", MQTT_BROKER, MQTT_PORT);
    String clientId = String("sahyog-esp32-") + String(random(0xffff), HEX);
    
    // Will topic for clean disconnect notice
    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS, MQTT_TOPIC_STATUS, 1, true, "{\"status\":\"OFFLINE\"}")) {
      Serial.println("[MQTT] Connected successfully!");
      mqttClient.subscribe(MQTT_TOPIC_COMMAND);
      publishStatus("ONLINE");
      return true;
    } else {
      Serial.printf("[MQTT] Connection failed, rc=%d\n", mqttClient.state());
      return false;
    }
  }

  void publishStatus(const char* status) {
    if (!mqttClient.connected()) return;
    char buffer[128];
    snprintf(buffer, sizeof(buffer), 
             "{\"status\":\"%s\",\"wifiRssi\":%d,\"firmwareVersion\":\"%s\"}",
             status, WiFi.RSSI(), FIRMWARE_VERSION);
    mqttClient.publish(MQTT_TOPIC_STATUS, buffer);
  }

  void publishState(DeviceState state) {
    if (!mqttClient.connected()) return;
    const char* str = stateToString(state);
    char buffer[128];
    snprintf(buffer, sizeof(buffer), "{\"state\":\"%s\",\"ts\":%lu}", str, millis());
    mqttClient.publish(MQTT_TOPIC_STATE, buffer);
    Serial.printf("[MQTT TX] State -> %s\n", str);
  }
};

#endif // SAHYOG_MQTT_MANAGER_H
