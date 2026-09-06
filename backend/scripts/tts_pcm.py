import sys
import os
from gtts import gTTS
import miniaudio

def main():
    if len(sys.argv) < 3:
        lang = "hi"
        text = "नमस्ते"
    else:
        lang = sys.argv[1]
        text = " ".join(sys.argv[2:])

    temp_mp3 = f"temp_tts_{os.getpid()}.mp3"
    try:
        tts = gTTS(text=text, lang=lang, slow=False)
        tts.save(temp_mp3)

        decoded = miniaudio.decode_file(temp_mp3, nchannels=1, sample_rate=11025)
        samples = decoded.samples

        max_amp = max(abs(s) for s in samples) if samples else 1
        scale = (32767.0 * 0.82) / max_amp if max_amp > 0 else 1.0

        raw = bytearray()
        for s in samples:
            scaled = s * scale
            val = int(128 + (scaled / 32768.0) * 127)
            raw.append(max(0, min(255, val)))

        sys.stdout.buffer.write(raw)
        sys.stdout.buffer.flush()
    finally:
        if os.path.exists(temp_mp3):
            try:
                os.remove(temp_mp3)
            except Exception:
                pass

if __name__ == "__main__":
    main()
