/**
 * ==============================================================================
 * SAHYOG AI — Complete ESP32 Edge Device Firmware (SIH Prototype)
 * Multilingual Cooperative & Rural Legal Assistance
 *
 * Hardware:
 *   - ESP32-WROOM-32
 *   - PAM8403 Amplifier (DAC GPIO 25 with 28% volume attenuation, anti-clipping)
 *   - INMP441 I2S Microphone (SCK 14, WS 15, SD 32)
 *   - 0.96" SSD1306 OLED Display (SDA 21, SCL 22)
 *   - TTP223 Capacitive Touch Wake Sensor (GPIO 33) & BOOT button (GPIO 0)
 *   - Status LEDs (GPIO 2, GPIO 4)
 * ==============================================================================
 */

#include <Arduino.h>
#include <ArduinoJson.h>
#include "Config.h"
#include "OLEDManager.h"
#include "AudioManager.h"
#include "MicManager.h"
#include "WakeManager.h"
#include "MQTTManager.h"

// ─── Module Instances ─────────────────────────────────────────────────────────
OLEDManager  oledMgr;
AudioManager audioMgr;
MicManager   micMgr;
WakeManager  wakeMgr;
MQTTManager  mqttMgr;

// ─── System State ─────────────────────────────────────────────────────────────
DeviceState currentState = STATE_IDLE;
uint32_t stateEntryTime = 0;
String activeClip = "ANSWER";

void changeState(DeviceState newState) {
  if (currentState == newState) return;

  Serial.printf("[State] %s -> %s\n", stateToString(currentState), stateToString(newState));
  currentState = newState;
  stateEntryTime = millis();

  // Notify web console via MQTT
  mqttMgr.publishState(currentState);

  // State entry actions
  switch (currentState) {
    case STATE_IDLE:
      wakeMgr.setStatusLed(false);
      micMgr.stopRecording();
      break;

    case STATE_WAKE:
      wakeMgr.setStatusLed(true);
      audioMgr.playWakeSpeech(); // Speaks: "Hello Rishi, main hoon aap ki AI agent"
      break;

    case STATE_LISTENING:
      wakeMgr.setStatusLed(true);
      audioMgr.playClip("LISTEN"); // Speaks: "जी बोलिए, मैं सुन रही हूँ"
      micMgr.startRecording();
      break;

    case STATE_THINKING:
      wakeMgr.setStatusLed(false);
      micMgr.stopRecording();
      audioMgr.playThinkingCue();
      break;

    case STATE_SPEAKING:
      wakeMgr.setStatusLed(true);
      // Play scheme voice directly through the ESP32 PAM8403 physical speaker!
      audioMgr.playClip(activeClip);
      break;

    case STATE_ERROR:
      wakeMgr.setStatusLed(false);
      audioMgr.playErrorChime();
      break;
  }
}

// ─── Handle Remote Commands from Web / MQTT ──────────────────────────────────
void handleCommand(const char* topic, const char* payload) {
  Serial.printf("[Cmd Handler] Received command on %s: %s\n", topic, payload);

  String p = String(payload);
  p.trim();

  String cmdStr = p;
  String titleStr = "SAHYOG AI";
  String textStr = "";
  String clipStr = "ANSWER";

  // Check if JSON payload (e.g. {"command":"SPEAK","clip":"PM_KISAN","title":"...","text":"..."})
  if (p.startsWith("{")) {
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, p);
    if (!error) {
      if (doc["command"].is<const char*>()) cmdStr = String(doc["command"].as<const char*>());
      if (doc["clip"].is<const char*>())    clipStr = String(doc["clip"].as<const char*>());
      if (doc["title"].is<const char*>())   titleStr = String(doc["title"].as<const char*>());
      if (doc["text"].is<const char*>())    textStr = String(doc["text"].as<const char*>());
    }
  }

  cmdStr.toUpperCase();

  if (cmdStr.indexOf("WAKE") >= 0) {
    changeState(STATE_WAKE);
  } else if (cmdStr.indexOf("SPEAK") >= 0) {
    activeClip = clipStr;
    if (textStr.length() > 0 || titleStr.length() > 0) {
      oledMgr.setAnswerContent(titleStr.c_str(), textStr.c_str());
    }
    changeState(STATE_SPEAKING);
  } else if (cmdStr.indexOf("THINKING") >= 0) {
    changeState(STATE_THINKING);
  } else if (cmdStr.indexOf("LISTEN") >= 0) {
    changeState(STATE_LISTENING);
  } else if (cmdStr.indexOf("IDLE") >= 0) {
    activeClip = "ANSWER";
    oledMgr.clearAnswerContent();
    changeState(STATE_IDLE);
  } else if (p.indexOf("vol+") >= 0) {
    audioMgr.setVolume(audioMgr.getVolume() + 5);
  } else if (p.indexOf("vol-") >= 0) {
    audioMgr.setVolume(audioMgr.getVolume() - 5);
  }
}

