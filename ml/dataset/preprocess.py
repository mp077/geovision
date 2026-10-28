"""
GeoVision AI — Dataset Preprocessing Pipeline

Performs:
  1. Image validation (integrity, magic bytes, minimum resolution)
  2. EXIF orientation correction
  3. RGB conversion
  4. Exact duplicate detection (SHA-256 hash)
  5. Near-duplicate detection (perceptual hash via imagehash)
  6. Class label normalization
  7. 70/15/15 train/val/test split
  8. Manifest CSVs generation

Usage:
    python -m ml.dataset.preprocess
    python -m ml.dataset.preprocess --raw-dir data/raw --out-dir data/processed/classification --min-size 64
"""

import argparse
import csv
import hashlib
import io
import json
import os
import random
import shutil
import sys
from collections import defaultdict
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import imagehash
from PIL import Image, ExifTags, UnidentifiedImageError

SEED = 42
PHASH_THRESHOLD = 8  # perceptual hash distance threshold for near-duplicate


def compute_sha256(path: Path) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def compute_phash(pil_img: Image.Image) -> str:
    return str(imagehash.phash(pil_img))


def fix_exif_orientation(img: Image.Image) -> Image.Image:
    try:
        exif = img._getexif()
        if exif is None:
            return img
        for tag, val in exif.items():
            if ExifTags.TAGS.get(tag) == "Orientation":
                if val == 3:
                    img = img.rotate(180, expand=True)
                elif val == 6:
                    img = img.rotate(270, expand=True)
                elif val == 8:
                    img = img.rotate(90, expand=True)
                break
    except Exception:
        pass
    return img


def validate_image(path: Path, min_size: int) -> tuple[bool, str, Image.Image | None]:
    try:
        img = Image.open(path)
        img.verify()  # Check integrity
        img = Image.open(path)  # Re-open after verify
    except UnidentifiedImageError:
        return False, "unidentified_format", None
    except Exception as e:
        return False, f"corrupt: {e}", None

    img = fix_exif_orientation(img).convert("RGB")
    w, h = img.size
    if w < min_size or h < min_size:
        return False, f"too_small: {w}x{h}", None

    return True, "ok", img


def normalize_label(label: str) -> str:
    return label.lower().strip().replace(" ", "_").replace("-", "_")


def split_paths(paths: list, train=0.70, val=0.15, test=0.15) -> tuple[list, list, list]:
    random.shuffle(paths)
    n = len(paths)
    n_train = int(n * train)
    n_val = int(n * val)
    return paths[:n_train], paths[n_train:n_train + n_val], paths[n_train + n_val:]


def copy_to_split(paths: list, dest_dir: Path, class_name: str):
    class_dir = dest_dir / class_name
    class_dir.mkdir(parents=True, exist_ok=True)
    for src in paths:
        shutil.copy2(str(src), str(class_dir / src.name))


def find_image_files(raw_dir: Path) -> list[Path]:
    exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}
    return [p for p in raw_dir.rglob("*") if p.suffix.lower() in exts]


