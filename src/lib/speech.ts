/**
 * Speaks one auditory n-back cue using the browser/Tauri WebView speech engine.
 *
 * The visible UI should not show auditory letters during play, so callers can
 * use `onCueCleared` to clear the screen-reader-only cue after the short speech
 * window. If speech synthesis is unavailable, this function safely no-ops.
 */
export function speakLetter(letter: string, onCueCleared: () => void) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(letter);
  utterance.rate = 0.9;
  utterance.pitch = 0.95;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
  window.setTimeout(onCueCleared, 650);
}

/**
 * Cancels any queued or active speech synthesis utterance.
 */
export function stopSpeech() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}
