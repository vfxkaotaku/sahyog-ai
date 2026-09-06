/**
 * ==============================================================================
 * OLEDManager.h — Animated Robot Expressions & UI for 1.3" SH1106 or 0.96" SSD1306
 * ==============================================================================
 */

#ifndef SAHYOG_OLED_MANAGER_H
#define SAHYOG_OLED_MANAGER_H

#include <Wire.h>
#include <Adafruit_GFX.h>
#include "Config.h"

#if USE_SH1106_1_3_INCH
  #include <Adafruit_SH110X.h>
  #define COLOR_WHITE SH110X_WHITE
  #define COLOR_BLACK SH110X_BLACK
#else
  #include <Adafruit_SSD1306.h>
  #define COLOR_WHITE SSD1306_WHITE
  #define COLOR_BLACK SSD1306_BLACK
#endif

class OLEDManager {
private:
#if USE_SH1106_1_3_INCH
  Adafruit_SH1106G display;
#else
  Adafruit_SSD1306 display;
#endif
  bool isInitialized;
  uint32_t lastAnimTick;
  uint8_t animFrame;
  String answerTitle;
  String answerText;
  uint32_t answerReceivedTime;

public:
#if USE_SH1106_1_3_INCH
  OLEDManager() : display(OLED_WIDTH, OLED_HEIGHT, &Wire, -1), isInitialized(false), lastAnimTick(0), animFrame(0), answerReceivedTime(0) {}
#else
  OLEDManager() : display(OLED_WIDTH, OLED_HEIGHT, &Wire, -1), isInitialized(false), lastAnimTick(0), animFrame(0), answerReceivedTime(0) {}
#endif

  void setAnswerContent(const char* title, const char* text) {
    answerTitle = (title && strlen(title) > 0) ? String(title) : String("SAHYOG AI");
    answerText = (text && strlen(text) > 0) ? String(text) : String("");
    answerReceivedTime = millis();
  }

  void clearAnswerContent() {
    answerTitle = "";
    answerText = "";
  }

  bool begin() {
    Wire.begin(OLED_SDA_PIN, OLED_SCL_PIN);
    Wire.setClock(100000); // 100kHz safe clock speed eliminates breadboard wire noise
    delay(100);

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

#if USE_SH1106_1_3_INCH
    Serial.println("[OLED] Initializing 1.3 inch SH1106 controller...");
    if (!display.begin(foundAddr, true)) {
      Serial.printf("[OLED] SH1106 Init failed at 0x%02X, trying alternate address...\n", foundAddr);
      uint8_t altAddr = (foundAddr == 0x3C) ? 0x3D : 0x3C;
      if (!display.begin(altAddr, true)) {
        Serial.println("[OLED] FATAL: Could not initialize SH1106 display.");
        isInitialized = false;
        return false;
      }
      foundAddr = altAddr;
    }
#else
    Serial.println("[OLED] Initializing 0.96 inch SSD1306 controller...");
    if (!display.begin(SSD1306_SWITCHCAPVCC, foundAddr)) {
      Serial.printf("[OLED] SSD1306 Init failed at 0x%02X, trying alternate address...\n", foundAddr);
      uint8_t altAddr = (foundAddr == 0x3C) ? 0x3D : 0x3C;
      if (!display.begin(SSD1306_SWITCHCAPVCC, altAddr)) {
        Serial.println("[OLED] FATAL: Could not initialize SSD1306 display.");
        isInitialized = false;
        return false;
      }
      foundAddr = altAddr;
    }
#endif

    isInitialized = true;
    Serial.printf("[OLED] Display ACTIVE at 0x%02X (128x64)!\n\n", foundAddr);

    // Clear initial hardware GDDRAM noise
    display.clearDisplay();
    display.display();
    delay(50);

    display.setTextColor(COLOR_WHITE);
    showBootScreen();
    return true;
  }

  void showBootScreen() {
    if (!isInitialized) return;
    display.clearDisplay();
    display.drawRect(0, 0, 128, 64, COLOR_WHITE);

    display.setTextSize(2);
    display.setTextColor(COLOR_WHITE);
    display.setCursor(18, 12);
    display.print("SAHYOG");

    display.setTextSize(1);
    display.setCursor(24, 34);
    display.print("AI Rural Node");
    display.setCursor(18, 48);
    display.print("Initializing...");

    display.display();
    delay(1000);
  }

