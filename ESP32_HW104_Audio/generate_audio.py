"""
generate_audio.py
=================
Generates speech for "Hello Rishi, main hoon aap ki AI agent"
and exports it as:
  1. audio_data.h  -> C header with PROGMEM byte array (16kHz High Quality)
  2. data/speech.wav -> Standard 16kHz WAV file

Uses gTTS for voice generation and miniaudio for clean resampling.
"""

import os
import sys
import wave

try:
    from gtts import gTTS
except ImportError:
    print("Installing gtts...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "gtts"])
    from gtts import gTTS

try:
    import miniaudio
except ImportError:
    print("Installing miniaudio...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "miniaudio"])
    import miniaudio

# ─── Configuration ───────────────────────────────────────────
TEXT        = "Hello Rishi, main hoon aap ki AI agent"
LANG        = "hi"          # Hindi
SAMPLE_RATE = 16000         # 16000 Hz wideband audio (crisp, natural voice)
TEMP_MP3    = "temp_tts.mp3"
HEADER_FILE = "audio_data.h"
WAV_DIR     = "data"
WAV_FILE    = os.path.join(WAV_DIR, "speech.wav")

def main():
    print("=" * 60)
    print("  ESP32 + PAM8403 High-Quality Audio Generator")
    print(f"  Phrase     : \"{TEXT}\"")
    print(f"  Language   : {LANG} (Hindi)")
    print(f"  Sample Rate: {SAMPLE_RATE} Hz (16 kHz)")
    print("=" * 60)

    # 1. Download TTS MP3
    print("\n[1/4] Generating speech via Google TTS...")
    tts = gTTS(text=TEXT, lang=LANG, slow=False)
    tts.save(TEMP_MP3)
    print(f"      Saved: {TEMP_MP3} ({os.path.getsize(TEMP_MP3)} bytes)")

    # 2. Decode MP3 to 16000 Hz Mono PCM with miniaudio
    print(f"\n[2/4] Decoding & resampling to {SAMPLE_RATE} Hz Mono...")
    decoded = miniaudio.decode_file(TEMP_MP3, nchannels=1, sample_rate=SAMPLE_RATE)
    samples = decoded.samples
    num_samples = len(samples)
    duration = num_samples / float(SAMPLE_RATE)
    print(f"      Decoded {num_samples} samples (~{duration:.2f} seconds)")

    # Normalize to 80% peak to prevent any digital ceiling clipping
    max_amp = max(abs(s) for s in samples) if samples else 1
    scale = (32767.0 * 0.80) / max_amp if max_amp > 0 else 1.0

    # Convert 16-bit signed (-32768..32767) to 8-bit unsigned (0..255)
    raw_8bit = bytearray()
    for s in samples:
        scaled = s * scale
        val = int(128 + (scaled / 32768.0) * 127)
        val = max(0, min(255, val))
        raw_8bit.append(val)

    # 3. Write audio_data.h
    print(f"\n[3/4] Writing '{HEADER_FILE}' (PROGMEM C header)...")
    with open(HEADER_FILE, "w", encoding="utf-8") as f:
        f.write("// ============================================================\n")
        f.write("//  Auto-generated 16kHz Audio Data Header for ESP32 DAC\n")
        f.write(f"//  Phrase: \"{TEXT}\"\n")
        f.write(f"//  Sample Rate: {SAMPLE_RATE} Hz, 8-bit unsigned mono PCM\n")
        f.write(f"//  Duration: {duration:.2f} seconds, Total bytes: {len(raw_8bit)}\n")
        f.write("// ============================================================\n\n")
        f.write("#pragma once\n")
        f.write("#include <Arduino.h>\n\n")
        f.write(f"#define AUDIO_SAMPLE_RATE    {SAMPLE_RATE}\n")
        f.write(f"#define AUDIO_SAMPLE_COUNT   {len(raw_8bit)}\n\n")
        f.write("const uint8_t audio_data[] PROGMEM = {\n")
        
        for i in range(0, len(raw_8bit), 16):
            chunk = raw_8bit[i:i+16]
            hex_values = ", ".join(f"0x{b:02X}" for b in chunk)
            if i + 16 < len(raw_8bit):
                f.write(f"    {hex_values},\n")
            else:
                f.write(f"    {hex_values}\n")
        f.write("};\n")
    
    header_size = os.path.getsize(HEADER_FILE)
    print(f"      Created '{HEADER_FILE}' ({header_size/1024:.1f} KB)")

    # 4. Save data/speech.wav
    print(f"\n[4/4] Writing standard WAV file '{WAV_FILE}'...")
    os.makedirs(WAV_DIR, exist_ok=True)
    with wave.open(WAV_FILE, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(1)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(raw_8bit)
    print(f"      Created '{WAV_FILE}' ({os.path.getsize(WAV_FILE)} bytes)")

    if os.path.exists(TEMP_MP3):
        os.remove(TEMP_MP3)

    print("\n" + "=" * 60)
    print("  SUCCESS! 16kHz Audio generated.")
    print("  Open ESP32_HW104_Audio.ino and click Upload!")
    print("=" * 60)

if __name__ == "__main__":
    main()
