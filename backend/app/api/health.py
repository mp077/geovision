from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/api/v1")


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "GeoVision AI Backend",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
