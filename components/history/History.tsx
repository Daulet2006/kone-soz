"use client";

import React from "react";
import type { Phrase } from "@/types/phrase";
import { History as HistoryIcon, ArrowRight } from "lucide-react";

interface HistoryProps {
  items: Phrase[];
  onChoose: (phrase: Phrase) => void;
  onClear?: () => void;
}

export function History({ items, onChoose }: HistoryProps) {
  if (!items.length) return null;

  return (
    <section className="history-section">
      <div className="history-header">
        <div className="history-title-group">
          <HistoryIcon size={16} />
          <span>СОҢҒЫ ІЗДЕЛГЕН СӨЗДЕР</span>
        </div>
      </div>

      <div className="history-grid">
        {items.slice(0, 6).map((phrase) => {
          const isSlang = phrase.isSlang || phrase.category?.toLowerCase().includes("сленг");
          return (
            <button
              key={phrase.id}
              type="button"
              className={`history-card-btn ${isSlang ? "type-slang" : "type-ancient"}`}
              onClick={() => onChoose(phrase)}
            >
              <div className="history-card-top">
                <span className="history-word-title">«{phrase.phrase}»</span>
                <span className={`history-mini-tag ${isSlang ? "tag-slang" : "tag-ancient"}`}>
                  {isSlang ? "Сленг" : "Көне сөз"}
                </span>
              </div>
              <p className="history-meaning-snippet">{phrase.meaning}</p>
              <div className="history-card-action">
                <span>Қайта көру</span>
                <ArrowRight size={12} />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
