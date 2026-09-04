"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Phrase } from "@/types/phrase";
import {
  Volume2,
  Square,
  Sparkles,
  RefreshCw,
  Share2,
  Check,
  Laugh,
  Lightbulb,
  Flame,
  Wand2,
} from "lucide-react";

interface PhraseResultProps {
  phrase: Phrase;
  isSpeaking?: boolean;
  activeVoiceGender?: "female" | "male";
  onReplay: () => void;
  onNew: () => void;
}

const LOCAL_FALLBACK_MEMES = [
  (w: string) => `😂 Мем: Мұғалім сенен үй жұмысын сұрағанда, сыныптағы барлық досыңмен бірге «${w}» вайбына түсіп кету. 🤡`,
  (w: string) => `😂 Мем: Досың саған 1 сағат бойы өзінің жаңа жоспарын түсіндірген соң, сенің қысқа жауабың: «${w}»! 💀`,
  (w: string) => `😂 Мем: Түнгі сағат 2-де тоңазытқышты ашып, соңғы тортты тапқанда: «Нағыз ${w} деген осы ғой!» 🍰`,
  (w: string) => `😂 Мем: Ата-анаң «Телефонды қой да, сабақ оқы» дегенде іштей: «${w} басталды...» деу. 📱`,
  (w: string) => `😂 Мем: Ойынға кіріп, алғашқы секундта-ақ жеңіске жеткендегі көңіл-күй: «Таза ${w}!» 🏆`,
  (w: string) => `😂 Мем: Досың қарызды ертең қайтарам деп, 6 ай бойы «${w}» болып жоқ болып кеткенде. 🏃‍♂️`,
];

