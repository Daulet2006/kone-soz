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
  "openrouter/free",
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
    /^(пон|рофл|краш|имба|вайб|чилл|кринж|хайп|тренд|хейт|токсик|шар|чек|гоу|нуб|бро|базар)/i.test(
      query
    ) || query.length <= 6;

  if (isProbableSlang) {
    return {
      id: `ai-slang-${Date.now()}`,
      phrase: query,
      category: "Жастар сленгі",
      isSlang: true,
      meaning: `Жастар арасында кеңінен таралған заманауи сөз немесе сленгтік тіркес.`,
      explanation: `«${query}» сөзі қазіргі күнделікті қарым-қатынаста, әлеуметтік желілерде белгілі бір көңіл-күйді, әрекетті немесе жағдайды әсерлі жеткізу үшін қолданылады.`,
      example: `«Достар арасында: «Мынау нағыз ${query} ғой!» деп қолданады.»`,
      meme: `😂 Мем: Досың саған қызық жаңалық айтқанда: «Мынау таза ${query} екен ғой!» деп күлген сәтіңіз. 🤡`,
      funFact: `💡 Заманауи сленг сөздер интернет пен жастар мәдениетінің арқасында лезде бүкіл елге тарайды.`,
      vibeRating: `🔥 Вайб деңгейі: 99%`,
      aliases: [],
    };
  }

  return {
    id: `ai-ancient-${Date.now()}`,
    phrase: query,
    category: "Көне сөз / Фразеологизм",
    isSlang: false,
    meaning: `Қазақ тілінің бай сөздік қорындағы терең мағыналы атау немесе ұғым.`,
    explanation: `«${query}» — қазақ халқының дүниетанымында, тұрмыстық не тарихи салтында ерекше мәнге ие болған нақышты тіркес.`,
    example: `«Аталарымыз: «${query} дегеннің мәні зор» деп үнемі өсиет айтып отыратын.»`,
    meme: `😂 Мем: Сыныпта мұғалім «${query} деген не?» деп сұрағанда, біздің ИИ түсіндіріп бергендей сеніммен жауап беру. 🌟`,
    funFact: `💡 Қазақ тіліндегі көне сөздер халқымыздың көшпелі өмір салты мен шешендік өнерінің куәсі.`,
    vibeRating: `✨ Ұлттық нақыш: 100%`,
    aliases: [],
  };
}

async function callOpenRouterModel(model: string, cleanQuery: string, apiKey: string): Promise<ExplainedPhrase> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7500);

  const systemPrompt = `Сен — Қазақ тілінің көне сөздерін, фразеологизмдерін және заманауи жастар сленгін балалар мен жастарға өте қызықты, жеңіл әрі таза қазақ тілінде түсіндіретін білікті ИИ-доссың.

ҚАТАҢ ТАЛАПТАР:
1. Тек таза, әдемі әрі түсінікті қазақ тілінде жауап бер.
2. Мәтінде жұлдызшалар (**), торлар (#) немесе қиын таңбалар жазба (мәтін дауыспен дыбысталады).
3. Мағынасы балаға да, үлкенге де лезде түсінікті болсын.
4. Күлкілі өмірлік мем (жиза) қосып отыр.

ТЕК төмендегі JSON форматында қайтар:
{
  "phrase": "${cleanQuery}",
  "category": "Жастар сленгі немесе Көне сөз",
  "meaning": "Сөздің қысқа, нақты мағынасы (1 сөйлем).",
  "explanation": "Қарапайым тілмен жеңіл баяндау (2 сөйлем).",
  "example": "Күнделікті өмірден диалог немесе нақты мысал сөйлем.",
  "meme": "😂 Мем: Мектептегі не достар арасындағы өте күлкілі жағдай.",
  "funFact": "💡 Сөздің шығу тегі не қызықты дерек.",
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
