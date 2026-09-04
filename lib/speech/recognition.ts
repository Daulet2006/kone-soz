export type SpeechResultCallback = (transcript: string, isFinal: boolean) => void;
export type SpeechErrorCallback = (error: string) => void;
export type SpeechAutoSubmitCallback = (finalTranscript: string) => void;

export class SpeechRecognitionService {
  private recognition: any = null;
  private isListening = false;
  private currentTranscript = "";
  private silenceTimer: any = null;
  private restartTimer: any = null;
  private hasSpoken = false;

  supported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  start(
    onResult: SpeechResultCallback,
    onError: SpeechErrorCallback,
    onAutoSubmit: SpeechAutoSubmitCallback
  ) {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      onError("Бұл браузерде дауыс тану мүмкіндігі жоқ. Google Chrome немесе Safari браузерін қолданыңыз.");
      return;
    }

    this.stop();

    try {
      const rec = new SpeechRecognitionCtor();
      this.recognition = rec;
      this.isListening = true;
      this.currentTranscript = "";
      this.hasSpoken = false;

      // Primary language: Kazakh (Kazakhstan)
      rec.lang = "kk-KZ";
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      const triggerAutoSubmit = () => {
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }
        const text = this.currentTranscript.trim();
        if (this.isListening && text.length > 0) {
          this.stop();
          onAutoSubmit(text);
        }
      };

      const resetSilenceTimer = (delay = 1400) => {
        if (this.silenceTimer) clearTimeout(this.silenceTimer);
        this.silenceTimer = setTimeout(() => {
          triggerAutoSubmit();
        }, delay);
      };

      rec.onresult = (event: any) => {
        let interimText = "";
        let finalText = "";

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          const transcriptPart = res[0]?.transcript || "";
          if (res.isFinal) {
            finalText += transcriptPart + " ";
          } else {
            interimText += transcriptPart;
          }
        }

        const fullText = (finalText + interimText).trim();
        if (fullText) {
          this.hasSpoken = true;
          this.currentTranscript = fullText;
          onResult(fullText, false);
          // Wait 1.4s after user pauses speaking to auto-submit
          resetSilenceTimer(1400);
        }
      };

      rec.onerror = (event: any) => {
        console.warn("Speech recognition event error:", event.error);
        const err = event.error;

        // "no-speech" occurs during normal pauses, do not terminate
        if (err === "no-speech") {
          return;
        }

        // "aborted" is expected when stopped intentionally
        if (err === "aborted") {
          return;
        }

        if (err === "not-allowed" || err === "service-not-allowed") {
          this.stop();
          onError("Микрофонға рұқсат берілмеген. Браузер баптауынан микрофонды қосыңыз.");
          return;
        }

        if (err === "network") {
          // If network has temporary glitch, try to keep going if we already have text
          if (this.currentTranscript.trim()) {
            triggerAutoSubmit();
            return;
          }
          this.stop();
          onError("Интернет байланысы әлсіз немесе дауыс тану сервисі жауап бермеді.");
          return;
        }

        if (err === "audio-capture") {
          this.stop();
          onError("Микрофон табылмады немесе басқа бағдарлама қолданып тұр.");
          return;
        }

        // For any other unexpected error, if we have text, submit it
        if (this.currentTranscript.trim()) {
          triggerAutoSubmit();
        } else {
          this.stop();
          onError("Дауысты тану кезінде ақау болды. Қайта көріңіз немесе мәтінмен жазыңыз.");
        }
      };

      rec.onend = () => {
        if (!this.isListening) return;

        // If user already spoke something, finish and auto-submit
        if (this.currentTranscript.trim()) {
          triggerAutoSubmit();
          return;
        }

        // If browser ended recognition before user spoke, restart silently once
        if (!this.hasSpoken && this.isListening) {
          this.restartTimer = setTimeout(() => {
            if (this.isListening) {
              try {
                rec.start();
              } catch {
                this.stop();
              }
            }
          }, 300);
        }
      };

      rec.start();
    } catch (err: any) {
      console.error("Speech recognition start failed:", err);
      this.isListening = false;
      onError("Дауыс қызметі қосылмады: " + (err?.message || "Қате"));
    }
  }

  stop() {
    this.isListening = false;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.onerror = null;
        this.recognition.onresult = null;
        this.recognition.stop?.();
        this.recognition.abort?.();
      } catch {}
      this.recognition = null;
    }
  }

  getTranscript(): string {
    return this.currentTranscript.trim();
  }

  isActive(): boolean {
    return this.isListening;
  }
}
