"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { VoiceSelector } from "@/components/voice/VoiceSelector";
import { SpeakingAvatar } from "@/components/voice/SpeakingAvatar";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { PhraseResult } from "@/components/result/PhraseResult";
import { History } from "@/components/history/History";
import { SpeechRecognitionService } from "@/lib/speech/recognition";
import {
  KazakhVoiceId,
  getSavedVoice,
  speakKazakh,
  stopKazakh,
} from "@/lib/speech/synthesis";
import { findPhrase, combinedList } from "@/lib/phrases/search";
import type { Phrase, VoiceState } from "@/types/phrase";
import { Search, Dices, X, AlertCircle } from "lucide-react";

const HISTORY_STORAGE_KEY = "taza-qazaqsha-history-v3";

export default function Home() {
  const [state, setState] = useState<VoiceState>("idle");
  const [level, setLevel] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Phrase | null>(null);
  const [history, setHistory] = useState<Phrase[]>([]);
  const [currentVoice, setCurrentVoice] = useState<KazakhVoiceId>("kk-KZ-AigulNeural");
  const [samplePhrases, setSamplePhrases] = useState<Phrase[]>([]);

  const recognition = useRef<SpeechRecognitionService | null>(null);
  const stream = useRef<MediaStream | null>(null);

  // Initialize client-side state
  useEffect(() => {
    recognition.current = new SpeechRecognitionService();
    const savedVoice = getSavedVoice();
    setCurrentVoice(savedVoice);

    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {}

    // Automatically display a rich curated blend of both slang and ancient words
    const topKeywords = [
      "имба",
      "қой аузынан шөп алмас",
      "краш",
      "төбе шашы тік тұрды",
      "пон",
      "ит өлген жер",
      "вайб",
      "көзді ашып жұмғанша",
      "рофл",
      "базар жоқ",
    ];

    const curated = topKeywords
      .map((k) => findPhrase(k))
      .filter((p): p is Phrase => Boolean(p));

    setSamplePhrases(curated);
  }, []);

  const addToHistory = (phrase: Phrase) => {
    setHistory((prev) => {
      const filtered = prev.filter((p) => p.id !== phrase.id);
      const updated = [phrase, ...filtered].slice(0, 10);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const present = (p: Phrase) => {
    setResult(p);
    addToHistory(p);
    setState("speaking");

    // Natural text-to-speech script for the 3D character
    const memeText = p.meme ? `Күлкілі мем: ${p.meme.replace(/^😂\s*Мем:\s*/i, "")}.` : "";
    const speechScript = `${p.phrase}. ${p.meaning}. ${p.explanation}. ${memeText}`;

    speakKazakh(speechScript, {
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
    const cleanText = text.trim();
    if (!cleanText) return;

    // Always query OpenRouter to dynamically generate Meaning, Explanation, Example, Meme, and Fun Fact
    setState("processing");
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText }),
      });

      const data = await res.json();
      if (!res.ok && !data.phrase) {
        throw new Error(data.error || "Сөзді түсіндіру кезінде қате болды.");
      }

      present(data);
    } catch (e) {
      // Local safety fallback if network fails
      const local = findPhrase(cleanText);
      if (local) {
        present(local);
      } else {
        setError(e instanceof Error ? e.message : "Бір нәрсе дұрыс болмады.");
        setState("error");
      }
    }
  };


  const startListening = async () => {
    stopKazakh();
    setError("");
    setResult(null);
    setTranscript("");

    if (!recognition.current?.supported()) {
      setError("Бұл браузерде дауыс тану қолдау таппайды. Мәтін өрісіне жазыңыз.");
      return setState("error");
    }

    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream.current);
      const data = new Uint8Array(analyser.frequencyBinCount);
      source.connect(analyser);

      setState("listening");

      const tick = () => {
        if (state !== "listening" && stream.current?.active === false) return;
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
        setLevel(avg);
        requestAnimationFrame(tick);
      };
      tick();

      recognition.current.start(
        ({ transcript: text }) => {
          setTranscript(text);
        },
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

  const toggleListening = () => {
    if (state === "listening") {
      recognition.current?.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      if (transcript.trim()) {
        processText(transcript);
      } else {
        setError("Дауыс танылмады. Қайтадан көріңіз немесе жазыңыз.");
        setState("idle");
      }
    } else {
      startListening();
    }
  };

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

  const handleRandomPhrase = () => {
    if (!combinedList.length) return;
    const randomItem = combinedList[Math.floor(Math.random() * combinedList.length)];
    processText(randomItem.phrase);
  };

  const handleReplay = () => {
    if (!result) return;
    if (state === "speaking") {
      stopSpeech();
    } else {
      present(result);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      processText(inputText.trim());
    }
  };

  const isFemale = currentVoice === "kk-KZ-AigulNeural";

  const statusLabel =
    state === "listening"
      ? "Сізді мұқият тыңдап тұрмын..."
      : state === "processing"
      ? "Сөздің мағынасы мен мемін ойластырудамын..."
      : state === "speaking"
      ? `${isFemale ? "Арай.AI" : "Айбар.AI"} түсіндіріп жатыр...`
      : state === "error"
      ? "Қайта көріңіз"
      : "Кез келген сөзді немесе сленгті айтыңыз / жазыңыз:";

  return (
    <main className={`app-root-shell ${isFemale ? "theme-female" : "theme-male"}`}>
      {/* Background Decorative Lighting */}
      <div className="ambient-glow glow-top-left" />
      <div className="ambient-glow glow-bottom-right" />
      <div className="cyber-pattern-grid" />

      {/* Top Navigation Header */}
      <header className="main-header">
        <div className="brand-logo-group" onClick={newQuery} style={{ cursor: "pointer" }}>
          <span className="brand-logo-icon">✨</span>
          <div className="brand-title-wrap">
            <h1 className="brand-title">ТАЗА ҚАЗАҚША</h1>
            <span className="brand-badge">3D ИИ СӨЗДІК & МЕМДЕР</span>
          </div>
        </div>

        {/* 3D Character Voice Selector */}
        <div className="header-actions">
          <VoiceSelector
            currentVoice={currentVoice}
            onVoiceChange={(v) => {
              setCurrentVoice(v);
              if (result && state === "speaking") {
                stopKazakh();
                setTimeout(() => present(result), 150);
              }
            }}
            disabled={state === "listening"}
          />
        </div>
      </header>

      {/* Center 3D Stage Section */}
      <section className="stage-section">
        {/* Status Caption */}
        <p className="stage-status-text">{statusLabel}</p>

        {/* Photorealistic 3D Speaking Avatar */}
        <SpeakingAvatar state={state} level={level} voice={currentVoice} />

        {/* Audio Waveform while listening */}
        <AnimatePresence>
          {state === "listening" && (
            <motion.div
              className="listening-waveform-strip"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <i
                  key={i}
                  className="wave-bar"
                  style={{
                    height: `${14 + ((i * 9) % 36) + level * 52}px`,
                    animationDelay: `${i * 0.04}s`,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Controls (Voice Button + Random Button) */}
        <div className="controls-row">
          <VoiceButton
            listening={state === "listening"}
            onClick={toggleListening}
            disabled={state === "processing"}
          />

          <button
            type="button"
            className="random-phrase-btn"
            onClick={handleRandomPhrase}
            disabled={state === "listening" || state === "processing"}
            title="Кездейсоқ сөз таңдау"
          >
            <Dices size={18} />
            <span>Кездейсоқ сөз</span>
          </button>
        </div>

        {/* Fast Text Input Form */}
        <form className="search-input-form" onSubmit={handleFormSubmit}>
          <div className="input-field-wrapper">
            <Search size={18} className="search-input-icon" />
            <input
              type="text"
              className="main-search-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Кез келген сөзді немесе сленгті жазыңыз (мысалы: имба, краш, қой аузынан шөп алмас)..."
              disabled={state === "listening" || state === "processing"}
            />
            {inputText && (
              <button
                type="button"
                className="input-clear-btn"
                onClick={() => setInputText("")}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="search-submit-btn"
            disabled={!inputText.trim() || state === "processing"}
          >
            {state === "processing" ? (
              <span className="btn-spinner">Ойлануда...</span>
            ) : (
              <span>Түсіндір</span>
            )}
          </button>
        </form>

        {/* Live Transcript / Prompt */}
        <p className="stage-hint-text">
          {state === "idle"
            ? "Ұсынылатын танымал сөздерді басыңыз немесе өз сөзіңізді жазыңыз:"
            : transcript
            ? `«${transcript}»`
            : "Даусыңызды күтіп тұрмын..."}
        </p>

        {/* Sample Trending Chips (Automatic blend of slang & ancient) */}
        {state === "idle" && !result && (
          <div className="sample-chips-wrap">
            {samplePhrases.map((item) => {
              const isSlang = item.isSlang || item.category?.toLowerCase().includes("сленг");
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`sample-chip ${isSlang ? "chip-slang" : "chip-ancient"}`}
                  onClick={() => processText(item.phrase)}
                >
                  <span className="chip-icon">{isSlang ? "⚡" : "🏛️"}</span>
                  <span className="chip-text">«{item.phrase}»</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="error-alert-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Result Card with AI Memes (Automatically Tagged) */}
      <AnimatePresence mode="wait">
        {result && (
          <PhraseResult
            phrase={result}
            isSpeaking={state === "speaking"}
            activeVoiceGender={isFemale ? "female" : "male"}
            onReplay={handleReplay}
            onNew={newQuery}
          />
        )}
      </AnimatePresence>

      {/* History of Searched Words */}
      <History items={history} onChoose={(p) => processText(p.phrase)} />

      {/* Site Footer */}
      <footer className="main-footer">
        <div className="footer-content">
          <p className="footer-title">
            🇰🇿 ТАЗА ҚАЗАҚША — Көне сөздер, жастар сленгі және күлкілі мемдер
          </p>
          <p className="footer-sub">
            3D ИИ кейіпкерлер Арай мен Айбар • Табиғи HD қазақша дауыс • Балалар мен жастар үшін
          </p>
        </div>
      </footer>
    </main>
  );
}
