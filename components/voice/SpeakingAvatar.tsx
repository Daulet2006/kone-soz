"use client";
import { motion } from "framer-motion";
import type { VoiceState } from "@/types/phrase";
export function SpeakingAvatar({ state, level = 0 }: { state: VoiceState; level?: number }) {
  const active = state === "listening" || state === "speaking"; const scale = 1 + Math.min(level, .6) * .1;
  return <div className={`avatar-shell ${state}`}><motion.div className="avatar" animate={{ scale, rotate: state === "processing" ? 5 : 0 }} transition={{ type: "spring", stiffness: 180, damping: 12 }}>
    <span className="eye left" /><span className="eye right" /><motion.span className="mouth" animate={{ scaleY: state === "speaking" ? [1, 2.4, .7, 1.7, 1] : 1, width: state === "speaking" ? 21 : 15 }} transition={{ repeat: state === "speaking" ? Infinity : 0, duration: .42 }} />
  </motion.div>{active && <div className="orbit"><i /><i /><i /><i /><i /></div>}</div>;
}
