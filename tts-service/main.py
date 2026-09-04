import os, subprocess, tempfile
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
app = FastAPI(title="Taza Qazaqsha local TTS")
VOICE = os.getenv("PIPER_VOICE", "kk_KZ-issai-high")
DATA_DIR = os.getenv("PIPER_DATA_DIR", "/voices")
class Speech(BaseModel): text: str
@app.get("/health")
def health(): return {"status": "ok", "voice": VOICE}
@app.post("/synthesize")
def synthesize(payload: Speech):
    text = payload.text.strip()
    if not text or len(text) > 700: raise HTTPException(400, "Мәтін жарамсыз.")
    output = tempfile.NamedTemporaryFile(suffix=".wav", delete=False); output.close()
    try: subprocess.run(["piper", "--model", VOICE, "--data-dir", DATA_DIR, "--download-dir", DATA_DIR, "--output_file", output.name], input=text.encode("utf-8"), check=True, timeout=25, capture_output=True)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as error: Path(output.name).unlink(missing_ok=True); raise HTTPException(503, "Дауыс қызметі дайын емес.") from error
    return FileResponse(output.name, media_type="audio/wav", filename="speech.wav")
