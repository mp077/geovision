# Pydantic schemas for API request/response validation
from typing import Optional, List
from pydantic import BaseModel


class CandidateSchema(BaseModel):
    name: str
    category: str
    confidence: float
    mohsHardness: str = "—"
    description: str = ""


class IdentifyResponse(BaseModel):
    id: str
    status: str  # "success" | "model_unavailable" | "error"
    predicted_class: Optional[str] = None
    scientific_name: Optional[str] = None
    category: Optional[str] = None
    confidence: Optional[float] = None
    top_candidates: List[CandidateSchema] = []
    gradcam_url: Optional[str] = None
    image_url: Optional[str] = None
    low_confidence: bool = False
    inference_time_ms: Optional[float] = None
    model_version: Optional[str] = None
    error: Optional[str] = None


class DetectionBox(BaseModel):
    x: int
    y: int
    width: int
    height: int
    confidence: float
    class_name: str = ""
    label: str = ""


class DetectResponse(BaseModel):
    status: str
    method: str = "contour_segmentation"
    boxes: List[DetectionBox] = []
    latency_ms: Optional[float] = None
    frame_width: Optional[int] = None
    frame_height: Optional[int] = None
    error: Optional[str] = None


class HistoryRecord(BaseModel):
    id: str
    commonName: str
    scientificName: Optional[str] = None
    category: str
    confidence: float
    capturedAt: str
    inputMethod: str
    imageUrl: Optional[str] = None
    gradCamUrl: Optional[str] = None
    notes: str = ""
    fileSize: Optional[str] = None
    dimensions: Optional[str] = None
    topCandidates: List[CandidateSchema] = []
    characteristics: dict = {}
    status: str = "analyzed"
    modelVersion: str = "v1.0.0"
    inferencetime_ms: Optional[float] = None


class ModelStatusResponse(BaseModel):
    classifier: str  # "available" | "unavailable"
    detector: str
    model_version: str
    num_classes: int
    classes: List[str] = []
    error: Optional[str] = None
