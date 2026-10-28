# GeoVision AI — Download Dataset + Preprocess + Train + Evaluate
# Run from project root: c:\Users\Mann\Downloads\CV.CP
# Supports Kaggle (via kaggle.json) or public dataset mirror automatically

param(
    [switch]$SkipDownload,
    [switch]$SkipPreprocess,
    [int]$Epochs = 30,
    [int]$BatchSize = 32
)

Write-Host "=== GeoVision AI — Training Pipeline ===" -ForegroundColor Green

if (-not $SkipDownload) {
    Write-Host "`n[1/4] Acquiring geological datasets..." -ForegroundColor Cyan
    python -m ml.dataset.download_kaggle
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Dataset download failed." -ForegroundColor Red
        exit 1
    }
}

if (-not $SkipPreprocess) {
    Write-Host "`n[2/4] Preprocessing images (cleaning, deduplication, 70/15/15 split)..." -ForegroundColor Cyan
    python -m ml.dataset.preprocess --raw-dir data/raw --out-dir data/processed/classification
    if ($LASTEXITCODE -ne 0) { Write-Host "Preprocessing failed." -ForegroundColor Red; exit 1 }
}

Write-Host "`n[3/4] Training classification model (MobileNetV2)..." -ForegroundColor Cyan
python -m ml.classification.train --data-dir data/processed/classification --epochs $Epochs --batch-size $BatchSize
if ($LASTEXITCODE -ne 0) { Write-Host "Training failed." -ForegroundColor Red; exit 1 }

Write-Host "`n[4/4] Evaluating model on held-out test split..." -ForegroundColor Cyan
python -m ml.classification.evaluate
if ($LASTEXITCODE -ne 0) { Write-Host "Evaluation failed." -ForegroundColor Red; exit 1 }

Write-Host "`n=== Training complete! ===" -ForegroundColor Green
Write-Host "Model checkpoint: ml/artifacts/model_best.pt"
Write-Host "Class mapping:    ml/artifacts/class_to_idx.json"
Write-Host "Evaluation metrics: ml/artifacts/eval_metrics.json"
Write-Host "`nThe backend auto-reloads new checkpoints immediately."
