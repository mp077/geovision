"""
POST /api/v1/identify  — classify an uploaded image
POST /api/v1/identify/explain — classify + generate Grad-CAM
"""
import uuid
import io
import logging
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from backend.app.services import inference as svc
from backend.app.database.db import get_db
from backend.app.models.scan import ScanRecord

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1")

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


def _validate_upload(file: UploadFile):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {file.content_type}. Use JPG, PNG, or WebP.",
        )


async def _read_bytes(file: UploadFile) -> bytes:
    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 25 MB limit.")
    # Basic magic-byte check
    if not (data[:3] == b"\xff\xd8\xff" or  # JPEG
            data[:8] == b"\x89PNG\r\n\x1a\n" or  # PNG
            data[:4] in (b"RIFF", b"WEBP")):  # WebP (RIFF header)
        # Allow WebP by also checking offset 8
        if data[8:12] != b"WEBP":
            raise HTTPException(status_code=400, detail="File content does not match a supported image format.")
    return data


def _save_upload(data: bytes, ext: str, scan_id: str) -> tuple[str, str]:
    """Save upload bytes, return (file_path, public_url)."""
    uploads_dir = svc.UPLOADS_DIR
    fname = f"{scan_id}{ext}"
    fpath = uploads_dir / fname
    fpath.write_bytes(data)
    url = f"/api/v1/static/uploads/{fname}"
    return str(fpath), url


def _build_scan_record(scan_id: str, result: dict, image_url: str, image_path: str,
                       gradcam_url: str | None, input_method: str = "upload") -> ScanRecord:
    candidates = result.get("top_candidates", [])
    return ScanRecord(
        id=scan_id,
        common_name=result.get("predicted_class", "Unknown"),
        scientific_name=result.get("scientific_name", ""),
        category=result.get("category", "Mineral"),
        confidence=result.get("confidence", 0.0),
        captured_at=datetime.utcnow(),
        input_method=input_method,
        image_url=image_url,
        image_path=image_path,
        gradcam_url=gradcam_url,
        top_candidates=candidates,
        characteristics={
            "mohsHardness": "—",
            "luster": "—",
            "density": "—",
            "cleavageFracture": "—",
            "occurrence": "—",
            "diagnosticFeatures": [],
        },
        status="analyzed",
        model_version=result.get("model_version", "v1.0.0"),
        inference_time_ms=result.get("inference_time_ms"),
    )


@router.post("/identify")
async def identify(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    _validate_upload(file)
    data = await _read_bytes(file)

    result = svc.classify_image(data)

    if result.get("status") == "model_unavailable":
        return JSONResponse(
            status_code=503,
            content={
                "status": "model_unavailable",
                "error": result.get("error", "Model not loaded"),
                "message": "Train the classification model first. See ml/classification/train.py",
            },
        )

    scan_id = f"GEO-{uuid.uuid4().hex[:6].upper()}"
    ext = Path(file.filename or "upload.jpg").suffix or ".jpg"
    image_path, image_url = _save_upload(data, ext, scan_id)

    record = _build_scan_record(scan_id, result, image_url, image_path, None)
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        **result,
        "id": scan_id,
        "image_url": image_url,
        "gradcam_url": None,
    }


@router.post("/identify/explain")
async def identify_with_gradcam(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    _validate_upload(file)
    data = await _read_bytes(file)

    result = svc.classify_image(data)

    if result.get("status") == "model_unavailable":
        return JSONResponse(
            status_code=503,
            content={
                "status": "model_unavailable",
                "error": result.get("error", "Model not loaded"),
            },
        )

    scan_id = f"GEO-{uuid.uuid4().hex[:6].upper()}"
    ext = Path(file.filename or "upload.jpg").suffix or ".jpg"
    image_path, image_url = _save_upload(data, ext, scan_id)

    gradcam_url = svc.generate_gradcam(data, result.get("predicted_class", ""))

    record = _build_scan_record(scan_id, result, image_url, image_path, gradcam_url)
    db.add(record)
    db.commit()

    return {
        **result,
        "id": scan_id,
        "image_url": image_url,
        "gradcam_url": gradcam_url,
    }
