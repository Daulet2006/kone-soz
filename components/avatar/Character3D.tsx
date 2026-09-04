"use client";

import React from "react";
import type { VoiceState } from "@/types/phrase";
import type { KazakhVoiceId } from "@/lib/speech/synthesis";
import { RealisticAvatar3D } from "./RealisticAvatar3D";

/**
 * 💡 АВАТАРДЫ ӨЗІҢІЗ АУЫСТЫРУ (HOW TO SWAP THE AVATAR):
 * Бұл компонент толықтай модульді. Сіз:
 * 1. customImageSrc арқылы кез келген суретті (мысалы: "/avatars/my-character.png") бере аласыз.
 * 2. Немесе RealisticAvatar3D.tsx ішіндегі DEFAULT_AVATARS жолдарын өзгерте аласыз!
 */
export interface Character3DProps {
  voice: KazakhVoiceId;
  state: VoiceState;
  level?: number;
  customImageSrc?: string;
  customName?: string;
}

export function Character3D({
  voice,
  state,
  level = 0,
  customImageSrc,
  customName,
}: Character3DProps) {
  return (
    <RealisticAvatar3D
      voice={voice}
      state={state}
      level={level}
      customImageSrc={customImageSrc}
      customName={customName}
    />
  );
}

export { RealisticAvatar3D };
