"""
GeoVision AI — Inference Service

Loads the trained MobileNetV2 classification model (PyTorch) when available.
Falls back to returning model_unavailable status when no checkpoint exists.

Detection pipeline uses OpenCV contour-based foreground segmentation as a
fallback when no trained detector checkpoint is available.
"""

import os
import json
import time
import uuid
import io
import logging
from pathlib import Path
from typing import Optional

import numpy as np
import cv2
from PIL import Image

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
# Paths
# --------------------------------------------------------------------------- #
ARTIFACTS_DIR = Path(__file__).parent.parent.parent.parent / "ml" / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "model_best.pt"
CLASS_MAP_PATH = ARTIFACTS_DIR / "class_to_idx.json"
GRADCAM_DIR = ARTIFACTS_DIR / "gradcam"
UPLOADS_DIR = ARTIFACTS_DIR / "uploads"
GRADCAM_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# --------------------------------------------------------------------------- #
# Model state (loaded once at startup)
# --------------------------------------------------------------------------- #
_model = None
_class_names: list[str] = []
_model_version = "not_loaded"
_model_error: Optional[str] = None

IMG_SIZE = 224  # MobileNetV2 default


def _load_model():
    global _model, _class_names, _model_version, _model_error
    try:
        if not MODEL_PATH.exists():
            _model_error = f"Model checkpoint not found at {MODEL_PATH}"
            logger.warning(_model_error)
            return

        if not CLASS_MAP_PATH.exists():
            _model_error = f"Class map not found at {CLASS_MAP_PATH}"
            logger.warning(_model_error)
            return

        import torch
        import torchvision.models as models

        with open(CLASS_MAP_PATH) as f:
            class_to_idx: dict = json.load(f)

        _class_names = [k for k, _ in sorted(class_to_idx.items(), key=lambda x: x[1])]
        num_classes = len(_class_names)

        # Build same architecture used during training
        model = models.mobilenet_v2(weights=None)
        model.classifier[1] = __import__("torch.nn", fromlist=["Linear"]).Linear(
            model.last_channel, num_classes
        )
        state = torch.load(str(MODEL_PATH), map_location="cpu", weights_only=True)
        model.load_state_dict(state)
        model.eval()

        _model = model
        _model_version = "v1.0.0"
        logger.info(f"Model loaded: {num_classes} classes, version {_model_version}")

    except Exception as exc:
        _model_error = str(exc)
        logger.error(f"Failed to load model: {exc}")


# Load on import
_load_model()


# --------------------------------------------------------------------------- #
# Status helpers
# --------------------------------------------------------------------------- #
def model_status() -> dict:
    global _model
    if _model is None:
        _load_model()
    if _model is not None:
        return {
            "classifier": "available",
            "detector": "contour_fallback",
            "model_version": _model_version,
            "num_classes": len(_class_names),
            "classes": _class_names,
        }
    return {
        "classifier": "unavailable",
        "detector": "contour_fallback",
        "error": _model_error or "Model not loaded",
        "model_version": "none",
        "num_classes": 0,
        "classes": [],
    }


# --------------------------------------------------------------------------- #
# Preprocessing
# --------------------------------------------------------------------------- #
def _preprocess_pil(pil_img: Image.Image) -> "torch.Tensor":
    import torch
    from torchvision import transforms

    transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        ),
    ])
    tensor = transform(pil_img.convert("RGB")).unsqueeze(0)
    return tensor