export function PhraseResult({
  phrase,
  isSpeaking = false,
  activeVoiceGender = "female",
  onReplay,
  onNew,
}: PhraseResultProps) {
  const [copied, setCopied] = useState(false);
  const [currentMeme, setCurrentMeme] = useState(
    phrase.meme || `😂 Мем: «${phrase.phrase}» туралы бүкіл мектеп шулап жатыр! 🤡`
  );
  const [isGeneratingMeme, setIsGeneratingMeme] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  // Sync state when new phrase is passed
  useEffect(() => {
    setCurrentMeme(
      phrase.meme || `😂 Мем: «${phrase.phrase}» туралы бүкіл мектеп шулап жатыр! 🤡`
    );
  }, [phrase]);

  // Dynamic live OpenRouter Meme Generation
  const handleGenerateLiveMeme = async () => {
    setIsGeneratingMeme(true);
    try {
      const res = await fetch("/api/meme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrase: phrase.phrase }),
      });
      const data = await res.json();
      if (data?.meme) {
        setCurrentMeme(data.meme);
      } else {
        throw new Error("No meme returned");
      }
    } catch {
      // Fallback seamlessly if API takes too long
      const nextIdx = (fallbackIndex + 1) % LOCAL_FALLBACK_MEMES.length;
      setFallbackIndex(nextIdx);
      setCurrentMeme(LOCAL_FALLBACK_MEMES[nextIdx](phrase.phrase));
    } finally {
      setIsGeneratingMeme(false);
    }
  };

  const handleShare = async () => {
    const shareText = `«${phrase.phrase}»\n📖 Мағынасы: ${phrase.meaning}\n${currentMeme}\nТүсіндіру: Таза Қазақша ИИ сөздігі`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch {}
  };

  const isSlang = phrase.isSlang || phrase.category?.toLowerCase().includes("сленг");
  const speakerName = activeVoiceGender === "female" ? "Арай.AI" : "Айбар.AI";

  return (
    <motion.article
      className={`result-card-container ${isSlang ? "type-slang" : "type-ancient"}`}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Top Header Tags */}
      <div className="result-top-badges">
        <div className="badge-group-left">
          <span className={`category-pill ${isSlang ? "pill-slang" : "pill-ancient"}`}>
            {isSlang ? "⚡ ЖАСТАР СЛЕНГІ" : "🏛️ КӨНЕ СӨЗ / ФРАЗЕОЛОГИЗМ"}
          </span>
          {phrase.vibeRating && (
            <span className="vibe-pill">
              <Flame size={13} className="vibe-icon-svg" />
              <span>{phrase.vibeRating}</span>
            </span>
          )}
        </div>

        <span className="ai-speaker-badge">
          <Sparkles size={13} />
          <span>OpenRouter ИИ түсіндірді</span>
        </span>
      </div>

      {/* Main Phrase Title */}
      <h2 className="phrase-title">«{phrase.phrase}»</h2>

      {/* 1. МАҒЫНАСЫ */}
      <div className="result-section meaning-section">
        <p className="section-label">МАҒЫНАСЫ</p>
        <h3 className="meaning-headline">{phrase.meaning}</h3>
      </div>

      {/* 2. ҚАРАПАЙЫМ ТІЛМЕН */}
      <div className="result-section explanation-section">
        <p className="section-label">ҚАРАПАЙЫМ ТІЛМЕН</p>
        <p className="explanation-text">{phrase.explanation}</p>
      </div>

      {/* 3. ӨМІРЛІК МЫСАЛ */}
      {phrase.example && (
        <div className="result-section example-section">
          <p className="section-label">ӨМІРЛІК МЫСАЛ</p>
          <div className="example-bubble">
            <span className="example-quote-mark">“</span>
            <p className="example-text">{phrase.example}</p>
          </div>
        </div>
      )}

      {/* 4. КҮЛКІЛІ ИИ МЕМ (Live OpenRouter Generator) */}
      <div className="meme-card-box">
        <div className="meme-card-header">
          <div className="meme-card-title">
            <Laugh className="meme-icon-laugh" size={18} />
            <span>КҮЛКІЛІ ИИ МЕМ</span>
          </div>

          <button
            type="button"
            className="remix-meme-btn"
            onClick={handleGenerateLiveMeme}
            disabled={isGeneratingMeme}
            title="OpenRouter ИИ арқылы жаңа мем генерациялау"
          >
            {isGeneratingMeme ? (
              <>
                <RefreshCw size={13} className="spin-icon" />
                <span>ИИ мем ойлауда...</span>
              </>
            ) : (
              <>
                <Wand2 size={13} />
                <span>Жаңа ИИ мем жасау</span>
              </>
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentMeme}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.2 }}
            className="meme-card-content"
          >
            <p className="meme-text">{currentMeme}</p>
          </motion.div>
        </AnimatePresence>

        <div className="meme-card-footer">
          <span className="meme-badge-tag">🔥 100% Таза Жиза • OpenRouter ИИ</span>
          <span className="meme-tip-text">Достарыңмен бөліс!</span>
        </div>
      </div>

      {/* 5. ҚЫЗЫҚТЫ ДЕРЕК */}
      {phrase.funFact && (
        <div className="fun-fact-box">
          <div className="fun-fact-icon">
            <Lightbulb size={18} />
          </div>
          <div className="fun-fact-content">
            <p className="fun-fact-label">ҚЫЗЫҚТЫ ДЕРЕК</p>
            <p className="fun-fact-text">{phrase.funFact}</p>
          </div>
        </div>
      )}

      {/* Action Controls Bar */}
      <div className="result-actions-bar">
        <button
          type="button"
          className={`replay-btn ${isSpeaking ? "is-active" : ""}`}
          onClick={onReplay}
          aria-label={isSpeaking ? "Тоқтату" : "3D Кейіпкер даусымен тыңдау"}
        >
          {isSpeaking ? (
            <>
              <Square size={16} className="pulse-icon" />
              <span>■ Тоқтату</span>
            </>
          ) : (
            <>
              <Volume2 size={16} />
              <span>🔊 {speakerName} айтып берсін</span>
            </>
          )}
        </button>

        <button
          type="button"
          className="share-meme-btn"
          onClick={handleShare}
          title="Мемді көшіріп алу"
        >
          {copied ? (
            <>
              <Check size={15} />
              <span>Көшірілді!</span>
            </>
          ) : (
            <>
              <Share2 size={15} />
              <span>Мемді көшіру</span>
            </>
          )}
        </button>

        <button type="button" className="new-search-btn" onClick={onNew}>
          <span>＋ Жаңа сөз</span>
        </button>
      </div>
    </motion.article>
  );
}
