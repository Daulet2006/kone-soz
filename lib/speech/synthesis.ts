let currentAudio: HTMLAudioElement | null = null;
let currentAudioUrl: string | null = null;
let audioContext: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;

const audioBlobCache = new Map<string, string>();

export type KazakhVoiceId = "kk-KZ-AigulNeural" | "kk-KZ-DauletNeural";

export const KAZAKH_VOICES = [
  {
    id: "kk-KZ-AigulNeural" as KazakhVoiceId,
    name: "Арай.AI",
    gender: "female",
    description: "Жұмсақ әрі табиғи әйел даусы",
    icon: "👩",
  },
  {
    id: "kk-KZ-DauletNeural" as KazakhVoiceId,
    name: "Айбар.AI",
    gender: "male",
    description: "Салмақты әрі анық ер даусы",
    icon: "👨",
  },
];

const VOICE_STORAGE_KEY = "taza-kazakh-voice";

export function getSavedVoice(): KazakhVoiceId {
  if (typeof window === "undefined") return "kk-KZ-AigulNeural";
  try {
    const saved = localStorage.getItem(VOICE_STORAGE_KEY) as KazakhVoiceId;
    if (saved && (saved === "kk-KZ-AigulNeural" || saved === "kk-KZ-DauletNeural")) {
      return saved;
    }
  } catch {}
  return "kk-KZ-AigulNeural";
}

export function setSavedVoice(voice: KazakhVoiceId) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VOICE_STORAGE_KEY, voice);
  } catch {}
}

export function stopKazakh() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export interface SpeakKazakhOptions {
  voice?: KazakhVoiceId;
  rate?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (errorMessage: string) => void;
  onFrequencyData?: (level: number) => void;
}

export async function speakKazakh(
  text: string,
  onEndOrOptions?: (() => void) | SpeakKazakhOptions
): Promise<void> {
  const options: SpeakKazakhOptions =
    typeof onEndOrOptions === "function"
      ? { onEnd: onEndOrOptions }
      : onEndOrOptions || {};

  stopKazakh();

  const cleanText = text.trim();
  if (!cleanText) {
    options.onEnd?.();
    return;
  }

  const voice = options.voice || getSavedVoice();
  const rate = options.rate || "+0%";
  const cacheKey = `${voice}:${rate}:${cleanText}`;

  try {
    let blobUrl = audioBlobCache.get(cacheKey);

    if (!blobUrl) {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText, voice, rate }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Дауыс қызметі жауап бермеді.");
      }

      const blob = await response.blob();
      blobUrl = URL.createObjectURL(blob);
      audioBlobCache.set(cacheKey, blobUrl);
    }

    const audio = new Audio(blobUrl);
    currentAudio = audio;
    currentAudioUrl = blobUrl;

    options.onStart?.();

    let animationFrameId: number | null = null;

    // Optional audio analyser integration for reactive mouth/avatar animation
    if (options.onFrequencyData && typeof window !== "undefined" && window.AudioContext) {
      try {
        if (!audioContext || audioContext.state === "closed") {
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }

        analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 256;
        sourceNode = audioContext.createMediaElementSource(audio);
        sourceNode.connect(analyserNode);
        analyserNode.connect(audioContext.destination);

        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
          if (!currentAudio || currentAudio.paused) return;
          analyserNode?.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const avg = sum / bufferLength / 255;
          options.onFrequencyData?.(avg);
          animationFrameId = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch {
        // Fallback gracefully if Web Audio context cannot attach to media element
      }
    }

    audio.onended = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      currentAudio = null;
      options.onFrequencyData?.(0);
      options.onEnd?.();
    };

    audio.onerror = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      currentAudio = null;
      options.onFrequencyData?.(0);
      options.onError?.("Аудио ойнату кезінде қате орын алды.");
      options.onEnd?.();
    };

    await audio.play();
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Дауыс қызметі қолжетімсіз.";
    console.warn("High-quality TTS playback failed:", errorMsg);

    options.onError?.(errorMsg);
    options.onEnd?.();
  }
}
