import datetime
from sqlalchemy import Column, String, Float, DateTime, Text
from backend.app.database.session import Base

class SpecimenHistoryModel(Base):
    __tablename__ = "specimen_history"

    id = Column(String(50), primary_key=True, index=True)
    common_name = Column(String(100), nullable=False)
    scientific_name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    captured_at = Column(String(50), default=lambda: datetime.datetime.utcnow().isoformat())
    input_method = Column(String(20), default="upload")  # "upload" or "scanner"
    image_url = Column(String(500), nullable=False)
    gradcam_url = Column(String(500), nullable=True)
    notes = Column(Text, default="")
    model_version = Column(String(50), default="v1.0-geovision-mobilenet")
    characteristics_json = Column(Text, default="{}")
    dimensions = Column(String(50), default="512x512")
    file_size = Column(String(50), default="1.5 MB")
