import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const { text } = await req.json();
  if (!text || typeof text !== "string") return NextResponse.json({ error: "Сұрақ бос." }, { status: 400 });
  if (!process.env.OPENROUTER_API_KEY) return NextResponse.json({ error: "Қазір сөздік қордан тыс жауап беру қолжетімсіз." }, { status: 503 });
  const prompt = `Сен қазақ тілінің маманысың. Тек әдеби қазақша жауап бер. Төмендегі тіркесті қысқа түсіндір. Тек JSON қайтар: {"id":"ai","phrase":"...","aliases":[],"meaning":"...","explanation":"...","example":"...","category":"..."}. Тіркес: ${text}`;
  try { const r = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001", messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } }) }); if (!r.ok) throw new Error(); const d = await r.json(); return NextResponse.json(JSON.parse(d.choices[0].message.content)); } catch { return NextResponse.json({ error: "Бір нәрсе дұрыс болмады. Қайтадан көріңіз." }, { status: 502 }); }
}
