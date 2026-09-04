"use client";
import { motion } from "framer-motion";
import type { VoiceState } from "@/types/phrase";

export function SpeakingAvatar({
  state,
  level = 0,
}: {
  state: VoiceState;
  level?: number;
}) {
  const active = state === "listening" || state === "speaking";
  const dynamicScale = 1 + Math.min(level * 0.4, 0.25);

  return (
    <div className={`avatar-shell ${state}`}>
      <motion.div
        className="avatar"
        animate={{
          scale: dynamicScale,
          rotate: state === "processing" ? [0, 6, -6, 0] : 0,
          y: state === "speaking" ? [0, -3, 0] : 0,
        }}
        transition={{
          scale: { type: "spring", stiffness: 260, damping: 18 },
          rotate: { repeat: state === "processing" ? Infinity : 0, duration: 1.8 },
          y: { repeat: state === "speaking" ? Infinity : 0, duration: 0.5 },
        }}
      >
        <span className="eye left" />
        <span className="eye right" />
        <motion.span
          className="mouth"
          animate={{
            scaleY:
              state === "speaking"
                ? [1, 2.2 + level * 2.5, 0.7, 1.8 + level * 2, 1]
                : 1,
            scaleX: state === "speaking" ? [1, 1.2, 0.9, 1.1, 1] : 1,
            width: state === "speaking" ? 22 : 15,
          }}
          transition={{
            repeat: state === "speaking" ? Infinity : 0,
            duration: 0.36,
            ease: "easeInOut",
          }}
        />
      </motion.div>
      {active && (
        <div className="orbit">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      )}
    </div>
  );
}