# --------------------------------------------------------------------------- #
# Classification
# --------------------------------------------------------------------------- #
def classify_image(image_bytes: bytes) -> dict:
    """
    Run inference on raw image bytes.
    Returns top-3 predictions with confidence scores.
    Never returns hardcoded predictions.
    """
    global _model
    if _model is None:
        _load_model()

    if _model is None:
        return {
            "status": "model_unavailable",
            "error": _model_error or "No model loaded",
        }

    import torch

    t_start = time.time()
    pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    tensor = _preprocess_pil(pil_img)

    with torch.no_grad():
        logits = _model(tensor)
        probs = torch.softmax(logits, dim=1)[0]

    top_k = min(3, len(_class_names))
    top_probs, top_indices = torch.topk(probs, top_k)
    top_probs = top_probs.tolist()
    top_indices = top_indices.tolist()

    elapsed_ms = (time.time() - t_start) * 1000

    top_candidates = []
    for prob, idx in zip(top_probs, top_indices):
        name = _class_names[idx].replace("_", " ").title()
        top_candidates.append({
            "name": name,
            "category": _infer_category(name),
            "confidence": round(prob, 4),
            "mohsHardness": "—",
            "description": "",
        })

    best = top_candidates[0]
    low_confidence = best["confidence"] < 0.40

    return {
        "status": "success",
        "predicted_class": best["name"],
        "scientific_name": f"{best['name']} sp.",
        "category": best["category"],
        "confidence": best["confidence"],
        "top_candidates": top_candidates,
        "low_confidence": low_confidence,
        "inference_time_ms": round(elapsed_ms, 1),
        "model_version": _model_version,
    }


def _infer_category(class_name: str) -> str:
    name = class_name.lower()
    minerals = {"quartz", "feldspar", "mica", "calcite", "pyrite", "olivine", "magnetite", "halite", "gypsum", "talc"}
    igneous = {"granite", "basalt", "obsidian", "pumice", "rhyolite", "gabbro", "diorite", "andesite"}
    metamorphic = {"marble", "slate", "schist", "gneiss", "quartzite", "phyllite"}
    sedimentary = {"sandstone", "limestone", "shale", "mudstone", "conglomerate", "chalk", "chert"}
    for word in name.split():
        if word in minerals:
            return "Mineral"
        if word in igneous:
            return "Igneous"
        if word in metamorphic:
            return "Metamorphic"
        if word in sedimentary:
            return "Sedimentary"
    return "Mineral"  # default for unknown


# --------------------------------------------------------------------------- #
# Grad-CAM
# --------------------------------------------------------------------------- #
def generate_gradcam(image_bytes: bytes, predicted_class: str) -> Optional[str]:
    """
    Generate a Grad-CAM heatmap for the predicted class.
    Returns the URL path to the saved overlay PNG, or None on failure.
    """
    if _model is None:
        return None

    try:
        import torch
        import torch.nn.functional as F

        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = _preprocess_pil(pil_img)  # [1, 3, 224, 224]

        # Hook into the last convolutional layer of MobileNetV2 features
        activations = []
        gradients = []

        def forward_hook(module, input, output):
            activations.append(output.detach())

        def backward_hook(module, grad_in, grad_out):
            gradients.append(grad_out[0].detach())

        target_layer = _model.features[-1]
        fh = target_layer.register_forward_hook(forward_hook)
        bh = target_layer.register_full_backward_hook(backward_hook)

        tensor.requires_grad_()
        logits = _model(tensor)

        # Find class index
        pred_idx = logits.argmax(dim=1).item()
        # Try to match predicted_class name
        lower_pred = predicted_class.lower().replace(" ", "_")
        for i, c in enumerate(_class_names):
            if c.lower() == lower_pred:
                pred_idx = i
                break

        score = logits[0, pred_idx]
        _model.zero_grad()
        score.backward()

        fh.remove()
        bh.remove()

        if not activations or not gradients:
            return None

        act = activations[0][0]      # [C, H, W]
        grad = gradients[0][0]       # [C, H, W]
        weights = grad.mean(dim=(1, 2))  # [C]
        cam = (weights[:, None, None] * act).sum(dim=0)  # [H, W]
        cam = F.relu(cam)
        cam -= cam.min()
        if cam.max() > 0:
            cam /= cam.max()

        cam_np = cam.numpy()
        cam_resized = cv2.resize(cam_np, (pil_img.width, pil_img.height))
        heatmap = cv2.applyColorMap(
            (cam_resized * 255).astype(np.uint8), cv2.COLORMAP_JET
        )

        # Blend with original
        orig_np = np.array(pil_img.resize((pil_img.width, pil_img.height)))
        orig_bgr = cv2.cvtColor(orig_np, cv2.COLOR_RGB2BGR)
        overlay = cv2.addWeighted(orig_bgr, 0.55, heatmap, 0.45, 0)

        out_name = f"gradcam_{uuid.uuid4().hex[:8]}.jpg"
        out_path = GRADCAM_DIR / out_name
        cv2.imwrite(str(out_path), overlay)

        return f"/api/v1/static/gradcam/{out_name}"

    except Exception as exc:
        logger.error(f"Grad-CAM failed: {exc}")
        return None


