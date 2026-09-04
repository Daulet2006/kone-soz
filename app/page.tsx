"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { Phrase, VoiceState } from "@/types/phrase";
import { findPhrase } from "@/lib/phrases/search";
import { SpeechRecognitionService } from "@/lib/speech/recognition";
import { speakKazakh, stopKazakh } from "@/lib/speech/synthesis";
import { SpeakingAvatar } from "@/components/voice/SpeakingAvatar";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { PhraseResult } from "@/components/result/PhraseResult";
import { History } from "@/components/history/History";

export default function Home() {
 const [state,setState]=useState<VoiceState>("idle"),[transcript,setTranscript]=useState(""),[result,setResult]=useState<Phrase|null>(null),[error,setError]=useState(""),[history,setHistory]=useState<Phrase[]>([]),[level,setLevel]=useState(0);
 const recognition=useRef<SpeechRecognitionService|null>(null),stream=useRef<MediaStream|null>(null);
 useEffect(()=>{recognition.current=new SpeechRecognitionService();try{setHistory(JSON.parse(localStorage.getItem("taza-history")||"[]"))}catch{} return()=>stream.current?.getTracks().forEach(t=>t.stop())},[]);
 const save=(p:Phrase)=>setHistory(old=>{const n=[p,...old.filter(x=>x.id!==p.id)].slice(0,4);localStorage.setItem("taza-history",JSON.stringify(n));return n});
 const present=(p:Phrase)=>{setResult(p);save(p);setState("speaking");speakKazakh(`${p.phrase}. ${p.meaning}. ${p.explanation}`,()=>setState("complete"))};
 const processText=async(text:string)=>{setState("processing");const found=findPhrase(text);if(found)return present(found);try{const r=await fetch("/api/explain",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})}),d=await r.json();if(!r.ok)throw new Error(d.error);present(d)}catch(e){setError(e instanceof Error?e.message:"Бір нәрсе дұрыс болмады.");setState("error")}};
 const start=async()=>{setError("");setResult(null);setTranscript("");if(!recognition.current?.supported()){setError("Бұл браузерде дауыс тану қолдау таппайды.");return setState("error")}try{stream.current=await navigator.mediaDevices.getUserMedia({audio:true});const audio=new AudioContext(),analyser=audio.createAnalyser(),source=audio.createMediaStreamSource(stream.current),data=new Uint8Array(analyser.frequencyBinCount);source.connect(analyser);setState("listening");const tick=()=>{analyser.getByteFrequencyData(data);setLevel(data.reduce((a,b)=>a+b,0)/data.length/255);requestAnimationFrame(tick)};tick();recognition.current.start(({transcript})=>setTranscript(transcript),msg=>{stream.current?.getTracks().forEach(t=>t.stop());setError(msg);setState("error")})}catch{setError("Микрофонға рұқсат беріңіз.");setState("error")}};
 const toggle=()=>{if(state==="listening"){recognition.current?.stop();stream.current?.getTracks().forEach(t=>t.stop());transcript?processText(transcript):(setError("Дауыс танылмады. Қайтадан көріңіз."),setState("error"))}else start()};
 const label=state==="listening"?"Тыңдап тұрмын...":state==="processing"?"Мағынасын іздеп тұрмын...":state==="speaking"?"Түсіндіріп берейін...":state==="error"?"Қайтадан көріңіз":"Қазақтың сөзін айтып көріңіз";
 const stopSpeech=()=>{stopKazakh();setState("complete")}; const newQuery=()=>{stopKazakh();setResult(null);setTranscript("");setError("");setState("idle")};
 return <main><header><span className="mark">◒</span><span>ТАЗА ҚАЗАҚША</span><small>СӨЗДІҢ ТІРІ МАҒЫНАСЫ</small></header><div className="ambient a"/><div className="ambient b"/><section className="stage"><p className="status">{label}</p><SpeakingAvatar state={state} level={level}/><AnimatePresence>{state==="listening"&&<div className="waves">{Array.from({length:23}).map((_,i)=><i key={i} style={{height:`${18+(i*13%48)+level*54}px`,animationDelay:`${i*.035}s`}}/>)}</div>}</AnimatePresence><VoiceButton listening={state==="listening"} onClick={toggle}/>{state==="speaking"&&<button className="stop-speech" onClick={stopSpeech}>■ Дауысты тоқтату</button>}<p className="hint">{state==="idle"?"Микрофонды басып, фразаны айтыңыз":transcript||"Даусыңызды тыңдап тұрмын"}</p>{error&&<p className="error">{error}</p>}</section><AnimatePresence>{result&&<PhraseResult phrase={result} onReplay={()=>{setState("speaking");speakKazakh(`${result.meaning}. ${result.explanation}`,()=>setState("complete"))}} onNew={newQuery}/>}</AnimatePresence><History items={history} onChoose={present}/><footer>Қазақ тілінің көркем сөздері — бір ауызда бір әлем.</footer></main>
}
