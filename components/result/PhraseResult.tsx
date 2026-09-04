"use client";
import { motion } from "framer-motion";
import type { Phrase } from "@/types/phrase";

interface PhraseResultProps {
  phrase: Phrase;
  isSpeaking?: boolean;
  onReplay: () => void;
  onNew: () => void;
}

export function PhraseResult({
  phrase,
  isSpeaking = false,
  onReplay,
  onNew,
}: PhraseResultProps) {
  return (
    <motion.article
      className="result"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="result-header">
        <p className="eyebrow">ТАБУ ЖӘНЕ ТҮСІНДІРМЕ</p>
        <span className="hd-badge">✨ Табиғи қазақша дауыс</span>
      </div>

      <h2>«{phrase.phrase}»</h2>

      <section>
        <p className="label">Мағынасы</p>
        <h3>{phrase.meaning}</h3>
      </section>

      <section>
        <p className="label">Қарапайым тілмен</p>
        <p>{phrase.explanation}</p>
      </section>

      {phrase.example && (
        <section>
          <p className="label">Мысалы</p>
          <p className="example">«{phrase.example}»</p>
        </section>
      )}

      <div className="result-actions">
        <button
          className={`replay ${isSpeaking ? "is-playing" : ""}`}
          onClick={onReplay}
          title="Дауыстап тыңдау"
        >
          {isSpeaking ? (
            <>
              <span className="playing-pulse" />
              <span>■ Ойнатылуда...</span>
            </>
          ) : (
            <>
              <span>🔊 Қайта тыңдау</span>
            </>
          )}
        </button>

        <button className="new-query" onClick={onNew}>
          ＋ Тағы бір сөз
        </button>
      </div>
    </motion.article>
  );
}
