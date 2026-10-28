"""
GeoVision AI — Dataset Endpoints & Excel Download

GET /api/v1/dataset/stats         — Summary statistics of processed dataset
GET /api/v1/dataset/download      — Download the dataset Excel file (.xlsx)
"""

from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import pandas as pd

router = APIRouter(prefix="/api/v1/dataset", tags=["dataset"])

PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
MANIFEST_DIR = PROJECT_ROOT / "data" / "manifests"
EXCEL_PATH = MANIFEST_DIR / "dataset_manifest.xlsx"
FALLBACK_EXCEL = PROJECT_ROOT / "data" / "dataset.xlsx"


@router.get("/stats")
def get_dataset_stats():
    """Returns dataset summary stats parsed from manifests."""
    class_dist_csv = MANIFEST_DIR / "class_distribution.csv"
    all_csv = MANIFEST_DIR / "all_images.csv"
    splits_csv = MANIFEST_DIR / "split_manifest.csv"
    rejected_csv = MANIFEST_DIR / "rejected_images.csv"

    classes = []
    total_images = 0
    if class_dist_csv.exists():
        df_dist = pd.read_csv(class_dist_csv)
        classes = df_dist.to_dict(orient="records")
        total_images = int(df_dist["count"].sum())

    train_count, val_count, test_count = 0, 0, 0
    if splits_csv.exists():
        df_splits = pd.read_csv(splits_csv)
        counts = df_splits["split"].value_counts().to_dict()
        train_count = int(counts.get("train", 0))
        val_count = int(counts.get("val", 0))
        test_count = int(counts.get("test", 0))

    rejected_count = 0
    if rejected_csv.exists():
        df_rej = pd.read_csv(rejected_csv)
        rejected_count = len(df_rej)

    excel_available = EXCEL_PATH.exists() or FALLBACK_EXCEL.exists()

    return {
        "status": "ready",
        "totalImages": total_images,
        "classes": classes,
        "splits": {
            "train": train_count,
            "val": val_count,
            "test": test_count
        },
        "rejectedCount": rejected_count,
        "excelAvailable": excel_available,
        "excelFilename": "geovision_dataset_manifest.xlsx"
    }


@router.get("/download")
def download_dataset_excel():
    """Serves the generated dataset Excel file for download."""
    target_path = None
    if EXCEL_PATH.exists():
        target_path = EXCEL_PATH
    elif FALLBACK_EXCEL.exists():
        target_path = FALLBACK_EXCEL
    else:
        # Generate on the fly if needed
        try:
            from ml.dataset.export_excel import export_dataset_to_excel
            target_path = export_dataset_to_excel(
                manifest_dir=MANIFEST_DIR,
                output_excel_path=EXCEL_PATH
            )
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Dataset Excel not found and generation failed: {e}")

    if not target_path or not Path(target_path).exists():
        raise HTTPException(status_code=404, detail="Dataset Excel file not found.")

    return FileResponse(
        path=str(target_path),
        filename="geovision_dataset_manifest.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
