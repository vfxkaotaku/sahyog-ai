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
      audioMgr.playWakeChime();
      break;

    case STATE_LISTENING:
      wakeMgr.setStatusLed(true);
      audioMgr.playListeningCue();
      micMgr.startRecording();
      break;

    case STATE_THINKING:
      wakeMgr.setStatusLed(false);
      micMgr.stopRecording();
      audioMgr.playThinkingCue();
      break;

    case STATE_SPEAKING:
      wakeMgr.setStatusLed(true);
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

  if (p.indexOf("WAKE") >= 0 || p.indexOf("wake") >= 0) {
    changeState(STATE_WAKE);
  } else if (p.indexOf("SPEAK") >= 0 || p.indexOf("speak") >= 0) {
    changeState(STATE_SPEAKING);
  } else if (p.indexOf("IDLE") >= 0 || p.indexOf("idle") >= 0) {
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
  Serial.println("  SAHYOG AI — ESP32 Rural Assistant Node (SIH)");
  Serial.println("  Hardware: ESP32 + PAM8403 + INMP441 + OLED + TTP223");
  Serial.println("========================================================");

  // Initialize hardware modules
  wakeMgr.begin();
  audioMgr.begin();
  oledMgr.begin();
  micMgr.begin();
  mqttMgr.begin(handleCommand);

  Serial.println("\n[System] All peripherals initialized. Ready.");
  Serial.println("  Type commands in Serial Monitor to test:");
  Serial.println("    'w' : Trigger Wake state");
  Serial.println("    'l' : Trigger Listening state");
  Serial.println("    't' : Trigger Thinking state");
  Serial.println("    's' : Trigger Speaking state");
  Serial.println("    'i' : Return to Idle state");
  Serial.println("    '+'/'-' : Volume control (PAM8403)");
  Serial.println("========================================================\n");

  changeState(STATE_IDLE);
}

// ─── Main Loop State Machine ─────────────────────────────────────────────────
void loop() {
  uint32_t now = millis();

  // Run background network pump
  mqttMgr.loop();

  // Update OLED visual animations
  oledMgr.updateAnimation(currentState);

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
    case STATE_IDLE:
      // Check capacitive touch or BOOT button wake
      if (wakeMgr.checkWakeTrigger()) {
        changeState(STATE_WAKE);
      }
      break;

    case STATE_WAKE:
      // Show greeting face briefly, then transition to listening
      if (now - stateEntryTime > 1200) {
        changeState(STATE_LISTENING);
      }
      break;

    case STATE_LISTENING: {
      // Record audio from INMP441
      int16_t audioBuf[128];
      size_t count = micMgr.readAudioChunk(audioBuf, 128);
      if (count > 0) {
        float energy = micMgr.calculateRMS(audioBuf, count);
        // Energy can be monitored or streamed
        if (energy > 200.0f) {
          wakeMgr.recordActivity();
        }
      }

      // Record for 4.5 seconds or until silence
      if (now - stateEntryTime > 4500) {
        changeState(STATE_THINKING);
      }
      break;
    }

    case STATE_THINKING:
      // In real system, waiting for cloud/local LLM + RAG response
      // Demo simulated processing delay
      if (now - stateEntryTime > 2500) {
        changeState(STATE_SPEAKING);
      }
      break;

    case STATE_SPEAKING: {
      // Play acoustic output through PAM8403 DAC
      static uint32_t lastToneStep = 0;
      if (now - lastToneStep > 500) {
        lastToneStep = now;
        audioMgr.playTone(550 + (random(0, 4) * 110), 120);
      }

      // Return to IDLE after speech output completes
      if (now - stateEntryTime > 3500) {
        changeState(STATE_IDLE);
      }
      break;
    }

    case STATE_ERROR:
      if (now - stateEntryTime > 3000) {
        changeState(STATE_IDLE);
      }
      break;
  }
}
