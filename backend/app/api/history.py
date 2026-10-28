"""
GET  /api/v1/history         — paginated list of saved scan records
GET  /api/v1/history/{id}    — single scan record
DELETE /api/v1/history/{id}  — delete a scan record
"""
from io import BytesIO
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
import pandas as pd

from backend.app.database.db import get_db
from backend.app.models.scan import ScanRecord

router = APIRouter(prefix="/api/v1")


def _record_to_dict(r: ScanRecord) -> dict:
    return {
        "id": r.id,
        "commonName": r.common_name,
        "scientificName": r.scientific_name,
        "category": r.category,
        "confidence": r.confidence,
        "capturedAt": r.captured_at.isoformat() + "Z" if r.captured_at else "",
        "inputMethod": r.input_method,
        "imageUrl": r.image_url,
        "gradCamUrl": r.gradcam_url,
        "notes": r.notes or "",
        "fileSize": r.file_size,
        "dimensions": r.dimensions,
        "topCandidates": r.top_candidates or [],
        "characteristics": r.characteristics or {
            "mohsHardness": "—",
            "luster": "—",
            "density": "—",
            "cleavageFracture": "—",
            "occurrence": "—",
            "diagnosticFeatures": [],
        },
        "status": r.status,
        "modelVersion": r.model_version,
        "inferencetime_ms": r.inference_time_ms,
    }


@router.get("/history")
def list_history(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    total = db.query(ScanRecord).count()
    records = (
        db.query(ScanRecord)
        .order_by(ScanRecord.captured_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "items": [_record_to_dict(r) for r in records],
    }


@router.get("/history/{scan_id}")
def get_history_item(scan_id: str, db: Session = Depends(get_db)):
    record = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found.")
    return _record_to_dict(record)


@router.delete("/history/{scan_id}")
def delete_history_item(scan_id: str, db: Session = Depends(get_db)):
    record = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found.")
    db.delete(record)
    db.commit()
    return {"status": "deleted", "id": scan_id}


@router.patch("/history/{scan_id}/notes")
def update_notes(scan_id: str, payload: dict, db: Session = Depends(get_db)):
    record = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found.")
    record.notes = payload.get("notes", record.notes)
    db.commit()
    return {"status": "updated", "id": scan_id}


@router.get("/history/export/excel")
def export_history_excel(db: Session = Depends(get_db)):
    """Exports all saved scan records to an Excel file."""
    records = db.query(ScanRecord).order_by(ScanRecord.captured_at.desc()).all()
    rows = []
    for r in records:
        rows.append({
            "Specimen ID": r.id,
            "Common Name": r.common_name,
            "Scientific Name": r.scientific_name or "—",
            "Category": r.category,
            "Confidence (%)": round(r.confidence * 100, 1) if r.confidence else 0,
            "Capture Date": r.captured_at.strftime("%Y-%m-%d %H:%M:%S") if r.captured_at else "",
            "Input Method": r.input_method,
            "Model Version": r.model_version or "v1.0.0",
            "Inference Time (ms)": r.inference_time_ms or 0,
            "Notes": r.notes or "",
            "File Dimensions": r.dimensions or "",
            "File Size": r.file_size or "",
        })
    df = pd.DataFrame(rows)
    buf = BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Specimen History", index=False)

    buf.seek(0)
    return Response(
        content=buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="geovision_specimens_export.xlsx"'}
    )