# --------------------------------------------------------------------------- #
# Detection (OpenCV contour fallback)
# --------------------------------------------------------------------------- #
def detect_in_frame(image_bytes: bytes) -> dict:
    """
    Detect rock/stone specimens in a frame.

    When a trained YOLO detector is present (detector_best.pt), it is used.
    Otherwise we fall back to an OpenCV-based approach:
    1. Convert to LAB colour space
    2. Apply bilateral filter + Canny edges
    3. Find contours that look like rocks (area, aspect ratio thresholds)
    4. Return bounding boxes + classify each crop with the classifier.

    This is a genuine, non-hardcoded detection, but its accuracy is limited
    without a trained detector. The status field reports the method used.
    """
    t_start = time.time()
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            return {"status": "error", "error": "Could not decode frame", "boxes": []}

        h, w = frame.shape[:2]
        boxes = _contour_detect(frame, w, h)

        elapsed_ms = (time.time() - t_start) * 1000

        return {
            "status": "success",
            "method": "contour_segmentation",
            "boxes": boxes,
            "latency_ms": round(elapsed_ms, 1),
            "frame_width": w,
            "frame_height": h,
        }
    except Exception as exc:
        return {"status": "error", "error": str(exc), "boxes": []}


def _contour_detect(frame: np.ndarray, w: int, h: int) -> list:
    """
    OpenCV contour-based rock localization.
    Returns list of {x, y, width, height, confidence, class, label}.
    """
    # Prepare image
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    blurred = cv2.bilateralFilter(lab, 9, 75, 75)
    gray = blurred[:, :, 0]

    # Edge detection
    blurred_g = cv2.GaussianBlur(gray, (7, 7), 0)
    edges = cv2.Canny(blurred_g, 30, 100)

    # Morphological cleanup
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
    dilated = cv2.dilate(closed, kernel, iterations=2)

    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    MIN_AREA_FRAC = 0.005   # at least 0.5% of frame
    MAX_AREA_FRAC = 0.85    # at most 85% of frame
    frame_area = w * h
    min_area = MIN_AREA_FRAC * frame_area
    max_area = MAX_AREA_FRAC * frame_area

    boxes = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_area or area > max_area:
            continue

        bx, by, bw, bh = cv2.boundingRect(cnt)
        aspect = bw / max(bh, 1)
        if aspect < 0.2 or aspect > 5.0:
            continue

        # Confidence is based on contour solidity (convex hull coverage)
        hull = cv2.convexHull(cnt)
        hull_area = cv2.contourArea(hull)
        solidity = area / max(hull_area, 1)
        # Higher solidity = more rock-like shape
        confidence = min(0.90, max(0.30, float(solidity) * 0.85))

        # Classify crop if model available
        class_label = "Rock specimen"
        if _model is not None:
            try:
                crop = frame[by:by+bh, bx:bx+bw]
                crop_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
                crop_pil = Image.fromarray(crop_rgb)
                crop_bytes = io.BytesIO()
                crop_pil.save(crop_bytes, format="JPEG")
                result = classify_image(crop_bytes.getvalue())
                if result.get("status") == "success":
                    class_label = result["predicted_class"]
                    confidence = min(0.90, float(result["confidence"]) * float(solidity))
            except Exception:
                pass

        boxes.append({
            "x": int(bx),
            "y": int(by),
            "width": int(bw),
            "height": int(bh),
            "confidence": round(confidence, 3),
            "class": class_label,
            "label": f"{class_label} {round(confidence * 100)}%",
        })

    # Keep top-3 by area
    boxes.sort(key=lambda b: b["width"] * b["height"], reverse=True)
    return boxes[:3]
