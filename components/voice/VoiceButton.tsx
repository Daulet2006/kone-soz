"use client";
import { motion } from "framer-motion";
export function VoiceButton({ listening, onClick }: { listening: boolean; onClick: () => void }) { return <motion.button whileTap={{ scale: .9 }} className={`voice-button ${listening ? "is-listening" : ""}`} onClick={onClick} aria-label={listening ? "Тоқтату" : "Сөйлеу"}><span className="mic">{listening ? "■" : "♩"}</span><span>{listening ? "Тоқтату" : "Сөйлеу"}</span></motion.button>; }