// ─── Setup ───────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n========================================================");
  Serial.println("  SAHYOG AI — ESP32 Rural Assistant Node (" DEVICE_ID ")");
  Serial.println("  Hardware: ESP32 + PAM8403 + INMP441 + OLED + Touch");
  Serial.println("========================================================");

  // Initialize hardware modules
  wakeMgr.begin();
  audioMgr.begin();
  oledMgr.begin();
  micMgr.begin();

  // Try to connect to WiFi & Show live connection status on OLED
  Serial.println("\n[Network] Initializing WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  bool wifiOk = false;
  if (String(WIFI_SSID) != "YOUR_WIFI_SSID" && String(WIFI_SSID).length() > 0) {
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 15) {
      delay(400);
      attempts++;
      oledMgr.showWiFiConnecting(WIFI_SSID, attempts);
      Serial.print(".");
    }
    wifiOk = (WiFi.status() == WL_CONNECTED);
  }

  bool mqttOk = false;
  if (wifiOk) {
    Serial.printf("\n[WiFi] CONNECTED! Local IP: %s\n", WiFi.localIP().toString().c_str());
    mqttMgr.begin(handleCommand);
    mqttOk = mqttMgr.isConnected();
  } else {
    Serial.println("\n[WiFi] Offline mode (SSID not configured in Config.h).");
  }

  // Display Startup Connection & Web Status on OLED for 3.5 seconds
  String ipStr = wifiOk ? WiFi.localIP().toString() : "0.0.0.0";
  oledMgr.showConnectionSummary(WIFI_SSID, ipStr.c_str(), wifiOk, mqttOk);
  delay(3500);

  Serial.println("\n[System] All peripherals initialized. Ready.");
  Serial.println("  Press BOOT button or touch sensor to wake!");
  Serial.println("  Or interact live via the Web Chatbot!");
  Serial.println("========================================================\n");

  changeState(STATE_IDLE);
}

// ─── Main Loop State Machine ─────────────────────────────────────────────────
void loop() {
  uint32_t now = millis();

  // Run background network pump
  mqttMgr.loop();

  // Check touch sensor & button gestures (Single Tap vs 3-Second Hold)
  TouchGesture gesture = wakeMgr.checkGesture();
  uint32_t holdMs = wakeMgr.getCurrentHoldMs();

  // Update OLED visual animations (passes holdMs so it displays holding progress bar)
  oledMgr.updateAnimation(currentState, holdMs);

  // ─── Touch / Button Gesture Action ─────────────────────────────────────────
  if (gesture == GESTURE_TAP) {
    if (currentState == STATE_SPEAKING) {
      // Tap while speaking: dismisses speech and answer card early
      oledMgr.clearAnswerContent();
      changeState(STATE_IDLE);
    } else {
      // Single Tap (< 2s): Wake up the bot!
      changeState(STATE_WAKE);
    }
  } else if (gesture == GESTURE_HOLD_3SEC) {
    // Hold for 3 Seconds: Turn ON microphone so user can talk!
    changeState(STATE_LISTENING);
  }

  // ─── Serial Command Testing ────────────────────────────────────────────────
  if (Serial.available()) {
    char c = (char)Serial.read();
    if (c == 'w' || c == 'W') changeState(STATE_WAKE);
    else if (c == 'l' || c == 'L') changeState(STATE_LISTENING);
    else if (c == 't' || c == 'T') changeState(STATE_THINKING);
    else if (c == 's' || c == 'S') changeState(STATE_SPEAKING);
    else if (c == 'i' || c == 'I') changeState(STATE_IDLE);
    else if (c == '+') audioMgr.setVolume(audioMgr.getVolume() + 5);
    else if (c == '-') audioMgr.setVolume(audioMgr.getVolume() - 5);
    else if (c == ' ') audioMgr.playWakeChime();
  }

  // ─── State Machine ─────────────────────────────────────────────────────────
  switch (currentState) {
    case STATE_IDLE: {
      // STRICTLY IDLE: Calm blinking eyes waiting for user tap, hold, or Web command!
      // No automatic transitions!
      static uint32_t lastHeartbeat = 0;
      if (now - lastHeartbeat >= 3000) {
        lastHeartbeat = now;
        Serial.printf("[IDLE] Waiting... Touch(Pin %d)=%s | BOOT(Pin 0)=%s\n",
                      TOUCH_WAKE_PIN,
                      digitalRead(TOUCH_WAKE_PIN) ? "HIGH" : "LOW",
                      digitalRead(BOOT_BUTTON_PIN) ? "HIGH" : "LOW");
      }
      break;
    }

    case STATE_WAKE:
      // Waking greeting lasts 3.8s, then returns to IDLE waiting for user!
      // IT DOES NOT AUTOMATICALLY START LISTENING!
      if (now - stateEntryTime > 3800) {
        changeState(STATE_IDLE);
      }
      break;

    case STATE_LISTENING: {
      // Microphone is actively recording audio!
      int16_t audioBuf[128];
      size_t count = micMgr.readAudioChunk(audioBuf, 128);
      if (count > 0) {
        float energy = micMgr.calculateRMS(audioBuf, count);
        if (energy > 200.0f) {
          wakeMgr.recordActivity();
        }
      }

      // Record for 5 seconds while user talks, then transition to thinking
      if (now - stateEntryTime > 5000) {
        changeState(STATE_THINKING);
      }
      break;
    }

    case STATE_THINKING:
      // Show thinking animation for 2.5 seconds, then speak answer
      if (now - stateEntryTime > 2500) {
        changeState(STATE_SPEAKING);
      }
      break;

    case STATE_SPEAKING:
      // Speech output and answer card display on OLED finishes after 6.0s -> returns strictly to IDLE!
      if (now - stateEntryTime > 6000) {
        oledMgr.clearAnswerContent();
        changeState(STATE_IDLE);
      }
      break;

    case STATE_ERROR:
      if (now - stateEntryTime > 3000) {
        changeState(STATE_IDLE);
      }
      break;
  }
}
