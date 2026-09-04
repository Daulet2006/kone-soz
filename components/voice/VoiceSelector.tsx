"use client";

import React, { useEffect, useState } from "react";
import { KAZAKH_VOICES, KazakhVoiceId, getSavedVoice, setSavedVoice } from "@/lib/speech/synthesis";
import { Sparkles, User, UserCheck } from "lucide-react";

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
    <div className="voice-selector-box">
      <div className="voice-selector-tabs">
        {KAZAKH_VOICES.map((v) => {
          const isSelected = activeVoice === v.id;
          const isFemale = v.gender === "female";

          return (
            <button
              key={v.id}
              type="button"
              disabled={disabled}
              className={`voice-tab-btn ${isSelected ? "is-active" : ""} ${
                isFemale ? "theme-female" : "theme-male"
              }`}
              onClick={() => handleSelect(v.id)}
              title={v.description}
            >
              <span className="voice-avatar-icon">
                {isFemale ? "👩" : "👨"}
              </span>
              <div className="voice-text-info">
                <div className="voice-main-title">
                  <span>{v.name}</span>
                  {isSelected && <span className="voice-3d-badge">3D LIVE</span>}
                </div>
                <span className="voice-sub-desc">
                  {isFemale ? "Қыз кейіпкері" : "Ұл кейіпкері"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
