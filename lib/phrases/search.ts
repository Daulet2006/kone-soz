import phrases from "@/data/phrases.json";
import type { Phrase } from "@/types/phrase";

const list = phrases as Phrase[];

function normalizeText(str: string): string {
  return str
    .toLocaleLowerCase("kk-KZ")
    .replace(/[«»"'`.,!?;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function findPhrase(query: string): Phrase | null {
  const clean = normalizeText(
    query.replace(/деген не|дегенім|мағынасы қандай|мағынасы|айтшы|түсіндір/g, "")
  );

  if (!clean) return null;

  // Strict exact match only: phrase matches completely or alias matches completely
  const match = list.find((p) => {
    const normPhrase = normalizeText(p.phrase);
    if (normPhrase === clean) return true;
    return p.aliases.some((a) => normalizeText(a) === clean);
  });

  return match || null;
}
