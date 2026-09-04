"use client";

import { useEffect, useState } from "react";
import { KAZAKH_VOICES, KazakhVoiceId, getSavedVoice, setSavedVoice } from "@/lib/speech/synthesis";

interface VoiceSelectorProps {
  currentVoice?: KazakhVoiceId;
  onVoiceChange?: (voice: KazakhVoiceId) => void;
  disabled?: boolean;
}

export function VoiceSelector({
  currentVoice,
  onVoiceChange,
  disabled = false,
}: VoiceSelectorProps) {
  const [activeVoice, setActiveVoice] = useState<KazakhVoiceId>("kk-KZ-AigulNeural");

  useEffect(() => {
    const saved = getSavedVoice();
    setActiveVoice(saved);
  }, []);

  useEffect(() => {
    if (currentVoice && currentVoice !== activeVoice) {
      setActiveVoice(currentVoice);
    }
  }, [currentVoice, activeVoice]);

  const handleSelect = (voiceId: KazakhVoiceId) => {
    setActiveVoice(voiceId);
    setSavedVoice(voiceId);
    onVoiceChange?.(voiceId);
  };

  return (
    <div className="voice-selector-container">
      <div className="voice-selector-label">Дыбыс:</div>
      <div className="voice-selector-pill">
        {KAZAKH_VOICES.map((v) => {
          const isSelected = activeVoice === v.id;
          return (
            <button
              key={v.id}
              type="button"
              disabled={disabled}
              className={`voice-tab ${isSelected ? "is-active" : ""}`}
              onClick={() => handleSelect(v.id)}
              title={v.description}
            >
              <span className="voice-icon">{v.icon}</span>
              <span className="voice-name">{v.name}</span>
              {isSelected && <span className="voice-badge">HD</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
