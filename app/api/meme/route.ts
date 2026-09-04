import { NextResponse } from "next/server";

const CANDIDATE_MODELS = [
  "minimax/minimax-m2.7:free",
  "minimax/minimax-m3:free",
  "liquid/lfm-2.5-2.6b:free",
  "openrouter/free",
];

const FALLBACK_MEMES = [
  (w: string) => `😂 Мем: Мұғалім үй жұмысын тексергенде сенің сыныптағы барлық досыңмен бірге «${w}» вайбына түсіп кетуің.`,
  (w: string) => `😂 Мем: Досың саған 2 сағат өмірін айтқан соң, сенің қысқа ғана жауабың: «${w}»! 🤡`,
  (w: string) => `😂 Мем: Түн ортасында тоңазытқыштан соңғы тәттіні тауып алып: «Нағыз ${w} деген осы!» деу. 🍰`,
  (w: string) => `😂 Мем: Ата-анаң «Телефонды қой да, сабақ оқы» деген сәттегі ішкі күйің: «${w}»... 💀`,
  (w: string) => `😂 Мем: Ойында бірінші секундта бәрін жеңіп кеткенде: «Таза ${w} ғой!» деп мақтану. 🎮`,
  (w: string) => `😂 Мем: Қарыз алған досың бір жыл бойы «${w}» болып жоқ болып кеткендегі сезім. 🏃‍♂️`,
];

async function queryModel(model: string, phrase: string, apiKey: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://kone-soz.duckdns.org",
        "X-Title": "Kazakh AI Meme Generator",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "Сен — қазақ жастары мен балаларына арналған күлкілі қазақша мемдер шығаратын ИИ-генераторсың. Тек «😂 Мем: ...» деп басталатын 1-2 сөйлемнен тұратын өте күлкілі өмірлік әзіл/мем жаз. Түсініктемесіз, тек мемнің өзін қайтар.",
          },
          {
            role: "user",
            content: `«${phrase}» сөзіне немесе сленгіне жаңа, күлкілі қазақша мем ойлап тап.`,
          },
        ],
        temperature: 0.85,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Model ${model} returned ${res.status}`);

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("Empty response");

    // Clean up content
    let memeText = content.replace(/^["'`]|["'`]$/g, "").trim();
    if (!memeText.startsWith("😂")) {
      memeText = `😂 Мем: ${memeText.replace(/^Мем:\s*/i, "")}`;
    }
    return memeText;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: Request) {
  let body: { phrase?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Қате сұрау" }, { status: 400 });
  }

  const phrase = body?.phrase?.trim();
  if (!phrase) {
    return NextResponse.json({ error: "Сөз берілмеді" }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (apiKey) {
    try {
      // Race candidate models in parallel for fast response
      const meme = await Promise.any(
        CANDIDATE_MODELS.map((m) => queryModel(m, phrase, apiKey))
      );
      return NextResponse.json({ meme });
    } catch {
      // Fallback if all models timed out
    }
  }

  // Instant creative fallback
  const randomFallback =
    FALLBACK_MEMES[Math.floor(Math.random() * FALLBACK_MEMES.length)](phrase);
  return NextResponse.json({ meme: randomFallback });
}
