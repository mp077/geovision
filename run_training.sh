#!/usr/bin/env bash
# GeoVision AI — Download Dataset + Preprocess + Train Pipeline
# Run from project root

set -e

EPOCHS=${1:-30}
BATCH_SIZE=${2:-32}

echo "=== GeoVision AI — Training Pipeline ==="
echo ""

echo "[1/4] Acquiring geological dataset..."
python -m ml.dataset.download_kaggle

echo ""
echo "[2/4] Preprocessing dataset (cleaning, deduplication, 70/15/15 split)..."
python -m ml.dataset.preprocess --raw-dir data/raw --out-dir data/processed/classification

echo ""
echo "[3/4] Training MobileNetV2 classifier..."
python -m ml.classification.train --data-dir data/processed/classification --epochs "$EPOCHS" --batch-size "$BATCH_SIZE"

echo ""
echo "[4/4] Evaluating model on test split..."
python -m ml.classification.evaluate

echo ""
echo "=== Training pipeline complete! ==="
echo "Model checkpoint: ml/artifacts/model_best.pt"
echo "Class mapping:    ml/artifacts/class_to_idx.json"
echo "Metrics report:   ml/artifacts/eval_metrics.json"
