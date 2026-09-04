"use client";

import React from "react";
import type { VoiceState } from "@/types/phrase";
import type { KazakhVoiceId } from "@/lib/speech/synthesis";
import { RealisticAvatar3D } from "@/components/avatar/RealisticAvatar3D";

interface SpeakingAvatarProps {
  state: VoiceState;
  level?: number;
  voice: KazakhVoiceId;
}

export function SpeakingAvatar({
  state,
  level = 0,
  voice,
}: SpeakingAvatarProps) {
  const isFemale = voice === "kk-KZ-AigulNeural";

  return (
    <div className={`avatar-stage-shell ${state} ${isFemale ? "is-female" : "is-male"}`}>
      {/* Photorealistic 3D Interactive AI Character */}
      <RealisticAvatar3D voice={voice} state={state} level={level} />

      {/* Floating Audio Spectrum Ring for Speaking/Listening */}
      {(state === "speaking" || state === "listening") && (
        <div className="audio-reactive-spectrum">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className="spectrum-bar"
              style={{
                transform: `rotate(${i * 22.5}deg) translateY(-145px)`,
                height: `${8 + level * 36 + Math.sin(i + level * 10) * 12}px`,
                opacity: 0.3 + level * 0.7,
              }}
            />
          ))}
        </div>
      )}

      {/* Character Nameplate Tag */}
      <div className="character-nameplate">
        <span className="character-status-dot" />
        <span className="character-name-label">
          {isFemale ? "Арай.AI • 3D Қыз кейіпкері" : "Айбар.AI • 3D Ұл кейіпкері"}
        </span>
      </div>
    </div>
  );
}
