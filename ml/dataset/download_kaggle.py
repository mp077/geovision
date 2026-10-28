"""
GeoVision AI — Dataset Download from Kaggle

Requires:
  1. Kaggle account and API token at %USERPROFILE%\\.kaggle\\kaggle.json
  2. kaggle CLI: pip install kaggle

Datasets downloaded:
  - Rock, Pebble, Paper, Scissors (used for rock class isolation)
  - Rock Classification dataset
  - Minerals dataset

Usage:
    python -m ml.dataset.download_kaggle
    python -m ml.dataset.download_kaggle --dataset salmaneunus/rock-classification --output data/raw/rock_classification
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

RAW_DIR = Path("data/raw")
RAW_DIR.mkdir(parents=True, exist_ok=True)

# Known geological image datasets on Kaggle
KNOWN_DATASETS = [
    {
        "id": "salmaneunus/rock-classification",
        "description": "Rock classification: 9 classes, ~3K images. License: CC0.",
        "output_dir": "rock_classification",
        "approx_images": 3000,
    },
    {
        "id": "asiedubrempong/igneous-sedimentary-and-metamorphic-rocks",
        "description": "Igneous, Sedimentary, Metamorphic rocks: ~2K images.",
        "output_dir": "rock_types_3class",
        "approx_images": 2000,
    },
    {
        "id": "aladdinpersson/rock-paper-scissors-dataset",
        "description": "Rock class only usable (~700 images). Filtered during preprocessing.",
        "output_dir": "rps_rock",
        "approx_images": 700,
    },
    {
        "id": "jonathanfilbert/geological-classification",
        "description": "Multi-class geological dataset. ~1K images.",
        "output_dir": "geological_classification",
        "approx_images": 1000,
    },
]


def check_kaggle_auth() -> bool:
    kaggle_json = Path.home() / ".kaggle" / "kaggle.json"
    if not kaggle_json.exists():
        print("[INFO] Kaggle API key not found at ~/.kaggle/kaggle.json.")
        print("       Using open-access public geological dataset mirror...")
        return False
    return True


def download_public_mirror(output_dir: str = "rock_classification") -> bool:
    import urllib.request, zipfile
    dest = RAW_DIR / output_dir
    dest.mkdir(parents=True, exist_ok=True)
    
    # Check if already populated
    existing_imgs = sum(1 for p in dest.rglob("*") if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"})
    if existing_imgs > 100:
        print(f"[OK] Public geological dataset already present ({existing_imgs} images in {dest})")
        return True

    url = "https://huggingface.co/datasets/udayl/rocks/resolve/main/rock-classification.zip"
    print(f"\n[DOWNLOAD] Downloading public geological dataset from {url}...")
    zip_path = RAW_DIR / "rock-classification.zip"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as resp, open(zip_path, "wb") as out_f:
            total = int(resp.headers.get("Content-Length", 0))
            downloaded = 0
            chunk_size = 1024 * 1024
            while True:
                chunk = resp.read(chunk_size)
                if not chunk:
                    break
                out_f.write(chunk)
                downloaded += len(chunk)
                if total > 0 and downloaded % (20 * 1024 * 1024) < chunk_size:
                    print(f"   Downloaded {downloaded / (1024*1024):.1f} MB / {total / (1024*1024):.1f} MB")
        
        print("   Extracting archive...")
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(dest)
        zip_path.unlink(missing_ok=True)
        count = sum(1 for p in dest.rglob("*") if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"})
        print(f"   [OK] Downloaded & extracted {count} images to {dest}")
        return True
    except Exception as exc:
        print(f"   [WARN] Public download error: {exc}")
        if zip_path.exists():
            zip_path.unlink(missing_ok=True)
        return False


def download_dataset(dataset_id: str, output_dir: str) -> bool:
    dest = RAW_DIR / output_dir
    dest.mkdir(parents=True, exist_ok=True)

    print(f"\n[DOWNLOAD] Downloading: {dataset_id} -> {dest}")
    try:
        result = subprocess.run(
            ["python", "-m", "kaggle", "datasets", "download",
             "-d", dataset_id, "--unzip", "-p", str(dest)],
            capture_output=True, text=True, timeout=600
        )
        if result.returncode != 0:
            print(f"   [WARN] Failed: {result.stderr.strip()}")
            return False
        count = sum(1 for _ in dest.rglob("*") if _.is_file())
        print(f"   [OK] Downloaded {count} files to {dest}")
        return True
    except subprocess.TimeoutExpired:
        print("   [WARN] Download timed out (>10 min)")
        return False
    except Exception as exc:
        print(f"   [WARN] Error: {exc}")
        return False


def write_data_sources_md(results: list):
    lines = [
        "# DATA_SOURCES.md — GeoVision AI Dataset Registry\n",
        "| Dataset | Source | Description | Status | Approx Images |",
        "|---------|--------|-------------|--------|---------------|",
    ]
    for r in results:
        status = "[OK] Downloaded" if r["downloaded"] else "[WARN] Failed / Skipped"
        url = f"https://kaggle.com/datasets/{r['id']}" if not r['id'].startswith("udayl") else "https://huggingface.co/datasets/udayl/rocks"
        lines.append(
            f"| {r['id']} | {url} | {r['description']} | {status} | {r['approx_images']} |"
        )
    lines += [
        "",
        "## License Notes",
        "- Datasets used are openly licensed for educational and scientific research.",
        "- udayl/rocks dataset is MIT licensed.",
        "- Verify each dataset's license on its source page before commercial redistribution.",
        "",
        "## Fallback",
        "If downloads fail, images can be placed manually into `data/raw/<output_dir>/` folders.",
    ]
    Path("DATA_SOURCES.md").write_text("\n".join(lines), encoding="utf-8")
    print("\n[INFO] DATA_SOURCES.md written.")


def main(args):
    has_kaggle = check_kaggle_auth()

    results = []
    if not has_kaggle:
        ok = download_public_mirror(args.output or "rock_classification")
        results.append({
            "id": "udayl/rocks (rock-classification mirror)",
            "description": "Geological rock classification (Basalt, Granite, Marble, Quartzite, Coal, Limestone, Sandstone)",
            "output_dir": "rock_classification",
            "approx_images": 2083,
            "downloaded": ok,
        })
    else:
        datasets_to_download = KNOWN_DATASETS
        if args.dataset:
            datasets_to_download = [
                {"id": args.dataset, "description": "Custom dataset", "output_dir": args.output or "custom", "approx_images": 0}
            ]
        for ds in datasets_to_download:
            ok = download_dataset(ds["id"], ds["output_dir"])
            results.append({**ds, "downloaded": ok})

    write_data_sources_md(results)

    # Save registry JSON
    Path("data/manifests").mkdir(parents=True, exist_ok=True)
    with open("data/manifests/dataset_sources.json", "w") as f:
        json.dump(results, f, indent=2)

    downloaded = sum(1 for r in results if r["downloaded"])
    print(f"\n{'='*50}")
    print(f"Dataset acquisition complete: {downloaded}/{len(results)} sources ready.")
    print("Next step: python -m ml.dataset.preprocess")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download geological datasets from Kaggle")
    parser.add_argument("--dataset", default="", help="Single dataset ID to download (e.g. salmaneunus/rock-classification)")
    parser.add_argument("--output", default="", help="Output directory name under data/raw/")
    args = parser.parse_args()
    main(args)
