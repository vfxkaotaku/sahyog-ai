"""
generate_audio.py
=================
Generates core offline fallback speech for SAHYOG AI ESP32:
  1. Wake Phrase   : "Hello Rishi, main hoon aap ki AI agent"
  2. Answer Phrase : "आपका उत्तर तैयार है" (Aapka uttar taiyar hai)

Dynamic real-time speech (in Marathi, Hindi, and English) is streamed
live from the backend at 11025 Hz directly into the ESP32 DAC!
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

SAMPLE_RATE = 11025
WAV_DIR = "data"

CLIPS = [
    ("audio_wake",   "WAKE",   "Hello Rishi, main hoon aap ki AI agent", "hi"),
    ("audio_answer", "ANSWER", "आपका उत्तर तैयार है",                     "hi"),
]

def text_to_pcm(text, lang="hi", temp_name="temp.mp3"):
    tts = gTTS(text=text, lang=lang, slow=False)
    tts.save(temp_name)

    decoded = miniaudio.decode_file(temp_name, nchannels=1, sample_rate=SAMPLE_RATE)
    samples = decoded.samples
    if os.path.exists(temp_name):
        os.remove(temp_name)

    max_amp = max(abs(s) for s in samples) if samples else 1
    scale = (32767.0 * 0.82) / max_amp if max_amp > 0 else 1.0

    raw_8bit = bytearray()
    for s in samples:
        scaled = s * scale
        val = int(128 + (scaled / 32768.0) * 127)
        val = max(0, min(255, val))
        raw_8bit.append(val)

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

    print("=" * 65)
    print("  SAHYOG AI — ESP32 Dual Speech Generator (11025 Hz)")
    print("=" * 65)

    generated = []
    total_samples = 0

    for var_name, key, text, lang in CLIPS:
        print(f"  Generating [{key:7}]: {text}")
        pcm = text_to_pcm(text, lang, f"temp_{key}.mp3")
        dur = len(pcm) / float(SAMPLE_RATE)
        print(f"    -> {len(pcm)} samples ({dur:.2f}s)")
        generated.append((var_name, key, pcm, len(pcm), text))
        total_samples += len(pcm)

    header_content = []
    header_content.append("// ============================================================\n")
    header_content.append("//  Auto-generated 11025 Hz Audio Data Header for SAHYOG AI ESP32\n")
    header_content.append("//  Wake Phrase   : Hello Rishi, main hoon aap ki AI agent\n")
    header_content.append("//  Answer Phrase : Aapka uttar taiyar hai\n")
    header_content.append("//  Total Flash Size: {:.1f} KB\n".format(total_samples / 1024.0))
    header_content.append("// ============================================================\n\n")
    header_content.append("#pragma once\n")
    header_content.append("#include <Arduino.h>\n\n")
    header_content.append(f"#define AUDIO_SAMPLE_RATE      {SAMPLE_RATE}\n\n")

    for var_name, key, pcm, count, text in generated:
        header_content.append(f"// [{key}] \"{text}\"\n")
        header_content.append(f"#define {key}_SAMPLE_COUNT     {count}\n")
    header_content.append("\n")

    header_content.append("// Legacy aliases\n")
    header_content.append("#define AUDIO_SAMPLE_COUNT     WAKE_SAMPLE_COUNT\n\n")

    for var_name, key, pcm, count, text in generated:
        header_content.append(f"// Phrase: {text}\n")
        header_content.append(format_hex_array(pcm, var_name))

    header_content.append("// Backward-compatible pointer alias\n")
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

    # Save individual WAV files
    os.makedirs(WAV_DIR, exist_ok=True)
    for var_name, key, pcm, count, text in generated:
        wav_path = os.path.join(WAV_DIR, f"{key.lower()}.wav")
        with wave.open(wav_path, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(1)
            wf.setframerate(SAMPLE_RATE)
            wf.writeframes(pcm)

    print("\n" + "=" * 65)
    print("  SUCCESS! Flash footprint optimized to {:.1f} KB".format(total_samples/1024.0))
    print("=" * 65)

if __name__ == "__main__":
    main()
