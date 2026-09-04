export interface Phrase { id: string; phrase: string; aliases: string[]; meaning: string; explanation: string; example: string; category?: string; imagePrompt?: string }
export type VoiceState = "idle" | "listening" | "processing" | "speaking" | "generating-image" | "complete" | "error";
