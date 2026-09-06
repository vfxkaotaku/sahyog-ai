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
#include <WiFi.h>
#include <HTTPClient.h>
#include "Config.h"
#include "audio_data.h"

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

  // Play raw 8-bit unsigned PCM buffer from Flash (PROGMEM) at sampleRate
  void playBuffer(const uint8_t* buffer, uint32_t length, uint16_t sampleRate = 16000) {
    if (!buffer || length == 0) return;

    // Read first sample and soft ramp
    uint8_t first_raw = pgm_read_byte(&(buffer[0]));
    int16_t first_centered = (int16_t)first_raw - 128;
    uint8_t first_sample = 128 + ((first_centered * volume) / 100);
    dacRamp(128, first_sample, 80);

    uint64_t startTimeUs = esp_timer_get_time();

    for (uint32_t i = 0; i < length; i++) {
      uint8_t raw = pgm_read_byte(&(buffer[i]));
      int16_t centered = (int16_t)raw - 128;
      int16_t scaled = 128 + ((centered * volume) / 100);
      uint8_t output = (uint8_t)constrain(scaled, 0, 255);

      dacWrite(AUDIO_DAC_PIN, output);

      uint64_t targetTimeUs = startTimeUs + ((uint64_t)(i + 1) * 1000000ULL) / sampleRate;
      while (esp_timer_get_time() < targetTimeUs) {
        // Timing loop
      }
    }

    // Soft ramp back to center silence
    uint8_t last_raw = pgm_read_byte(&(buffer[length - 1]));
    int16_t last_centered = (int16_t)last_raw - 128;
    uint8_t last_sample = 128 + ((last_centered * volume) / 100);
    dacRamp(last_sample, 128, 80);
    dacWrite(AUDIO_DAC_PIN, 128);
  }

  // Play natural recorded wake speech: "Hello Rishi, main hoon aap ki AI agent"
  void playWakeSpeech() {
    Serial.printf("[Audio] Playing Wake Greeting (\"Hello Rishi, main hoon aap ki AI agent\")... Samples: %d\n", WAKE_SAMPLE_COUNT);
    playBuffer(audio_wake, WAKE_SAMPLE_COUNT, AUDIO_SAMPLE_RATE);
  }

  // Play pleasant 4-tone answer arrival chime
  void playAnswerChime() {
    playTone(523, 70);   // C5
    playTone(659, 70);   // E5
    playTone(784, 90);   // G5
    playTone(1046, 140); // C6
  }

  // Play natural recorded answer speech: "Aapka uttar taiyar hai"
  void playAnswerSpeech() {
    playClip("ANSWER");
  }

  // Play offline voice fallback directly out of the ESP32 PAM8403 speaker
  void playClip(const String& clipId) {
    String c = clipId;
    c.toUpperCase();

    if (c == "WAKE") {
      playWakeSpeech();
    } else {
      // Answer fallback: "आपका उत्तर तैयार है"
      Serial.printf("[Audio] ESP32 Speaker: Offline Answer ('Aapka uttar taiyar hai') Samples: %d\n", ANSWER_SAMPLE_COUNT);
      playTone(659, 70);
      playTone(880, 100);
      delay(40);
      playBuffer(audio_answer, ANSWER_SAMPLE_COUNT, AUDIO_SAMPLE_RATE);
    }
  }

  // Stream live dynamic TTS PCM audio over WiFi directly to DAC GPIO 25!
  bool streamHttpAudio(const char* url) {
    if (WiFi.status() != WL_CONNECTED || !url || strlen(url) < 7) {
      return false;
    }

    Serial.printf("[Audio Stream] Fetching dynamic AI speech from: %s\n", url);
    HTTPClient http;
    http.begin(url);
    http.setTimeout(8000);
    int httpCode = http.GET();

    if (httpCode != HTTP_CODE_OK) {
      Serial.printf("[Audio Stream] HTTP GET failed (code %d), falling back to offline voice\n", httpCode);
      http.end();
      return false;
    }

    WiFiClient* stream = http.getStreamPtr();
    if (!stream) {
      http.end();
      return false;
    }

    uint8_t chunk[256];
    dacRamp(128, 128, 40);
    uint64_t nextSampleUs = esp_timer_get_time();
    const uint32_t sampleIntervalUs = 1000000 / AUDIO_SAMPLE_RATE; // 11025 Hz (~90us)

    while (http.connected() && (stream->available() > 0 || stream->connected())) {
      int len = stream->readBytes(chunk, sizeof(chunk));
      if (len <= 0) break;

      for (int i = 0; i < len; i++) {
        uint8_t raw = chunk[i];
        int16_t centered = (int16_t)raw - 128;
        int16_t scaled = 128 + ((centered * volume) / 100);
        uint8_t out = (uint8_t)constrain(scaled, 0, 255);

        while (esp_timer_get_time() < nextSampleUs) {}
        dacWrite(AUDIO_DAC_PIN, out);
        nextSampleUs += sampleIntervalUs;
      }
    }

    dacRamp(128, 128, 40);
    dacWrite(AUDIO_DAC_PIN, 128);
    http.end();
    Serial.println("[Audio Stream] Dynamic AI speech finished playing!");
    return true;
  }

  // Backward-compatible alias
  void playVoiceSpeech() {
    playWakeSpeech();
  }
};

#endif // SAHYOG_AUDIO_MANAGER_H
