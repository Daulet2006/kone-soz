"use client";

import React, { useEffect, useRef, useState } from "react";
import type { VoiceState } from "@/types/phrase";
import type { KazakhVoiceId } from "@/lib/speech/synthesis";

export interface AvatarCharacterConfig {
  name: string;
  role: string;
  gender: "female" | "male";
  videoSrc: string;
  idlePosterSrc: string;
  idleTime: number;      // Exact timestamp with mouth closed & still
  speechStart: number;   // Continuous natural talking start
  speechEnd: number;     // Continuous natural talking end
  objectPosition: string;
  glowColor: string;
  accentGradient: string;
  imageSrc: string;
}

export const DEFAULT_AVATARS: Record<KazakhVoiceId, AvatarCharacterConfig> = {
  "kk-KZ-AigulNeural": {
    name: "Арай.AI",
    role: "Қыз кейіпкері",
    gender: "female",
    videoSrc: "/live-video/ai-woman.mp4",
    idlePosterSrc: "/live-video/woman-idle.jpg",
    idleTime: 0.0,         // Frame 0.0s: mouth closed, calm, still
    speechStart: 0.7,      // 0.7s to 4.1s: animated continuous speaking
    speechEnd: 4.1,
    objectPosition: "50% 16%",
    glowColor: "rgba(236, 72, 153, 0.4)",
    accentGradient: "linear-gradient(135deg, #ec4899, #a855f7)",
    imageSrc: "/live-video/woman-idle.jpg",
  },
  "kk-KZ-DauletNeural": {
    name: "Айбар.AI",
    role: "Ұл кейіпкері",
    gender: "male",
    videoSrc: "/live-video/ai-man.mp4",
    idlePosterSrc: "/live-video/man-idle.jpg",
    idleTime: 4.75,        // Frame 4.75s: mouth completely closed, calm posture
    speechStart: 0.7,      // 0.7s to 3.2s: continuous expressive speech
    speechEnd: 3.2,
    objectPosition: "50% 22%",
    glowColor: "rgba(6, 182, 212, 0.4)",
    accentGradient: "linear-gradient(135deg, #06b6d4, #3b82f6)",
    imageSrc: "/live-video/man-idle.jpg",
  },
};

interface RealisticAvatar3DProps {
  voice: KazakhVoiceId;
  state: VoiceState;
  level?: number;
  customImageSrc?: string;
  customName?: string;
}

export function RealisticAvatar3D({
  voice,
  state,
  level = 0,
  customImageSrc,
  customName,
}: RealisticAvatar3DProps) {
  const config = DEFAULT_AVATARS[voice] || DEFAULT_AVATARS["kk-KZ-AigulNeural"];
  const isFemale = config.gender === "female";

  const videoRef = useRef<HTMLVideoElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // 3D Parallax Mouse Tracking
  useEffect(() => {
    let animFrame = 0;
    const handleMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const deltaX = Math.max(-1, Math.min(1, (e.clientX - centerX) / centerX));
      const deltaY = Math.max(-1, Math.min(1, (e.clientY - centerY) / centerY));
      setMousePos({ x: deltaX * 8, y: deltaY * 6 });
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, []);

  // Sync video to idle state when metadata loads
  const handleLoadedMetadata = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (state !== "speaking") {
      try {
        vid.currentTime = config.idleTime;
        vid.pause();
      } catch {
        // Safe catch
      }
    }
  };

  // High-precision video playback & seamless speaking loop controller
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    let animFrameId: number;

    if (state === "speaking") {
      // Start playback from the continuous speaking segment
      if (vid.currentTime < config.speechStart || vid.currentTime >= config.speechEnd) {
        try {
          vid.currentTime = config.speechStart;
        } catch {
          // Ignored if seeking
        }
      }

      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay handled silently
        });
      }

      // Smooth frame-accurate loop while speech is active
      const loopCheck = () => {
        if (vid && state === "speaking") {
          if (vid.currentTime >= config.speechEnd) {
            vid.currentTime = config.speechStart;
          }
          animFrameId = requestAnimationFrame(loopCheck);
        }
      };
      animFrameId = requestAnimationFrame(loopCheck);
    } else {
      // Speech has ended, paused, listening, or idle:
      vid.pause();
      try {
        vid.currentTime = config.idleTime;
      } catch {
        // Safe seek catch
      }
    }

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [state, config, voice]);

  // Combined 3D perspective rotation with speech reactions
  const rotX = -mousePos.y * 1.1 + (state === "listening" ? 3 : 0);
  const rotY = mousePos.x * 1.2 + (state === "processing" ? 5 : 0);
  const scale = state === "speaking" ? 1.03 : state === "listening" ? 1.02 : 1;

  const displayName = customName || config.name;

  return (
    <div className={`realistic-avatar-root ${state} ${isFemale ? "theme-female" : "theme-male"}`}>
      {/* Background Holographic Aura */}
      <div className="avatar-ambient-glow" style={{ background: config.glowColor }} />
      <div className="avatar-orbit-circle circle-outer" />
      <div className="avatar-orbit-circle circle-inner" />

      {/* Main 3D Perspective Floating Human Bust */}
      <div
        className="avatar-3d-viewport"
        style={{
          transform: `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`,
        }}
      >
        {/* Holographic Crystal Frame Pod */}
        <div className="avatar-crystal-pod">
          {/* Main Photorealistic 3D Human Avatar Shell */}
          <div className="avatar-image-shell">
            {customImageSrc ? (
              <img
                src={customImageSrc}
                alt={displayName}
                className="avatar-human-img"
              />
            ) : (
              <video
                ref={videoRef}
                key={config.videoSrc}
                src={config.videoSrc}
                poster={config.idlePosterSrc}
                muted
                playsInline
                preload="auto"
                onLoadedMetadata={handleLoadedMetadata}
                className="avatar-live-video"
                style={{
                  objectPosition: config.objectPosition,
                }}
              />
            )}

            {/* Background preloader for alternate character for zero-delay instant switching */}
            <video
              src={isFemale ? "/live-video/ai-man.mp4" : "/live-video/ai-woman.mp4"}
              muted
              preload="auto"
              style={{ display: "none" }}
            />

            {/* Video Scanline simulation for authentic Studio Feel */}
            <div className="avatar-video-scanlines" />

            {/* Cinematic Glass Gloss & Rim Lighting */}
            <div className="avatar-glass-gloss" />
            <div className="avatar-rim-lighting" />
          </div>

          {/* Kazakh Cyber Crest Emblem */}
          <div className="avatar-kazakh-crest">
            <span>{isFemale ? "💎" : "🛡️"}</span>
          </div>
        </div>
      </div>

      {/* Floating Status Mood Badge */}
      <div className="avatar-status-pill">
        <span className="status-indicator-dot" />
        <span className="status-indicator-text">
          {state === "speaking"
            ? `${displayName} • Сөйлеп жатыр...`
            : state === "listening"
            ? "Тыңдап тұрмын..."
            : state === "processing"
            ? "Талдаудамын..."
            : `${displayName} • ${isFemale ? "3D Қыз" : "3D Ұл"}`}
        </span>
      </div>
    </div>
  );
}
