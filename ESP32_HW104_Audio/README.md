# 🔊 ESP32 + HW-104 (PAM8403) Speaker Test

Plays Hindi speech: **"Hello Rishi, main hoon aap ki AI agent"** through your HW-104 amplifier and speaker.

---

## 📌 Features

- **Zero Libraries Needed:** Uses ESP32's internal 8-bit DAC on **GPIO 25**.
- **No File Upload Tools Required:** Audio is embedded directly into the sketch (`audio_data.h`) via Flash `PROGMEM`.
- **Anti-Pop Filter:** Features soft DAC ramp-up and ramp-down to prevent irritating loud "clicks/pops" when the amplifier starts/stops.
- **Repeat & Manual Play:** Plays automatically on boot, repeats every 4 seconds, or press the **BOOT button (GPIO 0)** on your ESP32 to replay on demand.
- **Works on All ESP32 Core Versions:** Fully compatible with ESP32 Arduino Core 1.x, 2.x, and the latest 3.x!

---

## 🔌 Circuit Connection (Wiring)

```
       ESP32                        HW-104 (PAM8403)
 ┌────────────────┐              ┌────────────────┐
 │                │              │                │
 │   GPIO 25 (DAC)├─────────────►│ L_IN / R_IN / IN+ (Audio)
 │                │              │                │
 │       GND      ├─────────────►│ GND (Audio & Power GND)
 │                │              │                │
 │     5V (VIN)   ├─────────────►│ 5V / VCC       │
 └────────────────┘              │                │
                                 │   OUT+   OUT-  │
                                 └───┬───────┬────┘
                                     │       │
                                     ▼       ▼
                                ┌─────────────────┐
                                │     SPEAKER     │
                                │  (4Ω/8Ω, 2W-3W) │
                                └─────────────────┘
```

### Pin Table:
| ESP32 Pin | HW-104 Pin | Description |
|---|---|---|
| **GPIO 25** (DAC1) | **L_IN** or **R_IN** (or **IN+**) | Audio signal from ESP32 DAC |
| **GND** | **GND** | Common Ground |
| **5V** (VIN) | **5V / VCC** | Power supply (5V gives max loudness, 3.3V also works) |
| — | **OUT+** & **OUT-** | Connected to speaker terminals |

> 💡 **Audio Quality Tip:** If the sound has slight noise or is too loud, connect a **100Ω to 470Ω resistor** in series between **GPIO 25** and the HW-104 input pin, or lower the potentiometer on the HW-104 board.

---

## 🚀 How to Flash & Test

1. Connect your **ESP32** to your PC with a USB cable.
2. Open **Arduino IDE**.
3. Go to **File → Open...** and open:
   ```
   d:\VKO Studios\Chat BOT\ESP32_HW104_Audio\ESP32_HW104_Audio.ino
   ```
4. In Arduino IDE:
   - Board: **ESP32 Dev Module** (or your specific ESP32 board)
   - Port: Select your ESP32 **COM Port**
5. Click **Upload** (or press `Ctrl + U`).
6. Open **Serial Monitor** at **115200 baud**.
7. You will hear: *"Hello Rishi, main hoon aap ki AI agent"* immediately!

---

## 🎙️ How to Change the Voice / Message in Future

If you want to change what the speaker says:
1. Open `generate_audio.py`.
2. Edit the `TEXT` line:
   ```python
   TEXT = "Your custom text here"
   ```
3. Run:
   ```bash
   python generate_audio.py
   ```
4. Re-upload the sketch to the ESP32!
