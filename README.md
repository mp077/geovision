# GeoVision AI — Geological Specimen Intelligence Platform

GeoVision AI is an end-to-end computer vision platform designed for real-time geological specimen classification, optical live scanning, and petrological analysis.

---

## 🧠 Machine Learning & Computer Vision Architecture

### 1. Classification Model: Convolutional Neural Network (CNN)
* **Backbone Architecture**: **MobileNetV2** (`torchvision.models.mobilenet_v2`)
* **Paradigm**: Deep Convolutional Neural Network utilizing:
  * **Inverted Residual Blocks** with linear bottlenecks
  * **Depthwise Separable Convolutions** (3×3 depthwise conv + 1×1 pointwise conv) for high parameter efficiency and sub-50ms inference.
* **Transfer Learning**: Pretrained on ImageNet-1K (`MobileNet_V2_Weights.IMAGENET1K_V1`), with fine-tuned classification heads for geological petrology.
* **Input Resolution**: `224 × 224` pixels (RGB normalized with ImageNet mean and std).
* **Target Classes (7 primary geological categories)**:
  * **Basalt** (Igneous)
  * **Coal** (Sedimentary)
  * **Granite** (Igneous)
  * **Limestone** (Sedimentary)
  * **Marble** (Metamorphic)
  * **Quartzite** (Metamorphic)
  * **Sandstone** (Sedimentary)

### 2. Explainable AI (XAI): Grad-CAM
* **Method**: **Gradient-weighted Class Activation Mapping (Grad-CAM)**
* **Layer Target**: Final convolutional feature map (`model.features[18]`).
* **Function**: Computes gradients of the target class score with respect to feature maps, producing high-resolution heatmaps overlaid on the original specimen image to visually highlight the mineral textures that led to the prediction.

### 3. Object Detection & Optical Segmentation
* **Foreground Segmentation**: OpenCV contour detection (`cv2.findContours`) and Otsu adaptive thresholding for isolating rock specimens from background field clutter during camera live scans.

### 4. Data Preprocessing & Deduplication Pipeline
* **Integrity Validation**: Magic-byte inspection & PIL verification.
* **Exact Duplicate Rejection**: **SHA-256 cryptographic hashing**.
* **Near-Duplicate Rejection**: **Perceptual Hashing (pHash)** via discrete cosine transform (DCT) with Hamming distance thresholding ($\le 8$).
* **EXIF Orientation Correction**: Auto-rotates images according to camera orientation tags.
* **Data Splits**: 70% Train, 15% Validation, 15% Test with stratified class distribution.

---

## 💻 Complete Technology Stack

| Layer | Technologies Used | Description |
|---|---|---|
| **Deep Learning** | **PyTorch 2.x**, **Torchvision** | CNN model training, checkpoint management, and GPU/CPU inference |
| **Computer Vision** | **OpenCV (`cv2`)**, **Pillow (`PIL`)** | Image transforms, contour detection, Grad-CAM overlays |
| **Hahsing & Deduplication** | **ImageHash (pHash)**, **hashlib (SHA-256)** | Perceptual and exact duplicate detection |
| **Data & Spreadsheet** | **Pandas**, **OpenPyXL** | Automated multi-sheet Excel (`.xlsx`) & CSV dataset generation |
| **Backend API** | **FastAPI**, **Uvicorn** | High-performance asynchronous Python REST API with auto Swagger docs |
| **Database & ORM** | **SQLAlchemy 2.0**, **SQLite** | Local specimen scan history, metadata, and laboratory notes persistence |
| **Frontend Framework** | **React 19**, **TypeScript** | Type-safe single page application (SPA) |
| **Build Tool** | **Vite 8** | Fast HMR dev server & optimized production bundling |
| **Styling** | **TailwindCSS 4** | Laboratory-grade modern UI with curated geological aesthetic |
| **Data Visualization** | **Recharts** | Interactive classification activity charts and category breakdown rings |
| **Icons** | **Lucide React** | Feather-derived UI iconography |
| **Optical Capture** | **HTML5 MediaDevices API** | Browser `getUserMedia` camera feed with buffer snapshot capture |
| **Deployment** | **Render** (`render.yaml`) | Unified single-service deployment (FastAPI serving React SPA) |

---

## 📁 Repository Structure

```
CV.CP/
├── backend/
│   └── app/
│       ├── api/               # REST routers (health, identify, history, scanner, dataset)
│       ├── database/          # SQLite engine and session setup
│       ├── models/            # SQLAlchemy database tables
│       ├── schemas/           # Pydantic validation schemas
│       ├── services/          # Inference engine, Grad-CAM, specimen knowledge base
│       └── main.py            # FastAPI entry point & SPA static file serving
├── data/
│   ├── manifests/             # Dataset CSVs and dataset_manifest.xlsx
│   ├── dataset.xlsx           # Master Excel dataset workbook
│   └── processed/             # Held-out test evaluation samples
├── dist/                      # Pre-built production frontend assets
├── ml/
│   ├── artifacts/             # Checkpoints (model_best.pt), metrics, class mapping
│   ├── classification/        # PyTorch training & evaluation scripts
│   └── dataset/               # Downloaders, preprocess pipeline, and Excel exporter
├── src/
│   ├── components/            # Reusable UI components, Grad-CAM viewer, status badges
│   ├── context/               # Global SpecimenContext state & backend ping
│   ├── pages/                 # Overview, Identify, Live Scanner, History, Settings
│   └── types/                 # TypeScript interfaces
├── package.json               # Node.js dependencies & build scripts
├── requirements.txt           # Python backend dependencies (Render-ready)
├── render.yaml                # Render Blueprint deployment config
└── vite.config.ts             # Vite configuration with /api reverse proxy
```

---

## 🚀 Running Locally

### 1. Start Backend Server
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
* API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
* Health Check: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### 2. Start Frontend Dev Server
```bash
npm run dev
```
* Application UI: [http://localhost:5173](http://localhost:5173)

---

## 📊 Dataset Excel Export
The dataset is exported in Microsoft Excel OpenXML format (`.xlsx`) containing:
1. **`Dataset Summary`**: Key metrics, split sizes, and class balance.
2. **`Class Distribution`**: Specimen counts and percentages per rock class.
3. **`Split Manifest`**: Train (70%), Val (15%), and Test (15%) splits.
4. **`All Images`**: Complete record of file paths, labels, SHA-256 hashes, pHash, and dimensions.
5. **`Rejected Images`**: Audit trail of rejected duplicates and corrupt files.