  void showWiFiConnecting(const char* ssid, int attempt) {
    if (!isInitialized) return;
    display.clearDisplay();
    display.drawRect(0, 0, 128, 64, COLOR_WHITE);

    display.setTextSize(1);
    display.setTextColor(COLOR_WHITE);
    display.setCursor(14, 8);
    display.print("CONNECTING WIFI");
    display.drawLine(0, 18, 128, 18, COLOR_WHITE);

    display.setCursor(8, 24);
    display.printf("SSID: %.14s", ssid);

    display.setCursor(8, 38);
    display.print("Status: Trying");
    for (int i = 0; i < (attempt % 5); i++) display.print(".");

    display.setCursor(8, 50);
    display.print("Please wait...");
    display.display();
  }

  void showConnectionSummary(const char* wifiSsid, const char* ipAddr, bool wifiOk, bool mqttOk) {
    if (!isInitialized) return;
    display.clearDisplay();
    display.drawRect(0, 0, 128, 64, COLOR_WHITE);

    display.setTextSize(1);
    display.setTextColor(COLOR_WHITE);
    display.setCursor(8, 6);
    display.print("SAHYOG AI : " DEVICE_ID);
    display.drawLine(0, 17, 128, 17, COLOR_WHITE);

    display.setCursor(8, 21);
    if (wifiOk) {
      display.printf("WiFi: CONNECTED\n");
      display.setCursor(8, 31);
      display.printf("IP: %s\n", ipAddr);
    } else {
      display.printf("WiFi: OFFLINE\n");
      display.setCursor(8, 31);
      display.print("Check Config.h SSID");
    }

    display.setCursor(8, 43);
    if (mqttOk) {
      display.print("Cloud: LIVE SYNC OK");
    } else {
      display.print("Cloud: OFFLINE MODE");
    }

    display.setCursor(8, 53);
    display.print("Touch/BOOT: Talk");

    display.display();
  }

  void updateAnimation(DeviceState state, uint32_t holdMs = 0) {
    if (!isInitialized) return;
    uint32_t now = millis();
    if (now - lastAnimTick < 80) return;
    lastAnimTick = now;
    animFrame++;

    display.clearDisplay();

    // If user is actively holding touch sensor, display holding progress bar
    if (holdMs >= 200) {
      drawHoldProgress(holdMs);
      return;
    }

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

  void drawHoldProgress(uint32_t holdMs) {
    display.setTextSize(1);
    display.setTextColor(COLOR_WHITE);
    display.setCursor(14, 6);
    display.print("HOLD TO TALK 3s");

    // Progress bar frame (x=14, y=22, w=100, h=16)
    display.drawRoundRect(14, 22, 100, 16, 4, COLOR_WHITE);

    // Progress bar fill (0 to 96 px)
    int fill = map(constrain((int)holdMs, 0, 3000), 0, 3000, 0, 96);
    if (fill > 0) {
      display.fillRoundRect(16, 24, fill, 12, 2, COLOR_WHITE);
    }

    // Time text
    float s = (float)holdMs / 1000.0f;
    display.setCursor(16, 48);
    display.printf("Holding: %.1fs / 3.0s", s);

    display.display();
  }

private:
  void drawIdleEyes() {
    // Normal calm eyes with periodic blink
    bool isBlink = (animFrame % 40 >= 38);
    if (isBlink) {
      display.fillRect(32, 26, 20, 4, COLOR_WHITE);
      display.fillRect(76, 26, 20, 4, COLOR_WHITE);
    } else {
      // Rounded robot eyes
      display.fillRoundRect(30, 18, 24, 20, 6, COLOR_WHITE);
      display.fillRoundRect(74, 18, 24, 20, 6, COLOR_WHITE);
      // Eye pupils (looking slightly around)
      int offset = (animFrame % 60 > 30) ? 2 : -2;
      display.fillCircle(42 + offset, 28, 4, COLOR_BLACK);
      display.fillCircle(86 + offset, 28, 4, COLOR_BLACK);
    }

    display.setTextSize(1);
    display.setTextColor(COLOR_WHITE);
    display.setCursor(4, 53);
    display.print("TAP:Wake | HOLD 3s:Mic");
  }

  void drawWakeFace() {
    // Excited, wide open happy eyes
    display.fillCircle(42, 26, 14, COLOR_WHITE);
    display.fillCircle(86, 26, 14, COLOR_WHITE);
    display.fillCircle(42, 26, 6, COLOR_BLACK);
    display.fillCircle(86, 26, 6, COLOR_BLACK);
    display.fillCircle(45, 23, 2, COLOR_WHITE); // highlight
    display.fillCircle(89, 23, 2, COLOR_WHITE);

    // Smile
    display.drawCircle(64, 40, 10, COLOR_WHITE);
    display.fillRect(52, 30, 24, 10, COLOR_BLACK);

    display.setTextSize(1);
    display.setTextColor(COLOR_WHITE);
    display.setCursor(16, 54);
    display.print("Namaste! Rishi :)");
  }

  void drawListeningWaveform() {
    // Listening sound bars
    display.setTextSize(1);
    display.setTextColor(COLOR_WHITE);
    display.setCursor(26, 4);
    display.print("[ LISTENING ]");

    int bars = 11;
    int spacing = 9;
    int startX = 18;
    for (int i = 0; i < bars; i++) {
      int height = 8 + (int)(18.0 * sin((animFrame * 0.4) + (i * 0.7)));
      if (height < 4) height = 4;
      display.fillRect(startX + (i * spacing), 38 - (height / 2), 5, height, COLOR_WHITE);
    }

    display.setCursor(16, 54);
    display.print("Speak now into mic");
  }

  void drawThinkingDots() {
    display.setTextSize(1);
    display.setTextColor(COLOR_WHITE);
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
      display.fillCircle(x, y, size, COLOR_WHITE);
    }

    display.setCursor(20, 54);
    display.print("Searching Schemes");
  }

