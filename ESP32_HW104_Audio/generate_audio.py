"""
generate_audio.py
=================
Generates dual speech phrases for SAHYOG AI ESP32:
  1. Wake Phrase   : "Hello Rishi, main hoon aap ki AI agent"
  2. Answer Phrase : "आपका उत्तर तैयार है" (Aapka uttar taiyar hai)

Exports:
  - audio_data.h  -> C header with PROGMEM byte arrays (16kHz High Quality)
  - data/wake.wav, data/answer.wav -> Standard 16kHz WAV files

Uses gTTS for voice generation and miniaudio for clean 16kHz resampling.
"""

import os
import sys
import wave
import shutil

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

SAMPLE_RATE = 16000
WAKE_TEXT = "Hello Rishi, main hoon aap ki AI agent"
ANSWER_TEXT = "आपका उत्तर तैयार है"
WAV_DIR = "data"

def text_to_pcm(text, lang="hi", temp_name="temp.mp3"):
    print(f"  Generating TTS for language: {lang}...")
    tts = gTTS(text=text, lang=lang, slow=False)
    tts.save(temp_name)

    decoded = miniaudio.decode_file(temp_name, nchannels=1, sample_rate=SAMPLE_RATE)
    samples = decoded.samples
    if os.path.exists(temp_name):
        os.remove(temp_name)

    # Normalize to 80% peak amplitude to avoid clipping
    max_amp = max(abs(s) for s in samples) if samples else 1
    scale = (32767.0 * 0.80) / max_amp if max_amp > 0 else 1.0

    # Convert 16-bit signed (-32768..32767) to 8-bit unsigned (0..255)
    raw_8bit = bytearray()
    for s in samples:
        scaled = s * scale
        val = int(128 + (scaled / 32768.0) * 127)
        val = max(0, min(255, val))
        raw_8bit.append(val)

    duration = len(raw_8bit) / float(SAMPLE_RATE)
    print(f"  -> Generated {len(raw_8bit)} samples ({duration:.2f}s)")
    return raw_8bit

def format_hex_array(data, name):
    lines = [f"const uint8_t {name}[] PROGMEM = {{\n"]
    for i in range(0, len(data), 16):
        chunk = data[i:i+16]
        hex_vals = ", ".join(f"0x{b:02X}" for b in chunk)
        if i + 16 < len(data):
            lines.append(f"    {hex_vals},\n")
        else:
            lines.append(f"    {hex_vals}\n")
    lines.append("};\n\n")
    return "".join(lines)

def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    print("=" * 60)
    print("  SAHYOG AI - ESP32 Dual Audio Generator (16 kHz)")
    print(f"  1. Wake Phrase   : {WAKE_TEXT}")
    print("  2. Answer Phrase : Aapka uttar taiyar hai (Hindi)")
    print("=" * 60)

    wake_pcm = text_to_pcm(WAKE_TEXT, "hi", "temp_wake.mp3")
    answer_pcm = text_to_pcm(ANSWER_TEXT, "hi", "temp_answer.mp3")

    header_content = []
    header_content.append("// ============================================================\n")
    header_content.append("//  Auto-generated 16kHz Audio Data Header for SAHYOG AI ESP32\n")
    header_content.append(f"//  Wake Phrase   : \"{WAKE_TEXT}\"\n")
    header_content.append(f"//  Answer Phrase : \"{ANSWER_TEXT}\"\n")
    header_content.append(f"//  Sample Rate   : {SAMPLE_RATE} Hz, 8-bit unsigned mono PCM\n")
    header_content.append("// ============================================================\n\n")
    header_content.append("#pragma once\n")
    header_content.append("#include <Arduino.h>\n\n")
    header_content.append(f"#define AUDIO_SAMPLE_RATE      {SAMPLE_RATE}\n")
    header_content.append(f"#define WAKE_SAMPLE_COUNT      {len(wake_pcm)}\n")
    header_content.append(f"#define ANSWER_SAMPLE_COUNT    {len(answer_pcm)}\n\n")
    header_content.append(f"// Legacy alias compatibility\n")
    header_content.append(f"#define AUDIO_SAMPLE_COUNT     WAKE_SAMPLE_COUNT\n\n")

    header_content.append(format_hex_array(wake_pcm, "audio_wake"))
    header_content.append(format_hex_array(answer_pcm, "audio_answer"))
    header_content.append("// Legacy pointer alias\n")
    header_content.append("#define audio_data audio_wake\n")

    full_header = "".join(header_content)

    targets = [
        os.path.join(".", "audio_data.h"),
        os.path.join("..", "esp32", "SAHYOG_ESP32", "audio_data.h"),
        os.path.join("..", "esp32", "audio_data.h")
    ]

    for t in targets:
        os.makedirs(os.path.dirname(os.path.abspath(t)), exist_ok=True)
        with open(t, "w", encoding="utf-8") as f:
            f.write(full_header)
        sz = os.path.getsize(t) / 1024.0
        print(f"  [SAVED] {t} ({sz:.1f} KB)")

    # Save WAV files
    os.makedirs(WAKE_TEXT and WAV_DIR, exist_ok=True)
    with wave.open(os.path.join(WAV_DIR, "wake.wav"), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(1)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(wake_pcm)

    with wave.open(os.path.join(WAV_DIR, "answer.wav"), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(1)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(answer_pcm)

    print("\n" + "=" * 60)
    print("  SUCCESS! Dual audio generated and synchronized to all targets.")
    print("=" * 60)

if __name__ == "__main__":
    main()
