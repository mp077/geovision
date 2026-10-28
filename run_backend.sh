#!/usr/bin/env bash
# GeoVision AI — Start Backend Server
# Run from project root

set -e

echo "Starting GeoVision AI Backend on http://localhost:8000"
echo "Interactive API Documentation: http://localhost:8000/docs"
echo "Press Ctrl+C to terminate."
echo ""

python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
