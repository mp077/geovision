"""
POST /api/v1/scanner/detect  — detect rocks in a base64-encoded or uploaded frame
POST /api/v1/scanner/capture — save a captured frame to history
"""
import uuid
import base64
import io
import logging
from datetime import datetime

from fastapi import APIRouter, Body, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.services import inference as svc
from backend.app.database.db import get_db
from backend.app.models.scan import ScanRecord

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1")


@router.post("/scanner/detect")
async def scanner_detect(payload: dict = Body(...)):
    """
    Accepts JSON: { "frame": "<base64-encoded JPEG>" }
    Returns real detection boxes using OpenCV contour segmentation.
    """
    frame_b64 = payload.get("frame")
    if not frame_b64:
        raise HTTPException(status_code=400, detail="Missing 'frame' field in request body.")

    # Strip data-URL prefix if present
    if "," in frame_b64:
        frame_b64 = frame_b64.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(frame_b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 frame data.")

    result = svc.detect_in_frame(image_bytes)

    # Map internal 'class' key to 'class_name' for schema compat
    for box in result.get("boxes", []):
        box["class_name"] = box.pop("class", "Rock specimen")

    return result


@router.post("/scanner/capture")
async def scanner_capture(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
):
    """
    Save a captured scanner frame (base64) to history.
    Runs classification on the frame and saves the scan record.
    Accepts: { "frame": "<b64>", "notes": "..." }
    """
    frame_b64 = payload.get("frame")
    notes = payload.get("notes", "")

    if not frame_b64:
        raise HTTPException(status_code=400, detail="Missing 'frame' field.")

    if "," in frame_b64:
        frame_b64 = frame_b64.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(frame_b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 data.")

    result = svc.classify_image(image_bytes)

    scan_id = f"SCAN-{uuid.uuid4().hex[:6].upper()}"
    fname = f"{scan_id}.jpg"
    fpath = svc.UPLOADS_DIR / fname
    fpath.write_bytes(image_bytes)
    image_url = f"/api/v1/static/uploads/{fname}"

    if result.get("status") == "success":
        record = ScanRecord(
            id=scan_id,
            common_name=result.get("predicted_class", "Unknown"),
            scientific_name=result.get("scientific_name", ""),
            category=result.get("category", "Mineral"),
            confidence=result.get("confidence", 0.0),
            captured_at=datetime.utcnow(),
            input_method="scanner",
            image_url=image_url,
            image_path=str(fpath),
            notes=notes,
            top_candidates=result.get("top_candidates", []),
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
    else:
        # Save with unavailable status even if model not ready
        record = ScanRecord(
            id=scan_id,
            common_name="Unidentified",
            category="Mineral",
            confidence=0.0,
            captured_at=datetime.utcnow(),
            input_method="scanner",
            image_url=image_url,
            image_path=str(fpath),
            notes=notes,
            status="flagged",
            model_version="none",
        )

    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "status": "saved",
        "id": scan_id,
        "image_url": image_url,
        "inference": result,
    }
