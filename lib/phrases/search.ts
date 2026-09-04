import phrases from "@/data/phrases.json";
import slangs from "@/data/slang.json";
import type { Phrase } from "@/types/phrase";

export const combinedList: Phrase[] = [
  ...(slangs as Phrase[]),
  ...(phrases as Phrase[]),
];

function normalizeText(str: string): string {
  return str
    .toLocaleLowerCase("kk-KZ")
    .replace(/[«»"'`.,!?;:()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function findPhrase(query: string): Phrase | null {
  const clean = normalizeText(
    query.replace(
      /деген не|дегенім|мағынасы қандай|мағынасы|айтшы|түсіндір|деген сөз|не ол|дегенді/g,
      ""
    )
  );

  if (!clean) return null;

  // 1. Strict exact match: phrase matches completely or alias matches completely
  const exactMatch = combinedList.find((p) => {
    const normPhrase = normalizeText(p.phrase);
    if (normPhrase === clean) return true;
    return p.aliases?.some((a) => normalizeText(a) === clean);
  });
  if (exactMatch) return exactMatch;

  // 2. Substring match: query contains phrase or phrase contains query
  const subMatch = combinedList.find((p) => {
    const normPhrase = normalizeText(p.phrase);
    if (clean.includes(normPhrase) || normPhrase.includes(clean)) return true;
    return p.aliases?.some((a) => {
      const normA = normalizeText(a);
      return clean.includes(normA) || normA.includes(clean);
    });
  });

  return subMatch || null;
}

export function getSamplePhrases(category?: string, limit = 8): Phrase[] {
  let list = combinedList;
  if (category && category !== "all") {
    if (category === "slang") {
      list = list.filter((p) => p.isSlang || p.category?.includes("сленг"));
    } else if (category === "ancient") {
      list = list.filter((p) => !p.isSlang && !p.category?.includes("сленг"));
    } else {
      list = list.filter((p) => p.category === category);
    }
  }
  return list.slice(0, limit);
}

