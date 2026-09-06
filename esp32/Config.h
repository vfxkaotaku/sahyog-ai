/**
 * ==============================================================================
 * SAHYOG AI — ESP32 Edge Device Configuration (Config.h)
 * Multilingual Cooperative & Rural Legal Assistance Hardware Node
 * ==============================================================================
 */

#ifndef SAHYOG_CONFIG_H
#define SAHYOG_CONFIG_H

#include <Arduino.h>

// ─── Device Identification ───────────────────────────────────────────────────
#define DEVICE_ID               "SAHYOG-NODE-01"
#define DEVICE_NAME             "Sahyog Rural Kiosk Node"
#define FIRMWARE_VERSION        "1.2.0"

// ─── Network Configuration ───────────────────────────────────────────────────
#define WIFI_SSID               "YOUR_WIFI_SSID"
#define WIFI_PASSWORD           "YOUR_WIFI_PASSWORD"
#define MQTT_BROKER             "broker.hivemq.com"
#define MQTT_PORT               1883
#define MQTT_USER               ""
#define MQTT_PASS               ""

// ─── MQTT Topics ─────────────────────────────────────────────────────────────
#define MQTT_TOPIC_STATUS       "sahyog/" DEVICE_ID "/status"
#define MQTT_TOPIC_STATE        "sahyog/" DEVICE_ID "/state"
#define MQTT_TOPIC_COMMAND      "sahyog/" DEVICE_ID "/command"
#define MQTT_TOPIC_AUDIO_TX     "sahyog/" DEVICE_ID "/mic/audio"
#define MQTT_TOPIC_AUDIO_RX     "sahyog/" DEVICE_ID "/speaker/audio"

// ─── Hardware Pin Definitions ─────────────────────────────────────────────────
// I2C OLED (SSD1306 128x64)
#define OLED_SDA_PIN            21
#define OLED_SCL_PIN            22
#define OLED_I2C_ADDR           0x3C
#define OLED_WIDTH              128
#define OLED_HEIGHT             64

// Built-in DAC Audio Out (PAM8403 / HW-104 Amplifier)
#define AUDIO_DAC_PIN           25      // DAC1 (GPIO 25)
#define AUDIO_DEFAULT_VOLUME    28      // 28% prevents PAM8403 16x rail clipping
#define AUDIO_SAMPLE_RATE       16000   // 16 kHz High Quality

// INMP441 I2S Microphone
#define I2S_MIC_SCK_PIN         14      // Serial Clock (BCLK)
#define I2S_MIC_WS_PIN          15      // Word Select (LRCK)
#define I2S_MIC_SD_PIN          32      // Serial Data In (SD)
#define I2S_MIC_SAMPLE_RATE     16000   // 16 kHz Mono
#define I2S_MIC_PORT            I2S_NUM_0

// Wake-up Sensors & Buttons
#define TOUCH_WAKE_PIN          33      // TTP223 Capacitive Touch Sensor (Active HIGH)
#define BOOT_BUTTON_PIN         0       // Built-in BOOT Button (Active LOW)
#define STATUS_LED_PIN          2       // Onboard Blue LED
#define AUX_LED_PIN             4       // Auxiliary indicator LED

// ─── Timing & Thresholds ─────────────────────────────────────────────────────
#define TOUCH_DEBOUNCE_MS       200
#define IDLE_TIMEOUT_MS         15000   // Return to sleep after 15s inactivity
#define MIC_RECORD_MAX_MS       8000    // Max utterance record length

// ─── System State Machine States ─────────────────────────────────────────────
enum DeviceState {
  STATE_IDLE,
  STATE_WAKE,
  STATE_LISTENING,
  STATE_THINKING,
  STATE_SPEAKING,
  STATE_ERROR
};

inline const char* stateToString(DeviceState state) {
  switch (state) {
    case STATE_IDLE:       return "IDLE";
    case STATE_WAKE:       return "WAKE";
    case STATE_LISTENING:  return "LISTENING";
    case STATE_THINKING:   return "THINKING";
    case STATE_SPEAKING:   return "SPEAKING";
    case STATE_ERROR:      return "ERROR";
    default:               return "UNKNOWN";
  }
}

#endif // SAHYOG_CONFIG_H
