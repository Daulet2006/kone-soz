import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export type KazakhVoice = "kk-KZ-AigulNeural" | "kk-KZ-DauletNeural";

const audioCache = new Map<string, { buffer: Buffer; timestamp: number }>();
const MAX_CACHE_SIZE = 200;

export async function synthesizeKazakhSpeech(
  text: string,
  options: {
    voice?: string;
    rate?: string;
    pitch?: string;
  } = {}
): Promise<Buffer> {
  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error("Text is empty");
  }

  const voice: KazakhVoice =
    options.voice === "kk-KZ-DauletNeural" || options.voice === "daulet"
      ? "kk-KZ-DauletNeural"
      : "kk-KZ-AigulNeural";

  const rate = options.rate || "+0%";
  const pitch = options.pitch || "+0Hz";

  const cacheKey = `${voice}:${rate}:${pitch}:${cleanText}`;
  const cached = audioCache.get(cacheKey);
  if (cached) {
    return cached.buffer;
  }

  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

  // Generate audio stream
  const { audioStream } = tts.toStream(cleanText, {
    rate,
    pitch,
  });

  const chunks: Buffer[] = [];

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    audioStream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    audioStream.on("end", () => {
      const fullBuffer = Buffer.concat(chunks);
      if (fullBuffer.length === 0) {
        reject(new Error("Empty audio generated"));
      } else {
        resolve(fullBuffer);
      }
    });

    audioStream.on("error", (err: Error) => {
      reject(err);
    });
  });

  // Manage cache
  if (audioCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = audioCache.keys().next().value;
    if (oldestKey) audioCache.delete(oldestKey);
  }
  audioCache.set(cacheKey, { buffer, timestamp: Date.now() });

  return buffer;
}
