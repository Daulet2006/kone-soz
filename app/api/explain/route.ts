import { NextResponse } from "next/server";
import { findPhrase } from "@/lib/phrases/search";

export interface ExplainedPhrase {
  id: string;
  phrase: string;
  category: string;
  meaning: string;
  explanation: string;
  example: string;
  meme?: string;
  funFact?: string;
  vibeRating?: string;
  isSlang?: boolean;
  aliases: string[];
}

const CANDIDATE_MODELS = [
  "minimax/minimax-m3:free",
  "minimax/minimax-m2.7:free",
  "nvidia/nemotron-3.5-lightning:free",
  "liquid/lfm-2.5-2.6b:free",
];

function extractJSON(text: string): Record<string, any> | null {
  if (!text) return null;

  try {
    return JSON.parse(text.trim());
  } catch {}

  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonMatch && jsonMatch[1]) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {}
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      const extracted = text.substring(firstBrace, lastBrace + 1);
      return JSON.parse(extracted);
    } catch {}
  }

  return null;
}

// Fallback generator when OpenRouter is completely unreachable
function generateSmartFallback(query: string): ExplainedPhrase {
  const local = findPhrase(query);
  if (local) {
    return {
      ...local,
      id: `local-${Date.now()}`,
      category: local.category || (local.isSlang ? "Жастар сленгі" : "Көне сөз"),
    };
  }

  const isProbableSlang =
    /^(пон|рофл|краш|имба|вайб|чилл|кринж|хайп|тренд|хейт|токсик|шар|чек|гоу|нуб|бро|базар|пранк|форсить|стэн)/i.test(
      query
    ) || query.length <= 6;

  if (isProbableSlang) {
    return {
      id: `ai-slang-${Date.now()}`,
      phrase: query,
      category: "Жастар сленгі",
      isSlang: true,
      meaning: `Жастар арасында кеңінен қолданылатын әсерлі сленг сөз.`,
      explanation: `«${query}» сөзін жастар белгілі бір көңіл-күйді, ерекше әсерді немесе қызықты сәтті сипаттау үшін айтады. Бұл сөз күнделікті тілде өте танымал.`,
      example: `«— Бүгінгі кеш нағыз ${query} болды ғой! — Иә, керемет өтті!»`,
      meme: `😂 Мем: Досың саған қызық нәрсе көрсеткенде: «Мынау таза ${query} қой!» деп таңғалған сәтіңіз.`,
      funFact: `💡 Мұндай сленг сөздер әлеуметтік желілер мен ойындар арқылы жастар арасында тез тарайды.`,
      vibeRating: `🔥 Вайб: 100%`,
      aliases: [],
    };
  }

  return {
    id: `ai-ancient-${Date.now()}`,
    phrase: query,
    category: "Көне сөз / Фразеологизм",
    isSlang: false,
    meaning: `Қазақ тілінің бай сөздік қорындағы терең мағыналы атау немесе нақышты тіркес.`,
    explanation: `«${query}» — ата-бабаларымыздың дүниетанымын, ұлттық болмысы мен дәстүрлі өмір салтын көрсететін құнды ұғым.`,
    example: `«Қариялар: «${query} дегеннің мәні тереңде жатыр» деп өсиет қалдырған.»`,
    meme: `😂 Мем: Мұғалім сабақта «${query} деген не?» деп сұрағанда, өзіңді нағыз шешендей сезініп жауап беру.`,
    funFact: `💡 Қазақ тіліндегі нақышты сөздер ұлттық шешендік өнердің ең айқын үлгісі болып табылады.`,
    vibeRating: `✨ Ұлттық нақыш: 100%`,
    aliases: [],
  };
}

