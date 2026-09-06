/*
 * ==============================================================================
 *  ESP32 + PAM8403 (HW-104) Audio Player Test - Crystal Clear Voice
 *  Speech: "Hello Rishi, main hoon aap ki AI agent"
 * ==============================================================================
 *  ⚠️ NOTE FOR USER:
 *  This sketch is ONLY a standalone audio test for PAM8403 amplifier wiring.
 *  For the FULL SAHYOG AI Assistant (WiFi + MQTT + OLED + Touch + Web Sync),
 *  open and flash: esp32/SAHYOG_ESP32/SAHYOG_ESP32.ino !
 * ==============================================================================
 *
 *  WHY WAS THE VOICE "TEARING"?
 *  -------------------------------------------------------------
 *  1. PAM8403 has 16x (24dB) hardware gain! ESP32 DAC outputs 3.3V peak-to-peak.
 *     Feeding 3.3V into a 16x amplifier over-drives it by 10x, causing massive
 *     rail-clipping (the harsh "tearing" / buzzing sound).
 *  2. Upgraded sample rate from 8kHz to 16kHz for natural, smooth voice.
 *  3. Added software attenuation (default 25%) so PAM8403 gets clean ~0.8Vpp.
 *  4. Drift-free 64-bit timing eliminates stutter and timing jitter.
 *
 *  HARDWARE CONNECTIONS:
 *  -------------------------------------------------------------
 *  ESP32 Pin               PAM8403 Pin
 *  -------------------------------------------------------------
 *  GPIO 25 (DAC1)   -----> L or R (Audio Input)
 *  GND              -----> ⏚ (Audio GND & Power GND)
 *  5V (VIN)         -----> +5V / VCC
 *  
 *  Speaker:
 *  L+ and L-        -----> Speaker terminals (4Ω or 8Ω)
 *  (Do NOT connect speaker - to GND!)
 *  -------------------------------------------------------------
 *
 *  LIVE VOLUME CONTROLS (via Serial Monitor at 115200 baud):
 *  - Type '+' to increase volume
 *  - Type '-' to decrease volume
 *  - Type a number 1-100 to set volume directly (e.g. "30")
 *  - Press SPACE or BOOT button (GPIO 0) to replay immediately
 * ==============================================================================
 */

#include <Arduino.h>
#include "audio_data.h"

// ─── Pin Configuration ───────────────────────────────────────
#define DAC_PIN           25   // Built-in DAC Channel 1 (GPIO 25)
#define BUTTON_PIN        0    // BOOT button on ESP32 (active LOW)
#define LED_PIN           2    // Built-in LED

// ─── Volume Configuration ────────────────────────────────────
// 20% to 35% is the sweet spot for PAM8403 to prevent input clipping!
// Range: 1 to 100 (%)
int currentVolume = 28;

// ─── Soft-Ramp Helper ────────────────────────────────────────
// Smoothly ramps DAC to target value to avoid amplifier 'thump'
void dacRamp(uint8_t fromVal, uint8_t toVal, uint16_t stepDelayUs = 120) {
  if (fromVal < toVal) {
    for (int v = fromVal; v <= toVal; v++) {
      dacWrite(DAC_PIN, (uint8_t)v);
      delayMicroseconds(stepDelayUs);
    }
  } else {
    for (int v = fromVal; v >= toVal; v--) {
      dacWrite(DAC_PIN, (uint8_t)v);
      delayMicroseconds(stepDelayUs);
    }
  }
}

