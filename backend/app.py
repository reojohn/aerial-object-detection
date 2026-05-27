import os
import shutil
import time
from pathlib import Path
from typing import Dict, List, Optional

import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import Request

BASE_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = BASE_DIR / "backend"
UPLOAD_DIR = BACKEND_DIR / "uploads"
OUTPUT_DIR = BACKEND_DIR / "outputs"
MODEL_PATH = BASE_DIR / "model" / "best.pt"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
VIDEO_EXTS = {".mp4", ".avi", ".mov", ".mkv"}
TARGET_CLASSES = ["human", "soldier", "drone", "quadcopter"]
ALIASES = {
    "person": "human",
    "people": "human",
    "civilian": "human",
    "uav": "drone",
    "quad copter": "quadcopter",
    "quad-copter": "quadcopter",
    "quad_copter": "quadcopter",
}

app = FastAPI(title="Aerial Threat Detection YOLOv8 Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/outputs", StaticFiles(directory=str(OUTPUT_DIR)), name="outputs")

app.mount("/", StaticFiles(directory=str(BASE_DIR / "dist"), html=True), name="frontend")

MODEL: Optional[YOLO] = None

def get_model() -> YOLO:
    global MODEL
    if not MODEL_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Model not found. Put your trained 4-class model at: {MODEL_PATH}",
        )
    if MODEL is None:
        MODEL = YOLO(str(MODEL_PATH))
    return MODEL

def safe_name(filename: str) -> str:
    cleaned = "".join(ch if ch.isalnum() or ch in "._-" else "_" for ch in filename)
    return cleaned[:180] or "upload"

def empty_summary() -> Dict[str, int]:
    return {name: 0 for name in TARGET_CLASSES}

def normalize_class(name: str) -> str:
    value = str(name).strip().lower()
    return ALIASES.get(value, value)

def summarize(results) -> Dict[str, int]:
    summary = empty_summary()
    for result in results:
        if result.boxes is None:
            continue
        names = result.names or {}
        for cls_tensor in result.boxes.cls:
            cls_id = int(cls_tensor.item())
            cls_name = normalize_class(names.get(cls_id, str(cls_id)))
            if cls_name not in summary:
                summary[cls_name] = 0
            summary[cls_name] += 1
    return summary

def find_latest_output(run_dir: Path, source_ext: str) -> Optional[Path]:
    candidates: List[Path] = []
    for root, _dirs, files in os.walk(run_dir):
        for file in files:
            path = Path(root) / file
            suffix = path.suffix.lower()
            if source_ext in IMAGE_EXTS and suffix in IMAGE_EXTS:
                candidates.append(path)
            elif source_ext in VIDEO_EXTS and suffix in VIDEO_EXTS:
                candidates.append(path)
            elif source_ext in VIDEO_EXTS and suffix == ".avi":
                candidates.append(path)
    if not candidates:
        return None
    return max(candidates, key=lambda p: p.stat().st_mtime)

@app.get("/")
def health_check():
    model_names = None
    if MODEL_PATH.exists():
        try:
            model_names = get_model().names
        except Exception:
            model_names = None
    return {
        "status": "running",
        "model_exists": MODEL_PATH.exists(),
        "model_path": str(MODEL_PATH),
        "target_classes": TARGET_CLASSES,
        "model_names": model_names,
    }

@app.post("/detect")
async def detect(file: UploadFile = File(...), confidence: float = Form(0.25)):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in IMAGE_EXTS and suffix not in VIDEO_EXTS:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use JPG, PNG, WEBP, MP4, AVI, MOV, or MKV.")
    if confidence < 0.05 or confidence > 0.95:
        raise HTTPException(status_code=400, detail="Confidence must be between 0.05 and 0.95.")

    model = get_model()
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{safe_name(file.filename or 'upload' + suffix)}"
    input_path = UPLOAD_DIR / filename
    with input_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    run_name = f"detection_{timestamp}"
    try:
        results = model.predict(
            source=str(input_path),
            conf=confidence,
            save=True,
            project=str(OUTPUT_DIR),
            name=run_name,
            exist_ok=True,
            verbose=False,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"YOLOv8 detection failed: {exc}")

    run_dir = OUTPUT_DIR / run_name
    output_file = find_latest_output(run_dir, suffix)
    if output_file is None:
        raise HTTPException(status_code=500, detail="Detection finished, but no output preview file was found.")

    relative_output = output_file.relative_to(OUTPUT_DIR).as_posix()
    return {
        "success": True,
        "summary": summarize(results),
        "output_url": f"/outputs/{relative_output}",
        "output_path": str(output_file),
        "confidence": confidence,
        "classes": TARGET_CLASSES,
        "model_names": model.names,
    }

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=10000)
