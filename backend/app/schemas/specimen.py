from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class CandidatePrediction(BaseModel):
    name: str
    category: str
    confidence: float
    mohsHardness: str
    description: str

class PhysicalCharacteristics(BaseModel):
    mohsHardness: str
    crystalSystem: Optional[str] = None
    chemicalFormula: Optional[str] = None
    luster: str
    cleavageFracture: str
    density: str
    streak: Optional[str] = None
    occurrence: Optional[str] = None
    diagnosticFeatures: List[str] = Field(default_factory=list)

class IdentifyResponse(BaseModel):
    predicted_class: str
    scientific_name: str
    category: str
    confidence: float
    top_candidates: List[CandidatePrediction]
    characteristics: PhysicalCharacteristics
    gradcam_base64: Optional[str] = None
    gradcam_url: Optional[str] = None
    model_version: str
    latency_ms: float
    uncertainty_flag: bool = False
    warning: Optional[str] = None

class DetectedSpecimen(BaseModel):
    id: str
    box: List[int] = Field(description="[x, y, width, height] normalized or pixel")
    normalized_box: List[float] = Field(description="[x, y, w, h] in 0.0 to 1.0 range")
    class_name: str
    category: str
    confidence: float
    mohsHardness: str

class ScannerDetectResponse(BaseModel):
    specimens: List[DetectedSpecimen]
    specimen_count: int
    latency_ms: float
    status: str
    frame_timestamp: str

class SpecimenHistoryItem(BaseModel):
    id: str
    commonName: str
    scientificName: str
    category: str
    confidence: float
    capturedAt: str
    inputMethod: str
    imageUrl: str
    gradCamUrl: Optional[str] = None
    notes: str
    modelVersion: str
    characteristics: Dict[str, Any]
    dimensions: Optional[str] = None
    fileSize: Optional[str] = None

class HistoryListResponse(BaseModel):
    items: List[SpecimenHistoryItem]
    total: int

class UpdateNotesRequest(BaseModel):
    notes: str