// ─── Audio Playback Function ─────────────────────────────────
void playAudio() {
  Serial.printf("\n🔊 [PLAYING] Volume: %d%% | Rate: %d Hz | Samples: %d\n", 
                currentVolume, AUDIO_SAMPLE_RATE, AUDIO_SAMPLE_COUNT);
  digitalWrite(LED_PIN, HIGH);

  // Read first sample and apply volume scaling
  uint8_t first_raw = pgm_read_byte(&(audio_data[0]));
  int16_t first_centered = (int16_t)first_raw - 128;
  uint8_t first_sample = 128 + ((first_centered * currentVolume) / 100);

  // Soft ramp-up from silence (128)
  dacRamp(128, first_sample, 80);

  // Precise 64-bit timing anchor to prevent cumulative drift
  uint64_t startTimeUs = esp_timer_get_time();

  for (uint32_t i = 0; i < AUDIO_SAMPLE_COUNT; i++) {
    // Read raw 8-bit sample from flash
    uint8_t raw = pgm_read_byte(&(audio_data[i]));

    // Scale audio around 128 (audio zero point)
    // This reduces the 3.3V swing down to a clean signal that doesn't clip PAM8403
    int16_t centered = (int16_t)raw - 128;
    int16_t scaled = 128 + ((centered * currentVolume) / 100);
    uint8_t output = (uint8_t)constrain(scaled, 0, 255);

    // Output to DAC pin
    dacWrite(DAC_PIN, output);

    // Calculate exact microsecond timestamp for the next sample
    // Formula: startTime + (sample_index * 1,000,000 / sample_rate)
    uint64_t targetTimeUs = startTimeUs + ((uint64_t)(i + 1) * 1000000ULL) / AUDIO_SAMPLE_RATE;

    while (esp_timer_get_time() < targetTimeUs) {
      // Precise microsecond wait
    }
  }

  // Soft ramp-down back to 128 (center DC)
  uint8_t last_raw = pgm_read_byte(&(audio_data[AUDIO_SAMPLE_COUNT - 1]));
  int16_t last_centered = (int16_t)last_raw - 128;
  uint8_t last_sample = 128 + ((last_centered * currentVolume) / 100);
  dacRamp(last_sample, 128, 80);

  digitalWrite(LED_PIN, LOW);
  Serial.println("✅ [FINISHED] Done playing.");
}

// ─── Setup ───────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(800);

  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // Set initial DAC voltage to silence (128 = ~1.65V DC midpoint)
  dacWrite(DAC_PIN, 128);

  Serial.println("\n========================================================");
  Serial.println("  ESP32 + PAM8403 Clean Audio Player");
  Serial.println("  \"Hello Rishi, main hoon aap ki AI agent\"");
  Serial.println("========================================================");
  Serial.printf("  Sample Rate  : %d Hz (High Quality 16kHz)\n", AUDIO_SAMPLE_RATE);
  Serial.printf("  Default Vol  : %d%% (Tuned to eliminate tearing)\n", currentVolume);
  Serial.println("  Output       : GPIO 25 (DAC1) -> PAM8403 Input");
  Serial.println("--------------------------------------------------------");
  Serial.println("  Commands in Serial Monitor:");
  Serial.println("    '+' : Increase Volume (+5%)");
  Serial.println("    '-' : Decrease Volume (-5%)");
  Serial.println("    '30': Set volume to 30% (type any number 1-100)");
  Serial.println("    ' ' : (Spacebar) or BOOT button to Replay");
  Serial.println("========================================================\n");

  delay(400);

  // Play immediately on boot!
  playAudio();
}

// ─── Main Loop ───────────────────────────────────────────────
void loop() {
  static uint32_t lastPlayTime = millis();
  const uint32_t AUTO_REPEAT_MS = 5000; // Repeat every 5 seconds

  // Handle Serial input for live volume tuning
  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');
    input.trim();

    if (input == "+") {
      currentVolume = constrain(currentVolume + 5, 5, 100);
      Serial.printf("🔊 Volume set to: %d%%\n", currentVolume);
      playAudio();
      lastPlayTime = millis();
    } else if (input == "-") {
      currentVolume = constrain(currentVolume - 5, 5, 100);
      Serial.printf("🔉 Volume set to: %d%%\n", currentVolume);
      playAudio();
      lastPlayTime = millis();
    } else if (input == " " || input.equalsIgnoreCase("play")) {
      playAudio();
      lastPlayTime = millis();
    } else if (input.toInt() > 0) {
      currentVolume = constrain(input.toInt(), 5, 100);
      Serial.printf("🔊 Volume set to: %d%%\n", currentVolume);
      playAudio();
      lastPlayTime = millis();
    }
  }

  // Check BOOT button (GPIO 0)
  if (digitalRead(BUTTON_PIN) == LOW) {
    delay(50);
    if (digitalRead(BUTTON_PIN) == LOW) {
      Serial.println("👉 [BOOT BUTTON] Playing audio...");
      playAudio();
      lastPlayTime = millis();
      while (digitalRead(BUTTON_PIN) == LOW) {
        delay(10);
      }
    }
  }

  // Note: Auto-repeat loop removed so it doesn't loop endlessly!
  // To replay, press BOOT button (GPIO 0) or press Spacebar in Serial Monitor.
}
