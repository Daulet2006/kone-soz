import { NextResponse } from "next/server";
import { synthesizeKazakhSpeech } from "@/lib/speech/edge-tts-server";

const MAX_TEXT_LENGTH = 1000;

async function handleTTS(text: string, voice?: string, rate?: string) {
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Мәтін бос." }, { status: 400 });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: "Мәтін тым ұзын (максимум 1000 таңба)." },
      { status: 400 }
    );
  }

  // 1. Try high-quality Neural Edge TTS
  try {
    const audioBuffer = await synthesizeKazakhSpeech(text, { voice, rate });
    return new NextResponse(audioBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Length": audioBuffer.length.toString(),
      },
    });
  } catch (edgeError) {
    console.warn("Primary Edge TTS error, trying alternative voice:", edgeError);

    // Try alternative voice fallback
    try {
      const fallbackVoice =
        voice === "kk-KZ-DauletNeural" || voice === "daulet"
          ? "kk-KZ-AigulNeural"
          : "kk-KZ-DauletNeural";
      const audioBuffer = await synthesizeKazakhSpeech(text, {
        voice: fallbackVoice,
        rate,
      });
      return new NextResponse(audioBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          "Content-Length": audioBuffer.length.toString(),
        },
      });
    } catch (altError) {
      console.warn("Alternative Edge TTS error:", altError);
    }
  }

  // 2. Fallback to external TTS service if configured (e.g. docker environment)
  const serviceUrl = process.env.TTS_SERVICE_URL;
  if (serviceUrl) {
    try {
      const response = await fetch(`${serviceUrl.replace(/\/$/, "")}/synthesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(15_000),
      });

      if (response.ok && response.body) {
        return new NextResponse(response.body, {
          headers: {
            "Content-Type": response.headers.get("Content-Type") || "audio/wav",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    } catch (serviceError) {
      console.warn("External TTS Service fallback error:", serviceError);
    }
  }

  return NextResponse.json(
    { error: "Дауыс қызметі уақытша қолжетімсіз. Желіні тексеріңіз." },
    { status: 503 }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return handleTTS(body?.text, body?.voice, body?.rate);
  } catch {
    return NextResponse.json({ error: "Қате сұрау." }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const text = url.searchParams.get("text") || "";
  const voice = url.searchParams.get("voice") || undefined;
  const rate = url.searchParams.get("rate") || undefined;
  return handleTTS(text, voice, rate);
}
