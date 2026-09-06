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

    // 1. Check TTP223 digital module (HIGH when touched)
    bool touchDigital = (digitalRead(TOUCH_WAKE_PIN) == HIGH);

    // 2. Check ESP32 built-in capacitive touch sensor on GPIO 33 (drops below ~40 when finger touches)
    int capVal = touchRead(TOUCH_WAKE_PIN);
    bool touchCapacitive = (capVal > 0 && capVal < 40);

    // 3. Check physical BOOT button on ESP32 board (active LOW on GPIO 0)
    bool buttonBoot = (digitalRead(BOOT_BUTTON_PIN) == LOW);

    bool isTriggered = touchDigital || touchCapacitive || buttonBoot;

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
