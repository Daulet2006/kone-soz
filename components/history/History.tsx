"use client";
import type { Phrase } from "@/types/phrase";
export function History({ items, onChoose }: { items: Phrase[]; onChoose: (p: Phrase) => void }) { if (!items.length) return null; return <aside className="history"><p className="eyebrow">СОҢҒЫ СӨЗДЕР</p>{items.slice(0, 4).map(p => <button key={p.id} onClick={() => onChoose(p)}><b>{p.phrase}</b><span>{p.meaning}</span></button>)}</aside>; }
