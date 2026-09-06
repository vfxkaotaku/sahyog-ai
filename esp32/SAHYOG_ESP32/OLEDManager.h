/**
 * ==============================================================================
 * OLEDManager.h — Animated Robot Expressions & UI for SSD1306 (128x64)
 * ==============================================================================
 */

#ifndef SAHYOG_OLED_MANAGER_H
#define SAHYOG_OLED_MANAGER_H

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "Config.h"

class OLEDManager {
private:
  Adafruit_SSD1306 display;
  bool isInitialized;
  uint32_t lastAnimTick;
  uint8_t animFrame;

public:
  OLEDManager() : display(OLED_WIDTH, OLED_HEIGHT, &Wire, -1), isInitialized(false), lastAnimTick(0), animFrame(0) {}

  bool begin() {
    Wire.begin(OLED_SDA_PIN, OLED_SCL_PIN);
    delay(100); // Allow SSD1306 charge pump power to stabilize

    Serial.println("\n[OLED] Scanning I2C bus on SDA=" + String(OLED_SDA_PIN) + ", SCL=" + String(OLED_SCL_PIN) + "...");
    uint8_t foundAddr = 0;
    for (uint8_t addr = 1; addr < 127; addr++) {
      Wire.beginTransmission(addr);
      if (Wire.endTransmission() == 0) {
        Serial.printf("[I2C] Device detected at address 0x%02X\n", addr);
        if (addr == 0x3C || addr == 0x3D) {
          foundAddr = addr;
        }
      }
    }

    if (foundAddr == 0) {
      Serial.println("[OLED] WARNING: No I2C display detected on bus!");
      Serial.println("  --> Check wiring:");
      Serial.println("      OLED GND  --> ESP32 GND");
      Serial.println("      OLED VCC  --> ESP32 3.3V or 5V (VIN)");
      Serial.println("      OLED SCL  --> ESP32 GPIO 22");
      Serial.println("      OLED SDA  --> ESP32 GPIO 21");
      foundAddr = OLED_I2C_ADDR; // Default to 0x3C
    }

    // Attempt initialization on detected address
    if (!display.begin(SSD1306_SWITCHCAPVCC, foundAddr)) {
      Serial.printf("[OLED] Init failed at 0x%02X, trying alternate address...\n", foundAddr);
      uint8_t altAddr = (foundAddr == 0x3C) ? 0x3D : 0x3C;
      if (!display.begin(SSD1306_SWITCHCAPVCC, altAddr)) {
        Serial.println("[OLED] FATAL: Could not initialize SSD1306 display.");
        isInitialized = false;
        return false;
      }
      foundAddr = altAddr;
    }

    isInitialized = true;
    Serial.printf("[OLED] SSD1306 Display ACTIVE at 0x%02X (128x64)!\n\n", foundAddr);
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.dim(false); // Ensure maximum brightness
    showBootScreen();
    return true;
  }

  void showBootScreen() {
    if (!isInitialized) return;
    display.clearDisplay();
    display.setTextSize(2);
    display.setCursor(14, 10);
    display.print("SAHYOG");
    display.setTextSize(1);
    display.setCursor(20, 32);
    display.print("AI Rural Node");
    display.setCursor(12, 48);
    display.print("v" FIRMWARE_VERSION " Initializing...");
    display.display();
  }

  void updateAnimation(DeviceState state) {
    if (!isInitialized) return;
    uint32_t now = millis();
    if (now - lastAnimTick < 100) return;
    lastAnimTick = now;
    animFrame++;

    display.clearDisplay();

    switch (state) {
      case STATE_IDLE:
        drawIdleEyes();
        break;
      case STATE_WAKE:
        drawWakeFace();
        break;
      case STATE_LISTENING:
        drawListeningWaveform();
        break;
      case STATE_THINKING:
        drawThinkingDots();
        break;
      case STATE_SPEAKING:
        drawSpeakingMouth();
        break;
      case STATE_ERROR:
        drawErrorFace();
        break;
    }

    display.display();
  }

private:
  void drawIdleEyes() {
    // Normal calm eyes with periodic blink
    bool isBlink = (animFrame % 40 >= 38);
    if (isBlink) {
      display.fillRect(32, 28, 20, 4, SSD1306_WHITE);
      display.fillRect(76, 28, 20, 4, SSD1306_WHITE);
    } else {
      // Rounded robot eyes
      display.fillRoundRect(30, 20, 24, 20, 6, SSD1306_WHITE);
      display.fillRoundRect(74, 20, 24, 20, 6, SSD1306_WHITE);
      // Eye pupils (looking slightly around)
      int offset = (animFrame % 60 > 30) ? 2 : -2;
      display.fillCircle(42 + offset, 30, 4, SSD1306_BLACK);
      display.fillCircle(86 + offset, 30, 4, SSD1306_BLACK);
    }

    display.setTextSize(1);
    display.setCursor(18, 52);
    display.print("SAHYOG AI : IDLE");
  }

