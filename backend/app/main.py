"""
GeoVision AI — FastAPI Backend Entry Point

Start with:
    uvicorn backend.app.main:app --reload --port 8000
    (run from project root: c:\\Users\\Mann\\Downloads\\CV.CP)
"""
import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.app.database.db import init_db
from backend.app.api import health, model_status, identify, scanner, history, analytics, dataset

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="GeoVision AI",
    description="Geological specimen recognition backend",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files (uploaded images, grad-cam PNGs) ─────────────────────────────
ARTIFACTS_DIR = Path(__file__).parent.parent.parent / "ml" / "artifacts"
UPLOADS_DIR = ARTIFACTS_DIR / "uploads"
GRADCAM_DIR = ARTIFACTS_DIR / "gradcam"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
GRADCAM_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/api/v1/static/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
app.mount("/api/v1/static/gradcam", StaticFiles(directory=str(GRADCAM_DIR)), name="gradcam")

DATASET_DIR = Path(__file__).parent.parent.parent / "data" / "processed" / "classification" / "test"
if DATASET_DIR.exists():
    app.mount("/api/v1/static/dataset", StaticFiles(directory=str(DATASET_DIR)), name="dataset")

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(health.router)
app.include_router(model_status.router)
app.include_router(identify.router)
app.include_router(scanner.router)
app.include_router(history.router)
app.include_router(analytics.router)
app.include_router(dataset.router)

# ── DB init on startup ────────────────────────────────────────────────────────
@app.on_event("startup")
async def on_startup():
    init_db()
    logging.getLogger(__name__).info("Database initialised. GeoVision AI backend ready.")


# ── SPA Frontend (production deployment fallback) ────────────────────────────
DIST_DIR = Path(__file__).parent.parent.parent / "dist"
if DIST_DIR.exists():
    if (DIST_DIR / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API requests
        if full_path.startswith("api/"):
            return FileResponse(DIST_DIR / "index.html")
        file_candidate = DIST_DIR / full_path
        if file_candidate.is_file():
            return FileResponse(file_candidate)
        return FileResponse(DIST_DIR / "index.html")
