import { NextResponse } from "next/server";
const MAX_TEXT_LENGTH = 700;
export async function POST(request: Request) {
  const { text } = await request.json();
  if (typeof text !== "string" || !text.trim()) return NextResponse.json({ error: "Мәтін бос." }, { status: 400 });
  if (text.length > MAX_TEXT_LENGTH) return NextResponse.json({ error: "Мәтін тым ұзын." }, { status: 400 });
  const serviceUrl = process.env.TTS_SERVICE_URL;
  if (!serviceUrl) return NextResponse.json({ error: "Дауыс қызметі бапталмаған." }, { status: 503 });
  try { const response = await fetch(`${serviceUrl.replace(/\/$/, "")}/synthesize`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }), signal: AbortSignal.timeout(30_000) }); if (!response.ok) throw new Error(); return new NextResponse(response.body, { headers: { "Content-Type": "audio/wav", "Cache-Control": "private, max-age=86400" } }); } catch { return NextResponse.json({ error: "Дауыс қызметі уақытша қолжетімсіз." }, { status: 503 }); }
}