  void drawWakeFace() {
    // Excited, wide open happy eyes
    display.fillCircle(42, 28, 14, SSD1306_WHITE);
    display.fillCircle(86, 28, 14, SSD1306_WHITE);
    display.fillCircle(42, 28, 6, SSD1306_BLACK);
    display.fillCircle(86, 28, 6, SSD1306_BLACK);
    display.fillCircle(45, 25, 2, SSD1306_WHITE); // highlight
    display.fillCircle(89, 25, 2, SSD1306_WHITE);

    // Smile
    display.drawCircle(64, 42, 10, SSD1306_WHITE);
    display.fillRect(52, 32, 24, 10, SSD1306_BLACK);

    display.setTextSize(1);
    display.setCursor(30, 54);
    display.print("Namaste! :)");
  }

  void drawListeningWaveform() {
    // Listening sound bars
    display.setTextSize(1);
    display.setCursor(26, 4);
    display.print("[ LISTENING ]");

    int bars = 11;
    int spacing = 9;
    int startX = 18;
    for (int i = 0; i < bars; i++) {
      int height = 8 + (int)(18.0 * sin((animFrame * 0.4) + (i * 0.7)));
      if (height < 4) height = 4;
      display.fillRect(startX + (i * spacing), 38 - (height / 2), 5, height, SSD1306_WHITE);
    }

    display.setCursor(16, 54);
    display.print("Speak now into mic");
  }

  void drawThinkingDots() {
    display.setTextSize(1);
    display.setCursor(28, 8);
    display.print("Thinking...");

    // Rotating gears / dots
    int centerX = 64;
    int centerY = 34;
    int radius = 12;

    for (int i = 0; i < 8; i++) {
      float angle = (animFrame * 0.25) + (i * (PI / 4.0));
      int x = centerX + (int)(cos(angle) * radius);
      int y = centerY + (int)(sin(angle) * radius);
      int size = (i == (animFrame % 8)) ? 3 : 1;
      display.fillCircle(x, y, size, SSD1306_WHITE);
    }

    display.setCursor(20, 54);
    display.print("Searching Schemes");
  }

  void drawSpeakingMouth() {
    // Talking robot face with pulsing mouth
    display.fillRoundRect(30, 14, 24, 16, 4, SSD1306_WHITE);
    display.fillRoundRect(74, 14, 24, 16, 4, SSD1306_WHITE);
    display.fillCircle(42, 22, 3, SSD1306_BLACK);
    display.fillCircle(86, 22, 3, SSD1306_BLACK);

    // Mouth animation (opening and closing)
    int mouthH = 4 + (int)(8.0 * fabs(sin(animFrame * 0.5)));
    display.fillRoundRect(50, 38, 28, mouthH, 3, SSD1306_WHITE);

    display.setTextSize(1);
    display.setCursor(32, 54);
    display.print("Speaking...");
  }

  void drawErrorFace() {
    // Cross eyes (X X)
    display.drawLine(32, 18, 48, 34, SSD1306_WHITE);
    display.drawLine(48, 18, 32, 34, SSD1306_WHITE);
    display.drawLine(80, 18, 96, 34, SSD1306_WHITE);
    display.drawLine(96, 18, 80, 34, SSD1306_WHITE);

    display.setTextSize(1);
    display.setCursor(24, 52);
    display.print("Network Error");
  }
};

#endif // SAHYOG_OLED_MANAGER_H
