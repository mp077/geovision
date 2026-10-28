# Database models for GeoVision AI
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Text, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class ScanRecord(Base):
    __tablename__ = "scan_records"

    id = Column(String, primary_key=True)
    common_name = Column(String, nullable=False)
    scientific_name = Column(String, nullable=True)
    category = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    captured_at = Column(DateTime, default=datetime.utcnow)
    input_method = Column(String, default="upload")  # 'upload' | 'scanner'
    image_url = Column(String, nullable=True)
    image_path = Column(String, nullable=True)
    gradcam_url = Column(String, nullable=True)
    notes = Column(Text, default="")
    file_size = Column(String, nullable=True)
    dimensions = Column(String, nullable=True)
    top_candidates = Column(JSON, default=list)
    characteristics = Column(JSON, default=dict)
    status = Column(String, default="analyzed")
    model_version = Column(String, default="v1.0.0")
    inference_time_ms = Column(Float, nullable=True)
    location = Column(String, nullable=True)
    detection_boxes = Column(JSON, default=list)
