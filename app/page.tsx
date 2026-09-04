"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { Phrase, VoiceState } from "@/types/phrase";
import { findPhrase } from "@/lib/phrases/search";
import { SpeechRecognitionService } from "@/lib/speech/recognition";
import {
  speakKazakh,
  stopKazakh,
  KazakhVoiceId,
  getSavedVoice,
} from "@/lib/speech/synthesis";
import { SpeakingAvatar } from "@/components/voice/SpeakingAvatar";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { VoiceSelector } from "@/components/voice/VoiceSelector";
import { PhraseResult } from "@/components/result/PhraseResult";
import { History } from "@/components/history/History";

const SAMPLE_PHRASES = [
  "қорамсақ",
  "селебе",
  "ақберен",
  "жасауыл",
  "күпшек",
  "көзді ашып жұмғанша",
  "қой үстіне бозторғай жұмыртқалау",
];

export default function Home() {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<Phrase | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<Phrase[]>([]);
  const [level, setLevel] = useState(0);
  const [currentVoice, setCurrentVoice] = useState<KazakhVoiceId>("kk-KZ-AigulNeural");

  const recognition = useRef<SpeechRecognitionService | null>(null);
  const stream = useRef<MediaStream | null>(null);

  useEffect(() => {
    recognition.current = new SpeechRecognitionService();
    setCurrentVoice(getSavedVoice());

    try {
      setHistory(JSON.parse(localStorage.getItem("taza-history") || "[]"));
    } catch {}

    return () => {
      stopKazakh();
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const save = (p: Phrase) =>
    setHistory((old) => {
      const n = [p, ...old.filter((x) => x.id !== p.id)].slice(0, 4);
      localStorage.setItem("taza-history", JSON.stringify(n));
      return n;
    });

  const present = (p: Phrase) => {
    setResult(p);
    save(p);
    setState("speaking");
    speakKazakh(`${p.phrase}. ${p.meaning}. ${p.explanation}`, {
      voice: currentVoice,
      onFrequencyData: (lvl) => setLevel(lvl),
      onEnd: () => {
        setState("complete");
        setLevel(0);
      },
      onError: (msg) => {
        setError(msg);
        setState("complete");
        setLevel(0);
      },
    });
  };

  const processText = async (text: string) => {
    stopKazakh();
    setError("");
    setState("processing");
    const found = findPhrase(text);
    if (found) return present(found);

    try {
      const r = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Бір нәрсе дұрыс болмады.");
      present(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Бір нәрсе дұрыс болмады.");
      setState("error");
    }
  };

  const start = async () => {
    stopKazakh();
    setError("");
    setResult(null);
    setTranscript("");

    if (!recognition.current?.supported()) {
      setError("Бұл браузерде дауыс тану қолдау таппайды. Мәтін енгізу өрісін қолдана аласыз.");
      return setState("error");
    }

    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audio = new AudioContext();
      const analyser = audio.createAnalyser();
      const source = audio.createMediaStreamSource(stream.current);
      const data = new Uint8Array(analyser.frequencyBinCount);
      source.connect(analyser);

      setState("listening");

      const tick = () => {
        if (state !== "listening" && stream.current?.active === false) return;
        analyser.getByteFrequencyData(data);
        setLevel(data.reduce((a, b) => a + b, 0) / data.length / 255);
        requestAnimationFrame(tick);
      };
      tick();

      recognition.current.start(
        ({ transcript: text }) => setTranscript(text),
        (msg) => {
          stream.current?.getTracks().forEach((t) => t.stop());
          setError(msg);
          setState("error");
        }
      );
    } catch {
      setError("Микрофонға рұқсат беріңіз немесе төмендегі өріске жазыңыз.");
      setState("error");
    }
  };

  const toggle = () => {
    if (state === "listening") {
      recognition.current?.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      if (transcript) {
        processText(transcript);
      } else {
        setError("Дауыс танылмады. Қайтадан көріңіз немесе сөзді жазыңыз.");
        setState("error");
      }
    } else {
      start();
    }
  };

  const label =
    state === "listening"
      ? "Тыңдап тұрмын..."
      : state === "processing"
      ? "Көне сөздің мағынасын талдап жатырмын..."
      : state === "speaking"
      ? "Табиғи қазақша түсіндіріп берейін..."
      : state === "error"
      ? "Қайтадан көріңіз"
      : "Кез келген көне қазақ сөзін айтыңыз немесе жазыңыз";

  const stopSpeech = () => {
    stopKazakh();
    setLevel(0);
    setState("complete");
  };

  const newQuery = () => {
    stopKazakh();
    setLevel(0);
    setResult(null);
    setTranscript("");
    setInputText("");
    setError("");
    setState("idle");
  };

  const handleReplay = () => {
    if (!result) return;
    if (state === "speaking") {
      stopSpeech();
    } else {
      setState("speaking");
      speakKazakh(`${result.phrase}. ${result.meaning}. ${result.explanation}`, {
        voice: currentVoice,
        onFrequencyData: (lvl) => setLevel(lvl),
        onEnd: () => {
          setState("complete");
          setLevel(0);
        },
        onError: (msg) => {
          setError(msg);
          setState("complete");
          setLevel(0);
        },
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      processText(inputText.trim());
    }
  };

  return (
    <main>
      <header>
        <span className="mark">◒</span>
        <span className="brand-title">ТАЗА ҚАЗАҚША</span>
        <div className="header-controls">
          <VoiceSelector
            currentVoice={currentVoice}
            onVoiceChange={(v) => setCurrentVoice(v)}
            disabled={state === "listening"}
          />
        </div>
        <small className="header-subtitle">КӨНЕ СӨЗДІҢ ТІРІ МАҒЫНАСЫ</small>
      </header>

      <div className="ambient a" />
      <div className="ambient b" />

      <section className="stage">
        <p className="status">{label}</p>

        <SpeakingAvatar state={state} level={level} />

        <AnimatePresence>
          {state === "listening" && (
            <div className="waves">
              {Array.from({ length: 23 }).map((_, i) => (
                <i
                  key={i}
                  style={{
                    height: `${18 + ((i * 13) % 48) + level * 54}px`,
                    animationDelay: `${i * 0.035}s`,
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        <div className="action-row">
          <VoiceButton listening={state === "listening"} onClick={toggle} />
          {state === "speaking" && (
            <button className="stop-speech" onClick={stopSpeech}>
              ■ Тоқтату
            </button>
          )}
        </div>

        {/* Text Input for Typing ANY Ancient Word */}
        <form className="text-input-form" onSubmit={handleFormSubmit}>
          <input
            type="text"
            className="text-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Кез келген көне сөзді жазыңыз (мысалы: селебе, ақберен, қорамсақ)..."
            disabled={state === "listening" || state === "processing"}
          />
          <button
            type="submit"
            className="text-submit-btn"
            disabled={!inputText.trim() || state === "processing"}
          >
            {state === "processing" ? "Іздеуде..." : "Түсіндір"}
          </button>
        </form>

        <p className="hint">
          {state === "idle"
            ? "Дауыспен айтыңыз немесе мына көне сөздердің бірін таңдаңыз:"
            : transcript || "Даусыңызды тыңдап тұрмын..."}
        </p>

        {state === "idle" && !result && (
          <div className="sample-chips">
            {SAMPLE_PHRASES.map((phrase) => (
              <button
                key={phrase}
                type="button"
                className="chip-button"
                onClick={() => processText(phrase)}
              >
                «{phrase}»
              </button>
            ))}
          </div>
        )}

        {error && <p className="error">{error}</p>}
      </section>

      <AnimatePresence>
        {result && (
          <PhraseResult
            phrase={result}
            isSpeaking={state === "speaking"}
            onReplay={handleReplay}
            onNew={newQuery}
          />
        )}
      </AnimatePresence>

      <History items={history} onChoose={present} />

      <footer>
        Қазақтың көне сөздері мен тарихи ұғымдары. Жасанды интеллект және HD табиғи дауыспен түсіндіру.
      </footer>
    </main>
  );
}
