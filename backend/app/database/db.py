# Database session management
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.models.scan import Base

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "geo_vision.db")
DB_URL = f"sqlite:///{os.path.abspath(DB_PATH)}"

engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
