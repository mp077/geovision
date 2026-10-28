# GeoVision AI — Start Backend
# Run from project root: c:\Users\Mann\Downloads\CV.CP

Write-Host "Starting GeoVision AI Backend on http://localhost:8000" -ForegroundColor Green
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop.`n"

python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
