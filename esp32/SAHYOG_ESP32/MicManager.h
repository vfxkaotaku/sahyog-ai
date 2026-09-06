/**
 * ==============================================================================
 * MicManager.h — INMP441 I2S Digital MEMS Microphone Driver for ESP32
 * Samples 16kHz audio for speech recognition and acoustic analysis.
 * ==============================================================================
 */

#ifndef SAHYOG_MIC_MANAGER_H
#define SAHYOG_MIC_MANAGER_H

#include <Arduino.h>
#include <driver/i2s.h>
#include "Config.h"

class MicManager {
private:
  bool isInitialized;
  bool isRecording;

public:
  MicManager() : isInitialized(false), isRecording(false) {}

  bool begin() {
    i2s_config_t i2s_config = {
      .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
      .sample_rate = I2S_MIC_SAMPLE_RATE,
      .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
      .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
      .communication_format = i2s_comm_format_t(I2S_COMM_FORMAT_STAND_I2S),
      .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
      .dma_buf_count = 4,
      .dma_buf_len = 512,
      .use_apll = false,
      .tx_desc_auto_clear = false,
      .fixed_mclk = 0
    };

    i2s_pin_config_t pin_config = {
      .bck_io_num = I2S_MIC_SCK_PIN,
      .ws_io_num = I2S_MIC_WS_PIN,
      .data_out_num = I2S_PIN_NO_CHANGE,
      .data_in_num = I2S_MIC_SD_PIN
    };

    esp_err_t err = i2s_driver_install(I2S_MIC_PORT, &i2s_config, 0, NULL);
    if (err != ESP_OK) {
      Serial.printf("[Mic] Failed to install I2S driver: %d\n", err);
      return false;
    }

    err = i2s_set_pin(I2S_MIC_PORT, &pin_config);
    if (err != ESP_OK) {
      Serial.printf("[Mic] Failed to set I2S pins: %d\n", err);
      return false;
    }

    isInitialized = true;
    Serial.printf("[Mic] INMP441 initialized on SCK:%d, WS:%d, SD:%d at %d Hz\n",
                  I2S_MIC_SCK_PIN, I2S_MIC_WS_PIN, I2S_MIC_SD_PIN, I2S_MIC_SAMPLE_RATE);
    return true;
  }

  void startRecording() {
    if (!isInitialized) return;
    i2s_zero_dma_buffer(I2S_MIC_PORT);
    isRecording = true;
    Serial.println("[Mic] Recording started...");
  }

  void stopRecording() {
    isRecording = false;
    Serial.println("[Mic] Recording stopped.");
  }

  bool getIsRecording() const {
    return isRecording;
  }

  // Read a chunk of 32-bit samples from I2S and downscale to 16-bit PCM
  size_t readAudioChunk(int16_t* outputBuffer, size_t maxSamples) {
    if (!isInitialized || !outputBuffer || maxSamples == 0) return 0;

    int32_t rawSamples[128];
    size_t samplesToRead = min(maxSamples, (size_t)128);
    size_t bytesRead = 0;

    esp_err_t result = i2s_read(
      I2S_MIC_PORT,
      rawSamples,
      samplesToRead * sizeof(int32_t),
      &bytesRead,
      pdMS_TO_TICKS(100)
    );

    if (result != ESP_OK || bytesRead == 0) return 0;

    size_t count = bytesRead / sizeof(int32_t);
    for (size_t i = 0; i < count; i++) {
      // INMP441 puts 24-bit data in high bits; shift down to 16-bit
      outputBuffer[i] = (int16_t)(rawSamples[i] >> 14);
    }

    return count;
  }

  // Simple RMS energy calculation for voice detection
  float calculateRMS(const int16_t* buffer, size_t count) {
    if (!buffer || count == 0) return 0.0f;
    int64_t sumSq = 0;
    for (size_t i = 0; i < count; i++) {
      int32_t s = buffer[i];
      sumSq += (s * s);
    }
    return sqrt((float)sumSq / (float)count);
  }
};

#endif // SAHYOG_MIC_MANAGER_H