async function callOpenRouterModel(model: string, cleanQuery: string, apiKey: string): Promise<ExplainedPhrase> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8500);

  const systemPrompt = `Сен — Қазақ тілінің сөздік қорын, фразеологизмдерін және заманауи жастар сленгін балалар мен жастарға өте қарапайым, қызықты әрі таза қазақ тілінде түсіндіретін білікті әрі көңілді ИИ-доссың.

ҚАТАҢ ЕРЕЖЕЛЕР:
1. ТЕК ҚАНА ТАЗА, ӘДЕМІ ӘРІ ТҮСІНІКТІ ҚАЗАҚ ТІЛІНДЕ ЖАЗ. Орыс немесе ағылшын сөздерін тікелей қоспа, оларды қазақша түсіндір.
2. Мәтінде жұлдызшалар (**), шаршы жақшалар немесе түсініксіз таңбаларды жазба. Себебі бұл мәтінді қазақша дауыстық ИИ оқиды.
3. Түсініктеме қарапайым досыңа әңгімелеп бергендей жылы, жеңіл әрі қызықты болсын.

ТЕК төмендегі JSON форматында қайтар:
{
  "phrase": "${cleanQuery}",
  "category": "Жастар сленгі немесе Көне сөз / Фразеологизм",
  "meaning": "Сөздің қысқа, нақты әрі қарапайым мағынасы (1 сөйлем).",
  "explanation": "Қарапайым тілмен түсінікті баяндау (2-3 сөйлем).",
  "example": "Күнделікті өмірден алынған диалог немесе қызықты мысал сөйлем.",
  "meme": "😂 Мем: Күлкілі өмірлік жағдай немесе мектептегі қызық оқиға.",
  "funFact": "💡 Сөздің шығу тегі немесе соған байланысты қызықты дерек.",
  "vibeRating": "🔥 Вайб: 100%"
}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://kone-soz.duckdns.org",
        "X-Title": "Kazakh Words & Slang Dictionary with Memes",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `«${cleanQuery}» сөзін немесе сленгін МАҒЫНАСЫ, ҚАРАПАЙЫМ ТІЛМЕН, ӨМІРЛІК МЫСАЛ, КҮЛКІЛІ ИИ МЕМ және ҚЫЗЫҚТЫ ДЕРЕК өрістерімен таза әрі түсінікті қазақша түсіндір.` },
        ],
        temperature: 0.4,
      }),�тын өте күлкілі, өмірлік мектеп/достар арасындағы жағдай (жиза).
5. «funFact» (ҚЫЗЫҚТЫ ДЕРЕК): «💡 ...» деп басталатын 1 таңғажайып қызықты дерек.
6. «vibeRating» (ВАЙБ): «🔥 Вайб: 100%» сияқты көңілді көрсеткіш.

ТЕК төмендегі JSON форматында қайтар:
{
  "phrase": "${cleanQuery}",
  "category": "Жастар сленгі немесе Көне сөз",
  "meaning": "Қысқа мағынасы",
  "explanation": "Қарапайым тілмен түсіндірме",
  "example": "Өмірлік қолдану мысалы",
  "meme": "😂 Мем: Күлкілі өмірлік жағдай",
  "funFact": "💡 Қызықты дерек",
  "vibeRating": "🔥 Вайб: 100%"
}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://kone-soz.duckdns.org",
        "X-Title": "Kazakh Words & Slang Dictionary with Memes",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `«${cleanQuery}» сөзін немесе сленгін МАҒЫНАСЫ, ҚАРАПАЙЫМ ТІЛМЕН, ӨМІРЛІК МЫСАЛ, КҮЛКІЛІ ИИ МЕМ және ҚЫЗЫҚТЫ ДЕРЕК өрістерімен түсіндір.` },
        ],
        temperature: 0.5,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Model ${model} status ${response.status}`);

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response");

    const parsed = extractJSON(content);
    if (parsed && (parsed.meaning || parsed.explanation)) {
      const isSlang =
        parsed.category?.toLowerCase().includes("сленг") ||
        /^(пон|рофл|краш|имба|вайб|чилл|кринж|хайп|тренд|хейт|токсик|шар|чек|гоу|нуб|бро|базар)/i.test(
          cleanQuery
        );

      return {
        id: `ai-${Date.now()}`,
        phrase: parsed.phrase || cleanQuery,
        category: parsed.category || (isSlang ? "Жастар сленгі" : "Көне сөз"),
        meaning: parsed.meaning || "Мағынасы табылды.",
        explanation: parsed.explanation || content,
        example: parsed.example || `«${cleanQuery}» сөзі сөйлеу тілінде қолданылады.`,
        meme: parsed.meme || `😂 Мем: Күнделікті өмірде «${cleanQuery}» дегенде бәрі бірден түсінеді! 🤡`,
        funFact: parsed.funFact || `💡 Бұл сөз тіліміздің ерекше құндылығы мен байлығын көрсетеді.`,
        vibeRating: parsed.vibeRating || (isSlang ? "🔥 Вайб: 100%" : "✨ Даналық: 100%"),
        isSlang,
        aliases: [],
      };
    }
    throw new Error("Failed to parse JSON");
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(req: Request) {
  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Қате сұрау форматы." }, { status: 400 });
  }

  const rawText = body?.text;
  if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
    return NextResponse.json({ error: "Сұрақ бос." }, { status: 400 });
  }

  const cleanQuery = rawText.trim().replace(/^[«"']+|[»"']+$/g, "");
  const apiKey = process.env.OPENROUTER_API_KEY;

  // 1. ALWAYS query OpenRouter models in parallel for fresh AI generation
  if (apiKey) {
    try {
      const liveResult = await Promise.any(
        CANDIDATE_MODELS.map((model) => callOpenRouterModel(model, cleanQuery, apiKey))
      );
      return NextResponse.json(liveResult);
    } catch {
      // If OpenRouter models all fail or time out, fall back safely
    }
  }

  // 2. Safe instant fallback if OpenRouter network is offline
  return NextResponse.json(generateSmartFallback(cleanQuery));
}
