"use client";

import React from "react";
import { motion } from "framer-motion";
import { Mic, Square, Sparkles } from "lucide-react";

interface VoiceButtonProps {
  listening: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function VoiceButton({
  listening,
  onClick,
  disabled = false,
}: VoiceButtonProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      className={`voice-action-btn ${listening ? "is-listening" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={listening ? "Дауыс жазуды тоқтату" : "Дауыспен сөзді айту"}
    >
      <div className="mic-circle-icon">
        {listening ? (
          <Square size={18} className="mic-stop-icon" />
        ) : (
          <Mic size={20} className="mic-active-icon" />
        )}
      </div>
      <div className="btn-text-block">
        <span className="btn-main-label">
          {listening ? "Тыңдап тұрмын... (Тоқтату)" : "Дауыспен сұрау"}
        </span>
        <span className="btn-sub-label">
          {listening ? "Сөзіңізді айтыңыз" : "Микрофонды басыңыз"}
        </span>
      </div>
      {listening && (
        <span className="btn-pulse-wave">
          <span className="pulse-ring ring-1" />
          <span className="pulse-ring ring-2" />
        </span>
      )}
    </motion.button>
  );
}
