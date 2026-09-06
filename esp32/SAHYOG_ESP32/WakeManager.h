/**
 * ==============================================================================
 * WakeManager.h — Capacitive Touch & Button Wake Trigger for SAHYOG Node
 * Supports:
 *   1. TTP223 Digital Touch Sensor Module (GPIO 33) with auto-polarity detection
 *   2. Built-in BOOT Button on ESP32 (GPIO 0)
 *   3. Robust noise filtering (35ms hold check) & refractory lockout upon IDLE
 *      to 100% prevent false-trigger loops!
 * ==============================================================================
 */

#ifndef SAHYOG_WAKE_MANAGER_H
#define SAHYOG_WAKE_MANAGER_H

#include <Arduino.h>
#include "Config.h"

class WakeManager {
private:
  uint32_t lastTouchTime;
  uint32_t lastActivityTime;
  uint32_t lockoutUntil;
  bool wasTouched;
  int restingTouchLevel; // 0 = resting LOW (Standard TTP223), 1 = resting HIGH (Inverted)

public:
  WakeManager()
    : lastTouchTime(0),
      lastActivityTime(0),
      lockoutUntil(0),
      wasTouched(false),
      restingTouchLevel(0) {}

  void begin() {
    pinMode(BOOT_BUTTON_PIN, INPUT_PULLUP);
    pinMode(TOUCH_WAKE_PIN, INPUT_PULLDOWN);
    pinMode(STATUS_LED_PIN, OUTPUT);
    pinMode(AUX_LED_PIN, OUTPUT);

    digitalWrite(STATUS_LED_PIN, LOW);
    digitalWrite(AUX_LED_PIN, LOW);

    delay(100);

    // Auto-detect resting level of GPIO 33
    int highCount = 0;
    for (int i = 0; i < 20; i++) {
      if (digitalRead(TOUCH_WAKE_PIN) == HIGH) highCount++;
      delay(5);
    }
    // If resting state is mostly HIGH, active trigger is LOW (inverted mode).
    // Otherwise resting is LOW, active trigger is HIGH.
    restingTouchLevel = (highCount > 10) ? 1 : 0;

    lastActivityTime = millis();

    Serial.println("[Wake] Wake Sensors Configured:");
    Serial.printf("  - Built-in BOOT Button: GPIO %d (Active LOW)\n", BOOT_BUTTON_PIN);
    Serial.printf("  - Touch Sensor: GPIO %d (Resting Level: %s, Active when: %s)\n",
                  TOUCH_WAKE_PIN,
                  restingTouchLevel == 0 ? "LOW" : "HIGH",
                  restingTouchLevel == 0 ? "HIGH (Standard TTP223)" : "LOW (Inverted)");

    // Initial 1200ms grace period to let power stabilize
    armWake(1200);
  }

  // Grace period lockout: protects against false triggers immediately after state changes
  void armWake(uint32_t graceMs = 800) {
    lockoutUntil = millis() + graceMs;
    wasTouched = true; // User must release before a new wake trigger can be registered
  }

  // Returns true if a valid new wake event was triggered
  bool checkWakeTrigger() {
    uint32_t now = millis();

    // 1. Refractory lockout guard
    if (now < lockoutUntil) {
      return false;
    }

    // 2. Physical BOOT button on ESP32 (active LOW on GPIO 0)
    bool buttonBoot = (digitalRead(BOOT_BUTTON_PIN) == LOW);

    // 3. TTP223 digital touch sensor module (detects difference from resting level)
    bool touchActive = (digitalRead(TOUCH_WAKE_PIN) != restingTouchLevel);

    bool isTriggered = buttonBoot || touchActive;

    if (isTriggered) {
      if (!wasTouched && (now - lastTouchTime > TOUCH_DEBOUNCE_MS)) {
        // Confirmation delay: pin must remain active for 35ms to reject RF/audio amplifier spikes
        delay(35);
        bool confirmBoot = (digitalRead(BOOT_BUTTON_PIN) == LOW);
        bool confirmTouch = (digitalRead(TOUCH_WAKE_PIN) != restingTouchLevel);

        if (confirmBoot || confirmTouch) {
          wasTouched = true;
          lastTouchTime = now;
          lastActivityTime = now;
          const char* src = confirmBoot ? "Built-in BOOT Button (GPIO 0)" : "TTP223 Touch Sensor (GPIO 33)";
          Serial.printf("[Wake Event] >>> ACTIVATED by %s <<<\n", src);

          // Blink blue LED to acknowledge wake
          digitalWrite(STATUS_LED_PIN, HIGH);
          return true;
        }
      }
    } else {
      // User has released button and touch
      wasTouched = false;
    }

    return false;
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
