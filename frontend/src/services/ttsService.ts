/**
 * ttsService.ts — Browser Native Speech Synthesis for SAHYOG AI
 * Speaks responses naturally in Hindi, Marathi, or English.
 */

export function speakText(text: string, lang: 'en' | 'hi' | 'mr' = 'en'): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel(); // Stop prior speech

    // Clean text of markdown formatting
    const clean = text
      .replace(/[*#_`~[\]()]/g, '')
      .replace(/•/g, ', ')
      .replace(/[\r\n]+/g, '. ')
      .trim();

    // Limit to first 2-3 sentences for a crisp audio summary
    const sentences = clean.split(/(?<=[.!?])\s+/);
    const speechSummary = sentences.slice(0, 3).join(' ');

    const utterance = new SpeechSynthesisUtterance(speechSummary);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const langCode = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN';
    utterance.lang = langCode;

    // Pick matching voice
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.lang === langCode) ||
      voices.find((v) => v.lang.startsWith(langCode.substring(0, 2))) ||
      voices[0];

    if (voice) {
      utterance.voice = voice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('[TTS] Speech synthesis error:', e);
  }
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
