export type RecognitionEvent = { transcript: string };
type Recognition = EventTarget & { lang: string; continuous: boolean; interimResults: boolean; start: () => void; stop: () => void; onresult: ((e: any) => void) | null; onerror: ((e: any) => void) | null; onend: (() => void) | null };
export class SpeechRecognitionService {
  private recognition: Recognition | null = null;
  supported() { return typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition); }
  start(onResult: (value: RecognitionEvent) => void, onError: (message: string) => void) {
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) return onError("Бұл браузерде дауыс тану қолдау таппайды.");
    const rec: Recognition = new Ctor(); this.recognition = rec; rec.lang = "kk-KZ"; rec.continuous = false; rec.interimResults = true;
    rec.onresult = (event) => { const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join(""); onResult({ transcript }); };
    rec.onerror = (event) => onError(event.error === "not-allowed" ? "Микрофонға рұқсат беріңіз." : "Дауыс танылмады. Қайтадан көріңіз.");
    rec.start();
  }
  stop() { this.recognition?.stop(); }
}