  void drawSpeakingMouth() {
    uint32_t elapsed = (answerReceivedTime > 0) ? (millis() - answerReceivedTime) : 0;

    // If answer text is available and initial voice prompt has played (>2.2s):
    // Display the Answer Card on OLED screen so the user can read the answer!
    if (answerText.length() > 0 && elapsed > 2200) {
      display.drawRect(0, 0, 128, 64, COLOR_WHITE);
      display.setTextSize(1);
      display.setTextColor(COLOR_WHITE);

      // Header: Scheme / Question Title
      display.setCursor(4, 4);
      display.printf("[AI] %.16s", answerTitle.c_str());
      display.drawLine(0, 14, 128, 14, COLOR_WHITE);

      // Body: Wrapped answer text
      display.setCursor(4, 18);
      display.setTextWrap(true);
      String snippet = answerText.substring(0, 95);
      display.print(snippet);
      return;
    }

    // Talking robot face with pulsing mouth
    display.fillRoundRect(30, 14, 24, 16, 4, COLOR_WHITE);
    display.fillRoundRect(74, 14, 24, 16, 4, COLOR_WHITE);
    display.fillCircle(42, 22, 3, COLOR_BLACK);
    display.fillCircle(86, 22, 3, COLOR_BLACK);

    // Mouth animation (opening and closing)
    int mouthH = 4 + (int)(8.0 * fabs(sin(animFrame * 0.5)));
    display.fillRoundRect(50, 38, 28, mouthH, 3, COLOR_WHITE);

    display.setTextSize(1);
    display.setTextColor(COLOR_WHITE);
    if (answerTitle.length() > 0) {
      display.setCursor(6, 54);
      display.printf("Ans: %.15s", answerTitle.c_str());
    } else {
      display.setCursor(32, 54);
      display.print("Speaking...");
    }
  }

  void drawErrorFace() {
    // Cross eyes (X X)
    display.drawLine(32, 18, 48, 34, COLOR_WHITE);
    display.drawLine(48, 18, 32, 34, COLOR_WHITE);
    display.drawLine(80, 18, 96, 34, COLOR_WHITE);
    display.drawLine(96, 18, 80, 34, COLOR_WHITE);

    display.setTextSize(1);
    display.setTextColor(COLOR_WHITE);
    display.setCursor(24, 52);
    display.print("Network Error");
  }
};

#endif // SAHYOG_OLED_MANAGER_H
