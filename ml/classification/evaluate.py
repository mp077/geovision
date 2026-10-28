"""
GeoVision AI — Model Evaluation Script
Runs on the held-out test split after training.

Usage:
    python -m ml.classification.evaluate

Output:
    ml/artifacts/eval_metrics.json  — all metrics
    ml/artifacts/confusion_matrix.txt
"""

import json
import sys
from pathlib import Path
from collections import defaultdict

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import torch
import numpy as np
from torchvision import datasets, transforms, models
import torch.nn as nn

ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "model_best.pt"
CLASS_MAP_PATH = ARTIFACTS_DIR / "class_to_idx.json"
IMG_SIZE = 224


def main():
    if not MODEL_PATH.exists():
        print(f"[ERROR] Model not found at {MODEL_PATH}")
        print("        Run: python -m ml.classification.train first.")
        sys.exit(1)

    with open(CLASS_MAP_PATH) as f:
        class_to_idx = json.load(f)

    class_names = [k for k, _ in sorted(class_to_idx.items(), key=lambda x: x[1])]
    num_classes = len(class_names)
    print(f"Classes: {num_classes} -> {class_names[:5]}{'...' if num_classes > 5 else ''}")

    test_dir = Path("data/processed/classification/test")
    if not test_dir.exists():
        print(f"[ERROR] Test directory not found: {test_dir}")
        sys.exit(1)

    transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    test_ds = datasets.ImageFolder(str(test_dir), transform=transform)
    test_loader = torch.utils.data.DataLoader(test_ds, batch_size=32, shuffle=False, num_workers=0)
    print(f"Test samples: {len(test_ds)}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = models.mobilenet_v2(weights=None)
    model.classifier[1] = nn.Linear(model.last_channel, num_classes)
    model.load_state_dict(torch.load(str(MODEL_PATH), map_location="cpu", weights_only=True))
    model.eval().to(device)

    all_preds = []
    all_labels = []
    all_confs = []

    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            logits = model(images)
            probs = torch.softmax(logits, dim=1)
            confs, preds = probs.max(dim=1)
            all_preds.extend(preds.cpu().tolist())
            all_labels.extend(labels.tolist())
            all_confs.extend(confs.cpu().tolist())

    y_true = np.array(all_labels)
    y_pred = np.array(all_preds)
    y_conf = np.array(all_confs)

    # Accuracy
    accuracy = float((y_true == y_pred).mean())

    # Per-class precision and recall
    per_class = {}
    for i, cls in enumerate(class_names):
        tp = int(((y_pred == i) & (y_true == i)).sum())
        fp = int(((y_pred == i) & (y_true != i)).sum())
        fn = int(((y_pred != i) & (y_true == i)).sum())
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
        per_class[cls] = {"precision": round(precision, 4), "recall": round(recall, 4), "f1": round(f1, 4), "support": int((y_true == i).sum())}

    macro_precision = float(np.mean([v["precision"] for v in per_class.values()]))
    macro_recall = float(np.mean([v["recall"] for v in per_class.values()]))
    macro_f1 = float(np.mean([v["f1"] for v in per_class.values()]))

    metrics = {
        "test_accuracy": round(accuracy, 4),
        "macro_precision": round(macro_precision, 4),
        "macro_recall": round(macro_recall, 4),
        "macro_f1": round(macro_f1, 4),
        "num_test_samples": len(y_true),
        "num_classes": num_classes,
        "avg_confidence": round(float(y_conf.mean()), 4),
        "per_class": per_class,
    }

    with open(ARTIFACTS_DIR / "eval_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    # Confusion matrix (text)
    conf_matrix = np.zeros((num_classes, num_classes), dtype=int)
    for t, p in zip(y_true, y_pred):
        conf_matrix[t][p] += 1
    with open(ARTIFACTS_DIR / "confusion_matrix.txt", "w") as f:
        header = "  ".join(f"{c[:8]:>8}" for c in class_names)
        f.write("Confusion Matrix\n" + header + "\n")
        for i, row in enumerate(conf_matrix):
            f.write(f"{class_names[i][:8]:>8}  " + "  ".join(f"{v:>8}" for v in row) + "\n")

    print(f"\n[OK] Evaluation complete")
    print(f"     Accuracy:  {accuracy:.3f}")
    print(f"     Macro F1:  {macro_f1:.3f}")
    print(f"     Saved to:  {ARTIFACTS_DIR / 'eval_metrics.json'}")


if __name__ == "__main__":
    main()
