/**
 * ==============================================================================
 * AudioManager.h — High-Fidelity DAC Audio Output for PAM8403 Amplifier
 * Incorporates 16kHz playback, software attenuation (28%), anti-pop ramping,
 * and synthesized acoustic cues (chimes, beeps, waveforms).
 * ==============================================================================
 */

#ifndef SAHYOG_AUDIO_MANAGER_H
#define SAHYOG_AUDIO_MANAGER_H

#include <Arduino.h>
#include "Config.h"

class AudioManager {
private:
  int volume; // Percentage (1 to 100)

public:
  AudioManager() : volume(AUDIO_DEFAULT_VOLUME) {}

  void begin() {
    // Set DAC to audio zero midpoint (128 = 1.65V DC)
    dacWrite(AUDIO_DAC_PIN, 128);
    Serial.printf("[Audio] DAC Initialized on GPIO %d, Default Volume: %d%%\n", AUDIO_DAC_PIN, volume);
  }

  void setVolume(int vol) {
    volume = constrain(vol, 5, 100);
    Serial.printf("[Audio] Volume updated to %d%%\n", volume);
  }

  int getVolume() const {
    return volume;
  }

  // Smooth ramp to prevent amplifier pop/thump
  void dacRamp(uint8_t fromVal, uint8_t toVal, uint16_t stepDelayUs = 80) {
    if (fromVal < toVal) {
      for (int v = fromVal; v <= toVal; v++) {
        dacWrite(AUDIO_DAC_PIN, (uint8_t)v);
        delayMicroseconds(stepDelayUs);
      }
    } else {
      for (int v = fromVal; v >= toVal; v--) {
        dacWrite(AUDIO_DAC_PIN, (uint8_t)v);
        delayMicroseconds(stepDelayUs);
      }
    }
  }

  // Synthesize clean audio tone (sine wave) directly to DAC
  void playTone(uint16_t freqHz, uint16_t durationMs) {
    if (freqHz == 0 || durationMs == 0) return;
    
    uint32_t totalSamples = ((uint32_t)durationMs * AUDIO_SAMPLE_RATE) / 1000;
    float periodSamples = (float)AUDIO_SAMPLE_RATE / (float)freqHz;
    
    dacRamp(128, 128, 40);
    uint64_t startTimeUs = esp_timer_get_time();

    for (uint32_t i = 0; i < totalSamples; i++) {
      float phase = (2.0f * PI * (float)i) / periodSamples;
      float sinVal = sin(phase); // -1.0 to +1.0
      
      // Scale by volume
      int16_t scaled = (int16_t)(sinVal * 120.0f * ((float)volume / 100.0f));
      uint8_t sample = (uint8_t)constrain(128 + scaled, 0, 255);
      
      dacWrite(AUDIO_DAC_PIN, sample);
      
      uint64_t targetTimeUs = startTimeUs + ((uint64_t)(i + 1) * 1000000ULL) / AUDIO_SAMPLE_RATE;
      while (esp_timer_get_time() < targetTimeUs) {
        // Precise timer wait
      }
    }

    dacRamp(128, 128, 40);
    dacWrite(AUDIO_DAC_PIN, 128);
  }

  // Play pleasant ascending 2-tone chime upon capacitive touch wake-up
  void playWakeChime() {
    Serial.println("[Audio] Playing Wake Chime...");
    playTone(659, 90);  // E5
    delay(20);
    playTone(880, 160); // A5
  }

  // Play pleasant listening start prompt
  void playListeningCue() {
    playTone(523, 70);  // C5
    playTone(659, 100); // E5
  }

  // Play thinking / processing prompt
  void playThinkingCue() {
    playTone(440, 60);  // A4
  }

  // Play error prompt
  void playErrorChime() {
    playTone(330, 150); // E4
    delay(30);
    playTone(261, 250); // C4
  }

  // Play raw 8-bit unsigned PCM buffer at 16kHz
  void playBuffer(const uint8_t* buffer, uint32_t length, uint16_t sampleRate = 16000) {
    if (!buffer || length == 0) return;

    // Read first sample and soft ramp
    int16_t first_centered = (int16_t)buffer[0] - 128;
    uint8_t first_sample = 128 + ((first_centered * volume) / 100);
    dacRamp(128, first_sample, 80);

    uint64_t startTimeUs = esp_timer_get_time();

    for (uint32_t i = 0; i < length; i++) {
      int16_t centered = (int16_t)buffer[i] - 128;
      int16_t scaled = 128 + ((centered * volume) / 100);
      uint8_t output = (uint8_t)constrain(scaled, 0, 255);

      dacWrite(AUDIO_DAC_PIN, output);

      uint64_t targetTimeUs = startTimeUs + ((uint64_t)(i + 1) * 1000000ULL) / sampleRate;
      while (esp_timer_get_time() < targetTimeUs) {
        // Timing loop
      }
    }

    // Soft ramp back to center silence
    int16_t last_centered = (int16_t)buffer[length - 1] - 128;
    uint8_t last_sample = 128 + ((last_centered * volume) / 100);
    dacRamp(last_sample, 128, 80);
    dacWrite(AUDIO_DAC_PIN, 128);
  }
};

#endif // SAHYOG_AUDIO_MANAGER_H
