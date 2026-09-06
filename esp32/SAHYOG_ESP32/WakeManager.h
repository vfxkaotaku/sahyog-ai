/**
 * ==============================================================================
 * WakeManager.h — Capacitive Touch & BOOT Button Gesture Engine
 * SAHYOG AI Hardware Kiosk Node
 *
 * Implements:
 *   1. Single Tap (< 2s): Wakes up the bot (happy greeting face + voice speech)
 *   2. Hold for 3 Seconds (>= 3000ms): Turns on the microphone (Listening mode)
 *   3. Rejects noise spikes (< 60ms) and guards against stuck sensors (> 7s)
 *   4. Supports TTP223 touch switch (GPIO 33) and built-in BOOT button (GPIO 0)
 * ==============================================================================
 */

#ifndef SAHYOG_WAKE_MANAGER_H
#define SAHYOG_WAKE_MANAGER_H

#include <Arduino.h>
#include "Config.h"

enum TouchGesture {
  GESTURE_NONE = 0,
  GESTURE_TAP = 1,       // Single tap (< 2s): Bot wakes up
  GESTURE_HOLD_3SEC = 2  // Held for 3 seconds: Microphone turns on
};

class WakeManager {
private:
  uint32_t pressStartTime;
  uint32_t lastReleaseTime;
  uint32_t lastActivityTime;
  bool isPressed;
  bool holdTriggered;
  int restingTouchLevel; // 0 = resting LOW (standard TTP223), 1 = resting HIGH (inverted)

public:
  WakeManager()
    : pressStartTime(0),
      lastReleaseTime(0),
      lastActivityTime(0),
      isPressed(false),
      holdTriggered(false),
      restingTouchLevel(0) {}

  void begin() {
    pinMode(BOOT_BUTTON_PIN, INPUT_PULLUP);
    pinMode(TOUCH_WAKE_PIN, INPUT_PULLDOWN);
    pinMode(STATUS_LED_PIN, OUTPUT);
    pinMode(AUX_LED_PIN, OUTPUT);

    digitalWrite(STATUS_LED_PIN, LOW);
    digitalWrite(AUX_LED_PIN, LOW);

    // Allow 400ms for power rails and TTP223 internal calibration to settle
    delay(400);

    // Auto-detect resting level of GPIO 33
    int highCount = 0;
    for (int i = 0; i < 20; i++) {
      if (digitalRead(TOUCH_WAKE_PIN) == HIGH) highCount++;
      delay(5);
    }
    // Standard TTP223 rests LOW and goes HIGH on touch
    // If resting state is HIGH, active trigger is LOW (inverted)
    restingTouchLevel = (highCount >= 15) ? 1 : 0;

    lastActivityTime = millis();
    lastReleaseTime = millis();

    Serial.println("\n========================================================");
    Serial.println("  [WakeManager] Interactive Touch & Button Engine Ready");
    Serial.printf("  • Capacitive Touch Pin : GPIO %d (Resting: %s, Active: %s)\n",
                  TOUCH_WAKE_PIN,
                  restingTouchLevel == 0 ? "LOW" : "HIGH",
                  restingTouchLevel == 0 ? "HIGH" : "LOW");
    Serial.printf("  • Built-in BOOT Button : GPIO %d (Active LOW)\n", BOOT_BUTTON_PIN);
    Serial.println("  • Interaction Gestures:");
    Serial.println("      - TAP ONCE (< 2s)  --> Wake Up Bot");
    Serial.println("      - HOLD FOR 3 SEC   --> Turn ON Microphone (Talk)");
    Serial.println("========================================================\n");
  }

  // Returns true if either the TTP223 capacitive switch or the BOOT button is being pressed
  bool isRawSensorActive() {
    // 1. Built-in BOOT button (GPIO 0, active LOW with pullup)
    if (digitalRead(BOOT_BUTTON_PIN) == LOW) {
      return true;
    }

    // 2. TTP223 capacitive touch switch (detects difference from resting level)
    if (digitalRead(TOUCH_WAKE_PIN) != restingTouchLevel) {
      return true;
    }

    return false;
  }

  // Returns current hold duration in ms if sensor is currently pressed, or 0 if released
  uint32_t getCurrentHoldMs() const {
    if (!isPressed) return 0;
    return (millis() - pressStartTime);
  }

  bool isCurrentlyHolding() const {
    return isPressed;
  }

  // Process touch sensor and return GESTURE_TAP, GESTURE_HOLD_3SEC, or GESTURE_NONE
  TouchGesture checkGesture() {
    uint32_t now = millis();
    bool rawActive = isRawSensorActive();

    if (rawActive) {
      if (!isPressed) {
        // Initial touch/press transition
        isPressed = true;
        pressStartTime = now;
        holdTriggered = false;
        lastActivityTime = now;
        digitalWrite(STATUS_LED_PIN, HIGH); // Visual feedback: LED turns on immediately
      } else {
        // Sensor is actively being held down
        uint32_t holdDuration = now - pressStartTime;

        // Anti-stuck safety guard: If held for > 7000ms, it is a stuck sensor or floating wire
        // Reset state so bot NEVER gets trapped in a waking/listening loop!
        if (holdDuration > 7000) {
          Serial.println("[Touch Safety] Sensor active > 7s! Resetting baseline to prevent loop...");
          restingTouchLevel = digitalRead(TOUCH_WAKE_PIN);
          isPressed = false;
          holdTriggered = false;
          digitalWrite(STATUS_LED_PIN, LOW);
          return GESTURE_NONE;
        }

        // Check if held for 3 seconds
        if (holdDuration >= 3000 && !holdTriggered) {
          holdTriggered = true;
          lastActivityTime = now;
          digitalWrite(STATUS_LED_PIN, LOW);
          Serial.println("\n[Touch] >>> 3-SECOND HOLD CONFIRMED! Turning on Microphone! <<<");
          return GESTURE_HOLD_3SEC;
        }
      }
    } else {
      // Sensor is NOT active (released)
      if (isPressed) {
        uint32_t pressDuration = now - pressStartTime;
        isPressed = false;
        lastReleaseTime = now;
        lastActivityTime = now;
        digitalWrite(STATUS_LED_PIN, LOW);

        // If it was already triggered as a 3-second hold, ignore the release
        if (holdTriggered) {
          holdTriggered = false;
          return GESTURE_NONE;
        }

        // Single Tap: must be between 60ms (rejects noise spikes) and 2000ms
        if (pressDuration >= 60 && pressDuration < 2000) {
          Serial.printf("\n[Touch] >>> SINGLE TAP DETECTED (%lu ms)! Waking up Bot! <<<\n", pressDuration);
          return GESTURE_TAP;
        }
      }
    }

    return GESTURE_NONE;
  }

  void recordActivity() {
    lastActivityTime = millis();
  }

  bool isIdleTimeout() const {
    return (millis() - lastActivityTime > IDLE_TIMEOUT_MS);
  }

  void setStatusLed(bool on) {
    digitalWrite(STATUS_LED_PIN, on ? HIGH : LOW);
  }

  void pulseLed(uint16_t durationMs = 150) {
    digitalWrite(STATUS_LED_PIN, HIGH);
    delay(durationMs);
    digitalWrite(STATUS_LED_PIN, LOW);
  }
};

#endif // SAHYOG_WAKE_MANAGER_H
