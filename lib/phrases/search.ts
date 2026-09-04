import Fuse from "fuse.js";
import phrases from "@/data/phrases.json";
import type { Phrase } from "@/types/phrase";

const list = phrases as Phrase[];
const fuse = new Fuse(list, { keys: ["phrase", "aliases"], threshold: 0.42, ignoreLocation: true, minMatchCharLength: 3 });
export function findPhrase(query: string) {
  const clean = query.toLocaleLowerCase("kk-KZ").replace(/[?!,.]/g, " ").replace(/деген не|дегенім|мағынасы|айтшы/g, "").trim();
  const direct = list.find(p => [p.phrase, ...p.aliases].some(x => clean.includes(x)));
  return direct || fuse.search(clean)[0]?.item || null;
}
