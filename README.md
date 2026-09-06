# 🌾 SAHYOG AI (सहयोग AI)
### Multilingual Cooperative Governance & Rural Legal Assistance Kiosk System
**Smart India Hackathon (SIH) Working Prototype**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_18-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js_Express-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![ESP32](https://img.shields.io/badge/ESP32-Arduino_C++-E7352C?style=flat&logo=espressif&logoColor=white)](https://www.espressif.com/)

---

## 🚨 Core Architectural Principle
**The primary user-facing experience is the AI CHATBOT (`/`) designed for rural citizens and cooperative members.**  
This is **NOT** a conventional government portal or administrative dashboard. All other interfaces (`/portal`, `/camera`, `/printer`, `/admin`) are supporting operational modules, data feeders, hardware simulators, and fleet management consoles.

---

## 🏛️ System Architecture

```text
               ┌─────────────────────────────────────────────────────────┐
               │         DEMO GOVERNMENT INFORMATION PORTAL              │
               │   (/portal) • 10+ Welfare Schemes • REST API Service    │
               └────────────────────────────┬────────────────────────────┘
                                            │ Sync Trigger (POST /api/portal/sync)
                                            ▼
               ┌─────────────────────────────────────────────────────────┐
               │             DYNAMIC DATA RETRIEVAL & RAG                │
               │  Anti-Hallucination Guard • Multilingual Citations      │
               └────────────────────────────┬────────────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
     ┌─────────────────────────────┐                 ┌─────────────────────────────┐
     │      SAHYOG AI CHATBOT      │                 │    CONTROL ADMIN CONSOLE    │
     │      Device: BOT-001        │                 │           (/admin)          │
     │   (/) • MR / HI / EN        │                 │  Fleet, Sources, Schemes,   │
     │   Grounded Scheme Guidance  │                 │  Conversations, Device Logs │
     └──────┬───────────────┬──────┘                 └─────────────────────────────┘
            │               │
     "Send to Chatbot"   "PRINT SOLUTION"
            │               │
            ▲               ▼
  ┌──────────────────┐    ┌──────────────────────────────────┐
  │  CAMERA SCANNER  │    │      58mm THERMAL POS PRINTER    │
  │     (/camera)    │    │             (/printer)           │
  │ Laptop Webcam    │    │  Physical 58mm Receipt Styling   │
  │ Live OCR Engine  │    │  Print • Download • WhatsApp API │
  └──────────────────┘    └──────────────────────────────────┘
```

---

## 🌟 Key Functional Modules

### 1. 🤖 Citizen AI Chatbot (`/`) — Bound to Device `BOT-001`
- **Device ID:** `BOT-001` (*Government Assistant 01*).
- **Target Audience:** Rural farmers, women self-help groups (SHGs), Primary Agricultural Credit Societies (PACS), and rural citizens.
- **Multilingual Support:** Instant toggle between Marathi (मराठी), Hindi (हिंदी), and English.
- **Robot Avatar:** Real-time animated SVG face mirroring kiosk states (`IDLE`, `WAKE`, `LISTENING`, `THINKING`, `SPEAKING`).
- **Grounded Responses:** Accurate answers cited directly from synced government schemes.
- **Instant Print Button:** Every scheme answer features a prominent **`🖨️ PRINT SOLUTION (BOT-001)`** action button that dispatches a structured print job and opens the 58mm thermal printer preview.

### 2. 🏛️ Demo Government Information Portal (`/portal`)
- **Disclaimer Banner:** Prominently states that the portal is a simulated government resource for prototype evaluation.
- **10+ Comprehensive Schemes:**
  1. *Farmer Equipment Assistance Scheme 2026* (50% subsidy up to ₹1.25 Lakh)
  2. *Solar Agriculture Pump Subsidy (KUSUM Component-B)* (up to 90% subsidy)
  3. *Cooperative Dairy Development & Chilling Center Grant* (25% capital grant)
  4. *PM Crop Insurance (Pradhan Mantri Fasal Bima Yojana)* (1.5%–2% premium cap)
  5. *Kisan Credit Card (KCC) Concessional Loan Scheme* (4% interest subvention)
  6. *Women Cooperative Self-Help Group Seed Capital Scheme* (₹10,000 grant + 0% interest loans)
  7. *PACS Computerization & Modernization Project* (100% grant for ERP & biometric kiosks)
  8. *Gramin Godown (Rural Warehouse) Infrastructure Scheme* (25%–33.33% capital subsidy)
  9. *Organic Farming Certification & Paramparagat Krishi Vikas* (₹50,000/ha subsidy)
  10. *Fisheries Infrastructure Development Fund (FIDF)* (concessional credit at 5%)
- **Dynamic Portal Sync:** One-click **"Sync with Portal"** (`POST /api/portal/sync`) parses schemes, chunks them into knowledge vectors, and updates the RAG retrieval engine in real-time.

### 3. 📷 Laptop Webcam Camera Simulator (`/camera?deviceId=BOT-001`)
- **Direct Hardware Access:** Uses browser `navigator.mediaDevices.getUserMedia({ video: true })` to capture real-time webcam frames.
- **Document Processing:** Capture snapshot to high-resolution `<canvas>` with OCR text extraction.
- **Preset Test Documents:** Preloaded with 7/12 land extract (*सातबारा उतारा*), Kisan Credit Card, Aadhaar Card, PACS Membership Certificate, and Farm Equipment application forms for offline demo reliability.
- **Pipeline to Chatbot:** Click **"Send to Chatbot (BOT-001)"** to immediately route the extracted text into `BOT-001`'s conversation feed for instant scheme eligibility analysis.

### 4. 🖨️ 58mm Thermal POS Printer Simulator (`/printer?deviceId=BOT-001`)
- **58mm Receipt Styling:** Monospaced receipt typography (`Courier New`), centered header, dashed tear boundaries, and authentic thermal layout.
- **Receipt Header:**
  ```text
  ================================
      GOVERNMENT ASSISTANT DEMO   
        SAHYOG AI KIOSK NODE      
  DEVICE: BOT-001  LOC: Nashik GP 
  DATE: 06/09/2026 15:35:10 IST   
  ================================
  ```
- **Dispatched from Chatbot:** Triggered directly via `PRINT SOLUTION` in `BOT-001` chat responses.
- **Export Actions:**
  - `window.print()` formatted for 58mm receipt paper.
  - Download raw `.txt` receipt file.
  - Direct WhatsApp dispatch via `https://wa.me/?text=...`.

### 5. 🎛️ Control Admin Console (`/admin`)
- **Fleet Management (`/admin/devices`):** Monitor, register, and dispatch reboot/diagnostic commands to `BOT-001` (*Nashik GP*), `BOT-002` (*Pune Cooperative Office*), and future nodes.
- **Government Sources (`/admin/sources`):** Track official government URLs, sync status, chunk counts, and trigger manual synchronization.
- **Schemes Catalog (`/admin/schemes`):** Real-time CRUD and search across all active welfare schemes.
- **Conversation Logs (`/admin/conversations`):** Audit citizen conversations across all kiosks tagged by device ID and language.
- **Device Activity Logs (`/admin/logs`):** Live telemetry feed capturing OCR scans, print jobs, voice queries, and device health.

---

## ⚡ ESP32 Edge Hardware Node Integration

For physical kiosk deployment, modular C++ firmware is provided in `esp32/` and tested for audio playback in `ESP32_HW104_Audio/`.

### Hardware Pinout Reference
| Module | ESP32 Pin | Protocol / Mode | Role |
|--------|-----------|-----------------|------|
| **PAM8403 Amplifier** | **GPIO 25** | DAC Output (8-bit, 16 kHz) | Anti-tearing audio output (28% attenuation) |
| **PAM8403 VCC / GND** | **5V / GND** | Power Supply | Power delivery for HW-104 audio amp |
| **INMP441 Microphone** | **SCK: GPIO 14, WS: GPIO 15, SD: GPIO 32** | I2S Digital Audio | 24-bit MEMS microphone for voice recognition |
| **INMP441 L/R** | **GND** | Hardware Config | Sets microphone to Left Channel |
| **SSD1306 OLED (128x64)** | **SDA: GPIO 21, SCL: GPIO 22** | I2C Protocol | Robot face animations & expression display |
| **TTP223 Touch Switch** | **GPIO 33** | Digital Input | Capacitive wake-up touch trigger |
| **BOOT Button** | **GPIO 0** | Digital Input (Pulled High) | Hardware test audio replay & diagnostic trigger |
| **Status LED** | **GPIO 2** | Digital Output | Active speech & network activity indicator |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18+ (tested on Node v20 & v24)
- **npm**: v9+
- Modern Web Browser (Chrome, Edge, Firefox) with camera permissions enabled.

### 1. Clone & Configure Environment
```bash
git clone <your-repository-url>
cd "Chat BOT"

# Copy environment template
cp .env.example .env
```

### 2. Start Backend Server
```bash
cd backend
npm install
npm run build
npm start
# Backend runs at http://localhost:3001
# Health check: http://localhost:3001/api/health
```

### 3. Start Frontend Dev Server
In a new terminal:
```bash
cd frontend
npm install
npm run dev
# Frontend runs at http://localhost:5173
```

---

## 🧪 SIH Demo Evaluation Flow

To showcase the complete end-to-end integration for evaluators:

1. **Step 1: Demo Portal Inspection & Sync**
   - Navigate to `http://localhost:5173/portal`.
   - Review the 10 welfare schemes (e.g. *Farmer Equipment Assistance Scheme 2026*).
   - Click **"Sync with Portal"** to pull the latest government data into the RAG vector store.
2. **Step 2: Check Admin Telemetry**
   - Navigate to `http://localhost:5173/admin`.
   - Verify `BOT-001` is marked **Online**, with RAG chunks indexed and sync status updated.
3. **Step 3: Citizen Query on Chatbot**
   - Navigate to `http://localhost:5173/` (bound to `BOT-001`).
   - Switch language to **मराठी** or **हिंदी** or **English**.
   - Click the prompt chip: *"How to get subsidy for farm equipment / tractor?"*
   - Observe the robot avatar state change and the response citing *Farmer Equipment Assistance Scheme 2026*.
4. **Step 4: Print Solution**
   - Click the prominent **`🖨️ PRINT SOLUTION (BOT-001)`** button at the bottom of the answer.
   - You will be taken to `http://localhost:5173/printer?deviceId=BOT-001`.
   - Preview the 58mm POS thermal receipt, print it via browser print, or export as `.txt`.
5. **Step 5: Document Scanning via Webcam**
   - Navigate to `http://localhost:5173/camera?deviceId=BOT-001`.
   - Allow camera permissions or select the **Farmer Equipment Application** sample preset.
   - Click **"Extract Text with OCR"**.
   - Click **"Send to Chatbot (BOT-001)"**.
   - Watch `BOT-001` automatically analyze the document and summarize eligibility!
6. **Step 6: Audit Logs in Admin**
   - Navigate to `http://localhost:5173/admin/logs` and `/admin/conversations` to verify that all actions are securely recorded under `BOT-001`.

---

## 📡 REST API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server health, uptime, and database status |
| `/api/portal/schemes` | GET | Retrieve all 10+ government welfare schemes |
| `/api/portal/schemes/:id` | GET | Retrieve detailed scheme by slug/ID |
| `/api/portal/sync` | POST | Trigger dynamic ingestion and RAG vector chunking |
| `/api/portal/status` | GET | Check last sync timestamp and active source count |
| `/api/chat` | POST | Trilingual citizen query with `deviceId` routing |
| `/api/devices` | GET / POST | Multi-device IoT fleet listing and registration |
| `/api/devices/logs` | GET / POST | Fetch and write hardware activity logs |
| `/api/devices/:id/command` | POST | Remote command dispatch (`reboot`, `calibrate_mic`, etc.) |
| `/api/conversations` | GET / POST | Retrieve and store conversation threads by device |
| `/api/camera/ocr` | POST | Process image snapshot and return structured OCR text |
| `/api/printer/jobs` | GET / POST | Queue and fetch print jobs for POS printer |
| `/api/printer/receipt` | POST | Generate formatted 58mm receipt text payload |
| `/api/printer/whatsapp` | POST | Generate WhatsApp direct share link for receipt |

---

## 🔒 Security & Best Practices
- **Zero Committed Secrets:** The repository strictly enforces `.gitignore` for `.env`, `.env.local`, `node_modules/`, and build artifacts.
- **Environment Template:** All configurable variables are documented in `.env.example`.
- **Anti-Hallucination Guard:** Responses in the RAG service strictly cite official sources from the database.
- **Data Privacy:** OCR processing runs locally or via controlled backend endpoints without external data leakage.

---

## 👥 Contributors & Acknowledgements
- **Team SAHYOG AI** — Developed for Smart India Hackathon (SIH).
- Built with modern open-source web and embedded technologies.
