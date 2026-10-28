from fastapi import APIRouter
from backend.app.services import inference as svc

router = APIRouter(prefix="/api/v1")


@router.get("/model/status")
async def get_model_status():
    return svc.model_status()
