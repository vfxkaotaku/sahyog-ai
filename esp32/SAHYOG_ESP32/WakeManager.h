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

public:
  WakeManager() : lastTouchTime(0), lastActivityTime(0), wasTouched(false) {}

  void begin() {
    pinMode(TOUCH_WAKE_PIN, INPUT);
    pinMode(BOOT_BUTTON_PIN, INPUT_PULLUP);
    pinMode(STATUS_LED_PIN, OUTPUT);
    pinMode(AUX_LED_PIN, OUTPUT);

    digitalWrite(STATUS_LED_PIN, LOW);
    digitalWrite(AUX_LED_PIN, LOW);

    lastActivityTime = millis();
    Serial.printf("[Wake] Capacitive touch pin: GPIO %d, BOOT button: GPIO %d\n",
                  TOUCH_WAKE_PIN, BOOT_BUTTON_PIN);
  }

  // Returns true if a valid new wake event was triggered
  bool checkWakeTrigger() {
    uint32_t now = millis();

    // Check capacitive touch sensor (TTP223 is typically HIGH when touched)
    bool touchState = (digitalRead(TOUCH_WAKE_PIN) == HIGH);

    // Also check BOOT button on ESP32 (active LOW)
    bool buttonState = (digitalRead(BOOT_BUTTON_PIN) == LOW);

    bool isTriggered = touchState || buttonState;

    if (isTriggered && !wasTouched && (now - lastTouchTime > TOUCH_DEBOUNCE_MS)) {
      wasTouched = true;
      lastTouchTime = now;
      lastActivityTime = now;
      Serial.printf("[Wake] Triggered by: %s\n", touchState ? "Capacitive Touch" : "BOOT Button");
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