def main(args):
    random.seed(SEED)
    raw_dir = Path(args.raw_dir)
    out_dir = Path(args.out_dir)
    manifest_dir = Path("data/manifests")
    manifest_dir.mkdir(parents=True, exist_ok=True)

    if not raw_dir.exists():
        print(f"[ERROR] Raw data directory not found: {raw_dir}")
        print("        Run: python -m ml.dataset.download_kaggle first.")
        sys.exit(1)

    print(f"\n[INFO] Scanning {raw_dir} for images...")
    all_files = find_image_files(raw_dir)
    print(f"       Found {len(all_files)} candidate files.")

    seen_sha = {}        # sha256 -> path
    seen_phash = {}      # phash_str -> (path, phash_obj)
    all_records = []
    rejected_records = []

    # Group by class label (parent folder name)
    class_valid: dict[str, list[Path]] = defaultdict(list)

    for idx, fpath in enumerate(all_files):
        if idx % 500 == 0:
            print(f"       Processing {idx}/{len(all_files)}...")

        # Validate
        valid, reason, img = validate_image(fpath, args.min_size)
        if not valid:
            rejected_records.append({"path": str(fpath), "reason": reason})
            continue

        # Determine class label from immediate parent directory
        label = normalize_label(fpath.parent.name)

        # Exact duplicate check
        sha = compute_sha256(fpath)
        if sha in seen_sha:
            rejected_records.append({"path": str(fpath), "reason": "exact_duplicate", "duplicate_of": str(seen_sha[sha])})
            continue
        seen_sha[sha] = fpath

        # Perceptual duplicate check
        ph = imagehash.phash(img)
        ph_str = str(ph)
        near_dup = False
        for existing_str, (existing_path, existing_ph) in seen_phash.items():
            if abs(ph - existing_ph) <= PHASH_THRESHOLD:
                rejected_records.append({"path": str(fpath), "reason": "near_duplicate", "duplicate_of": str(existing_path)})
                near_dup = True
                break
        if near_dup:
            continue
        seen_phash[ph_str] = (fpath, ph)

        w, h = img.size
        record = {
            "path": str(fpath),
            "label": label,
            "sha256": sha,
            "phash": ph_str,
            "width": w,
            "height": h,
            "format": fpath.suffix.lower(),
            "size_bytes": fpath.stat().st_size,
        }
        all_records.append(record)
        class_valid[label].append(fpath)

    print(f"\n       Valid unique images: {len(all_records)}")
    print(f"       Rejected: {len(rejected_records)}")
    print(f"       Classes found: {len(class_valid)}")

    if len(all_records) == 0:
        print("[ERROR] No valid images found. Exiting.")
        sys.exit(1)

    # Write all_images.csv
    with open(manifest_dir / "all_images.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["path", "label", "sha256", "phash", "width", "height", "format", "size_bytes"])
        w.writeheader()
        w.writerows(all_records)

    # Write rejected_images.csv
    with open(manifest_dir / "rejected_images.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["path", "reason", "duplicate_of"])
        w.writeheader()
        for r in rejected_records:
            w.writerow({k: r.get(k, "") for k in ["path", "reason", "duplicate_of"]})

    # Class distribution
    class_dist = {cls: len(paths) for cls, paths in class_valid.items()}
    with open(manifest_dir / "class_distribution.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["class", "count"])
        for cls, cnt in sorted(class_dist.items(), key=lambda x: -x[1]):
            w.writerow([cls, cnt])
            print(f"       {cls}: {cnt} images")

    # Split and copy
    split_records = []
    for label, paths in class_valid.items():
        train_p, val_p, test_p = split_paths(paths)
        for subset, subset_paths in [("train", train_p), ("val", val_p), ("test", test_p)]:
            copy_to_split(subset_paths, out_dir / subset, label)
            for p in subset_paths:
                split_records.append({"path": str(p), "label": label, "split": subset})

    with open(manifest_dir / "split_manifest.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["path", "label", "split"])
        w.writeheader()
        w.writerows(split_records)

    # Export comprehensive Excel workbook (.xlsx)
    try:
        from ml.dataset.export_excel import export_dataset_to_excel
        excel_path = export_dataset_to_excel(
            manifest_dir=manifest_dir,
            output_excel_path=manifest_dir / "dataset_manifest.xlsx",
            all_records=all_records,
            split_records=split_records,
            class_dist=class_dist,
            rejected_records=rejected_records,
        )
        print(f"     Dataset Excel exported: {excel_path}")
    except Exception as e:
        print(f"[WARN] Could not export Excel manifest: {e}")

    print(f"\n[OK] Preprocessing complete.")
    print(f"     Train: {sum(1 for r in split_records if r['split'] == 'train')}")
    print(f"     Val:   {sum(1 for r in split_records if r['split'] == 'val')}")
    print(f"     Test:  {sum(1 for r in split_records if r['split'] == 'test')}")
    print(f"     Output: {out_dir}")
    print(f"\nNext step: python -m ml.classification.train")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GeoVision AI — Dataset Preprocessing")
    parser.add_argument("--raw-dir", default="data/raw")
    parser.add_argument("--out-dir", default="data/processed/classification")
    parser.add_argument("--min-size", type=int, default=64, help="Minimum image dimension in pixels")
    args = parser.parse_args()
    main(args)
