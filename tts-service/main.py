import os
import subprocess
import tempfile
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import edge_tts

app = FastAPI(title="Taza Qazaqsha Neural TTS")

DEFAULT_EDGE_VOICE = os.getenv("EDGE_VOICE", "kk-KZ-AigulNeural")
PIPER_VOICE = os.getenv("PIPER_VOICE", "kk_KZ-issai-high")
DATA_DIR = os.getenv("PIPER_DATA_DIR", "/voices")

class Speech(BaseModel):
    text: str
    voice: str | None = None
    rate: str | None = "+0%"

@app.get("/health")
def health():
    return {
        "status": "ok",
        "edge_voice": DEFAULT_EDGE_VOICE,
        "piper_voice": PIPER_VOICE
    }

@app.post("/synthesize")
async def synthesize(payload: Speech):
    text = payload.text.strip()
    if not text or len(text) > 1000:
        raise HTTPException(400, "Мәтін жарамсыз немесе тым ұзын.")

    voice = payload.voice or DEFAULT_EDGE_VOICE
    if voice == "daulet":
        voice = "kk-KZ-DauletNeural"
    elif voice == "aigul":
        voice = "kk-KZ-AigulNeural"

    output = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
    output.close()

    # 1. Try High Quality Neural Voice with edge-tts
    try:
        communicate = edge_tts.Communicate(text, voice, rate=payload.rate or "+0%")
        await communicate.save(output.name)
        return FileResponse(output.name, media_type="audio/mpeg", filename="speech.mp3")
    except Exception as edge_err:
        Path(output.name).unlink(missing_ok=True)
        print(f"Edge TTS error: {edge_err}, trying Piper fallback...")

    # 2. Fallback to Piper offline TTS if network is down
    wav_output = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    wav_output.close()
    try:
        subprocess.run(
            [
                "piper",
                "--model", PIPER_VOICE,
                "--data-dir", DATA_DIR,
                "--download-dir", DATA_DIR,
                "--output_file", wav_output.name
            ],
            input=text.encode("utf-8"),
            check=True,
            timeout=25,
            capture_output=True
        )
        return FileResponse(wav_output.name, media_type="audio/wav", filename="speech.wav")
    except Exception as piper_err:
        Path(wav_output.name).unlink(missing_ok=True)
        raise HTTPException(503, f"Дауыс қызметі дайын емес: {piper_err}")
