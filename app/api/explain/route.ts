import { NextResponse } from "next/server";

interface ExplainedPhrase {
  id: string;
  phrase: string;
  category: string;
  meaning: string;
  explanation: string;
  example: string;
  aliases: string[];
}

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
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenRouter API кілті орнатылмаған (.env тексеріңіз)." },
      { status: 503 }
    );
  }

  const configuredModel = process.env.OPENROUTER_MODEL || "openrouter/auto";

  const candidateModels = Array.from(
    new Set([
      configuredModel,
      "openrouter/auto",
      "google/gemma-4-31b-it:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "minimax/minimax-m2.7:free",
      "z-ai/glm-5.2:free",
    ])
  );

  const systemPrompt = `Сен — Қазақстанның жетекші филолог-ғалымысың, «Қазақ тілінің түсіндірме сөздігі» (10 томдық) мен І. Кеңесбаевтың «Қазақ тілінің фразеологиялық сөздігінің» білгірісің.

МАҢЫЗДЫ ЕРЕЖЕЛЕР:
1. Қазақ фразеологизмдерін, көне сөздерді, мақал-мәтелдерді сөзбе-сөз (тура) емес, қазақтың халықтық дәстүрлі ауыспалы бейнелі мағынасында ДӘЛ түсіндір!
   - Мысалы: «бетінен қаны тамып тұр» / «бетінен қаны тамған» — бұл жас, денсаулығы мықты, өңі қызыл шырайлы, сымбатты әрі балғын адам (керісінше: «бетінен қаны қашты» — қатты қорықты/жүдеді).
   - Мысалы: «ит байласа тұрғысыз» — өте жайсыз, қолайсыз жер.
   - Мысалы: «төбе шашы тік тұрды» — қатты қорқу.
   - Мысалы: «қорамсақ» — садақ оғын салатын сауыт-қап.
   - Мысалы: «селебе» — өткір қылыш / семсер.

2. ТЕК төмендегі JSON форматында жауап қайтар (артық сөзсіз):
{
  "phrase": "Сөз немесе тұрақты тіркес атауы",
  "category": "Фразеологизм / Көне сөз / Қару-жарақ / Салт-дәстүр / т.б.",
  "meaning": "Дәл әрі анық негізгі мағынасы (1-2 сөйлем)",
  "explanation": "Терең түсіндірмесі: этимологиясы, қазақ мәдениетінде қалай қолданылатыны, неліктен осылай аталу себебі",
  "example": "Қазақ әдебиетінен (Абай, Мұхтар Әуезов, Махамбет, батырлар жыры) немесе мақалдан көркем мысал"
}`;

  let lastError: string = "";

  for (const model of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12_000);

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://kone-soz.duckdns.org",
          "X-Title": "Kone Soz Kazakh Dictionary",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `«${cleanQuery}» тіркесінің немесе сөзінің дәстүрлі мағынасын түсіндір.` },
          ],
          temperature: 0.1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) continue;

      const parsed = extractJSON(content);
      if (parsed && (parsed.meaning || parsed.explanation)) {
        const result: ExplainedPhrase = {
          id: `kone-${Date.now()}`,
          phrase: parsed.phrase || cleanQuery,
          category: parsed.category || "Тұрақты тіркес",
          meaning: parsed.meaning || "Мағынасы табылды.",
          explanation: parsed.explanation || content,
          example: parsed.example || `«${cleanQuery}» тіркесі қазақ әдебиетінде жиі кездеседі.`,
          aliases: [],
        };
        return NextResponse.json(result);
      }

      if (content.length > 20) {
        const lines = content.split("\n").filter((l: string) => l.trim());
        const result: ExplainedPhrase = {
          id: `kone-${Date.now()}`,
          phrase: cleanQuery,
          category: "Қазақша тіркес",
          meaning: lines[0]?.replace(/^[-*#\s]+/, "") || cleanQuery,
          explanation: content,
          example: `«${cleanQuery}» сөзі қазақ тілінің бай қорына жатады.`,
          aliases: [],
        };
        return NextResponse.json(result);
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : "Қате орын алды.";
    }
  }

  return NextResponse.json(
    {
      error: "Сөздің түсіндірмесін қазір алу мүмкін болмады. Қайта көріңіз.",
    },
    { status: 502 }
  );
}
