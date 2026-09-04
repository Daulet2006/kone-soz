let currentAudio: HTMLAudioElement | null = null;
export function stopKazakh() {
  currentAudio?.pause();
  if (currentAudio) { currentAudio.currentTime = 0; currentAudio = null; }
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
export async function speakKazakh(text: string, onEnd?: () => void) {
  stopKazakh();
  try { const response = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }); if (!response.ok) throw new Error(); const url = URL.createObjectURL(await response.blob()); const audio = new Audio(url); currentAudio = audio; audio.onended = () => { URL.revokeObjectURL(url); onEnd?.(); }; await audio.play(); }
  catch { if (!("speechSynthesis" in window)) return onEnd?.(); window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = "kk-KZ"; utterance.rate = .92; utterance.onend = () => onEnd?.(); window.speechSynthesis.speak(utterance); }
}
