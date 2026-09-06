/**
 * ==============================================================================
 * WakeManager.h — Capacitive Touch & Button Wake Trigger for SAHYOG Node
 * Manages TTP223 capacitive touch sensor and BOOT button with debouncing.
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
  bool wasTouched;
  int baselineCap;
  bool capacitiveEnabled;

public:
  WakeManager() : lastTouchTime(0), lastActivityTime(0), wasTouched(false), baselineCap(0), capacitiveEnabled(false) {}

  void begin() {
    pinMode(TOUCH_WAKE_PIN, INPUT_PULLDOWN);
    pinMode(BOOT_BUTTON_PIN, INPUT_PULLUP);
    pinMode(STATUS_LED_PIN, OUTPUT);
    pinMode(AUX_LED_PIN, OUTPUT);

    digitalWrite(STATUS_LED_PIN, LOW);
    digitalWrite(AUX_LED_PIN, LOW);

    // Calibrate baseline capacitance on GPIO 33
    long sum = 0;
    for (int i = 0; i < 15; i++) {
      sum += touchRead(TOUCH_WAKE_PIN);
      delay(5);
    }
    baselineCap = (int)(sum / 15);
    capacitiveEnabled = (baselineCap >= 45);

    lastActivityTime = millis();
    Serial.printf("[Wake] Capacitive baseline: %d (Capacitive Active: %s), BOOT button: GPIO %d\n",
                  baselineCap, capacitiveEnabled ? "YES" : "NO (Use TTP223 or BOOT button)", BOOT_BUTTON_PIN);
  }

  // Returns true if a valid new wake event was triggered
  bool checkWakeTrigger() {
    uint32_t now = millis();

    // 1. Physical BOOT button on ESP32 (active LOW on GPIO 0)
    bool buttonBoot = (digitalRead(BOOT_BUTTON_PIN) == LOW);

    // 2. TTP223 digital touch sensor module (active HIGH)
    bool touchDigital = (digitalRead(TOUCH_WAKE_PIN) == HIGH);

    // 3. Capacitive wire touch (only if baseline is valid and value drops by > 50%)
    bool touchCap = false;
    int capVal = touchRead(TOUCH_WAKE_PIN);
    if (capacitiveEnabled && capVal > 0 && capVal < (baselineCap / 2)) {
      touchCap = true;
    }

    bool isTriggered = buttonBoot || touchDigital || touchCap;

    if (isTriggered && !wasTouched && (now - lastTouchTime > TOUCH_DEBOUNCE_MS)) {
      wasTouched = true;
      lastTouchTime = now;
      lastActivityTime = now;
      const char* triggerSource = buttonBoot ? "BOOT Button" : (touchDigital ? "TTP223 Digital Touch" : "Capacitive Wire Touch");
      Serial.printf("[Wake Trigger] Activated by: %s (CapVal=%d)\n", triggerSource, capVal);
      return true;
    } else if (!isTriggered) {
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
