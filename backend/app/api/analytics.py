"""
GET /api/v1/analytics/summary    — aggregate stats for the dashboard
GET /api/v1/analytics/evaluation — model evaluation metrics (if trained)
"""
import json
from pathlib import Path
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database.db import get_db
from backend.app.models.scan import ScanRecord
from backend.app.services import inference as svc

router = APIRouter(prefix="/api/v1")
ARTIFACTS_DIR = Path(__file__).parent.parent.parent.parent / "ml" / "artifacts"
EVAL_PATH = ARTIFACTS_DIR / "eval_metrics.json"


@router.get("/analytics/summary")
def analytics_summary(db: Session = Depends(get_db)):
    total_scans = db.query(ScanRecord).count()
    upload_count = db.query(ScanRecord).filter(ScanRecord.input_method == "upload").count()
    scanner_count = db.query(ScanRecord).filter(ScanRecord.input_method == "scanner").count()
    avg_conf = db.query(func.avg(ScanRecord.confidence)).scalar() or 0.0
    ms_status = svc.model_status()

    return {
        "total_scans": total_scans,
        "upload_count": upload_count,
        "scanner_count": scanner_count,
        "avg_confidence": round(float(avg_conf), 3),
        "model_status": ms_status["classifier"],
        "model_version": ms_status["model_version"],
        "num_classes": ms_status["num_classes"],
    }


@router.get("/analytics/evaluation")
def analytics_evaluation():
    if EVAL_PATH.exists():
        with open(EVAL_PATH) as f:
            data = json.load(f)
        return {"status": "available", "metrics": data}
    return {
        "status": "unavailable",
        "message": "Run ml/classification/evaluate.py after training to generate evaluation metrics.",
    }
