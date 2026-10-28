"""
GeoVision AI — Classification Model Training
Uses MobileNetV2 (PyTorch / torchvision) with transfer learning.

Usage:
    python -m ml.classification.train --data-dir data/processed/classification --epochs 30 --batch-size 32

Output artifacts (in ml/artifacts/):
    model_best.pt        — best checkpoint state dict
    class_to_idx.json    — {class_name: index} mapping
    metadata.json        — training config and results summary
"""

import argparse
import json
import os
import random
import time
import sys
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import numpy as np
import torch
import torch.nn as nn
from torch.optim import Adam
from torch.optim.lr_scheduler import ReduceLROnPlateau
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms

ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

SEED = 42
IMG_SIZE = 224


def set_seed(seed: int):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def build_transforms(train: bool = True):
    if train:
        return transforms.Compose([
            transforms.RandomResizedCrop(IMG_SIZE, scale=(0.7, 1.0)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomVerticalFlip(p=0.2),
            transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
            transforms.RandomRotation(20),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])
    return transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])


def compute_class_weights(dataset: datasets.ImageFolder, num_classes: int) -> torch.Tensor:
    counts = np.zeros(num_classes)
    for _, label in dataset.samples:
        counts[label] += 1
    total = counts.sum()
    weights = total / (num_classes * counts + 1e-6)
    return torch.tensor(weights, dtype=torch.float32)


def build_model(num_classes: int) -> nn.Module:
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
    # Freeze base layers initially
    for param in model.features.parameters():
        param.requires_grad = False
    # Replace classifier head
    model.classifier[1] = nn.Linear(model.last_channel, num_classes)
    return model


def train_epoch(model, loader, optimizer, criterion, device):
    model.train()
    total_loss = 0.0
    correct = 0
    total = 0
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * images.size(0)
        correct += (outputs.argmax(1) == labels).sum().item()
        total += images.size(0)
    return total_loss / total, correct / total


@torch.no_grad()
def eval_epoch(model, loader, criterion, device):
    model.eval()
    total_loss = 0.0
    correct = 0
    total = 0
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        outputs = model(images)
        loss = criterion(outputs, labels)
        total_loss += loss.item() * images.size(0)
        correct += (outputs.argmax(1) == labels).sum().item()
        total += images.size(0)
    return total_loss / total, correct / total


def main(args):
    set_seed(SEED)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    data_dir = Path(args.data_dir)
    train_dir = data_dir / "train"
    val_dir = data_dir / "val"

    if not train_dir.exists():
        raise FileNotFoundError(
            f"Training directory not found: {train_dir}\n"
            "Run the dataset download and preprocessing pipeline first:\n"
            "  python -m ml.dataset.download_kaggle\n"
            "  python -m ml.dataset.preprocess"
        )

    train_ds = datasets.ImageFolder(str(train_dir), transform=build_transforms(train=True))
    val_ds = datasets.ImageFolder(str(val_dir), transform=build_transforms(train=False))

    print(f"Training samples: {len(train_ds)}, classes: {len(train_ds.classes)}")
    print(f"Validation samples: {len(val_ds)}")

    num_classes = len(train_ds.classes)
    class_to_idx = train_ds.class_to_idx

    train_loader = DataLoader(
        train_ds, batch_size=args.batch_size, shuffle=True,
        num_workers=0, pin_memory=device.type == "cuda"
    )
    val_loader = DataLoader(
        val_ds, batch_size=args.batch_size, shuffle=False, num_workers=0
    )

    model = build_model(num_classes).to(device)

    class_weights = compute_class_weights(train_ds, num_classes).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights)

    # Phase 1: Train head only (frozen backbone)
    optimizer = Adam(model.classifier.parameters(), lr=args.lr)
    scheduler = ReduceLROnPlateau(optimizer, mode="min", patience=3, factor=0.5)

    best_val_loss = float("inf")
    best_val_acc = 0.0
    history = []

    print(f"\nPhase 1: Training head for up to {args.epochs} epochs...")
    patience_counter = 0
    EARLY_STOP_PATIENCE = 8

    for epoch in range(1, args.epochs + 1):
        t0 = time.time()
        tr_loss, tr_acc = train_epoch(model, train_loader, optimizer, criterion, device)
        vl_loss, vl_acc = eval_epoch(model, val_loader, criterion, device)
        scheduler.step(vl_loss)

        epoch_time = time.time() - t0
        print(
            f"Epoch {epoch:3d}/{args.epochs} | "
            f"train_loss={tr_loss:.4f} acc={tr_acc:.3f} | "
            f"val_loss={vl_loss:.4f} acc={vl_acc:.3f} | {epoch_time:.1f}s"
        )
        history.append({
            "epoch": epoch,
            "train_loss": round(tr_loss, 4),
            "train_acc": round(tr_acc, 4),
            "val_loss": round(vl_loss, 4),
            "val_acc": round(vl_acc, 4),
        })

        if vl_loss < best_val_loss:
            best_val_loss = vl_loss
            best_val_acc = vl_acc
            torch.save(model.state_dict(), str(ARTIFACTS_DIR / "model_best.pt"))
            print(f"  [SAVED] Best model checkpoint saved (val_loss={best_val_loss:.4f})")
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= EARLY_STOP_PATIENCE:
                print(f"  Early stopping triggered at epoch {epoch}.")
                break

    # Phase 2: Fine-tune all layers with lower LR
    if args.finetune:
        print("\nPhase 2: Fine-tuning full network...")
        for param in model.parameters():
            param.requires_grad = True
        optimizer = Adam(model.parameters(), lr=args.lr * 0.1)
        scheduler = ReduceLROnPlateau(optimizer, mode="min", patience=3, factor=0.3)
        patience_counter = 0

        for epoch in range(1, args.finetune_epochs + 1):
            t0 = time.time()
            tr_loss, tr_acc = train_epoch(model, train_loader, optimizer, criterion, device)
            vl_loss, vl_acc = eval_epoch(model, val_loader, criterion, device)
            scheduler.step(vl_loss)
            epoch_time = time.time() - t0
            print(
                f"FT Epoch {epoch:3d}/{args.finetune_epochs} | "
                f"train_loss={tr_loss:.4f} acc={tr_acc:.3f} | "
                f"val_loss={vl_loss:.4f} acc={vl_acc:.3f} | {epoch_time:.1f}s"
            )
            history.append({
                "epoch": f"ft{epoch}",
                "train_loss": round(tr_loss, 4),
                "train_acc": round(tr_acc, 4),
                "val_loss": round(vl_loss, 4),
                "val_acc": round(vl_acc, 4),
            })

            if vl_loss < best_val_loss:
                best_val_loss = vl_loss
                best_val_acc = vl_acc
                torch.save(model.state_dict(), str(ARTIFACTS_DIR / "model_best.pt"))
                print(f"  [SAVED] Best model checkpoint saved (val_loss={best_val_loss:.4f})")
                patience_counter = 0
            else:
                patience_counter += 1
                if patience_counter >= EARLY_STOP_PATIENCE:
                    break

    # Save class mapping and metadata
    with open(ARTIFACTS_DIR / "class_to_idx.json", "w") as f:
        json.dump(class_to_idx, f, indent=2)

    metadata = {
        "model_architecture": "MobileNetV2",
        "num_classes": num_classes,
        "classes": train_ds.classes,
        "image_size": IMG_SIZE,
        "best_val_loss": round(best_val_loss, 4),
        "best_val_acc": round(best_val_acc, 4),
        "epochs_trained": len(history),
        "batch_size": args.batch_size,
        "seed": SEED,
        "training_samples": len(train_ds),
        "validation_samples": len(val_ds),
        "history": history,
    }
    with open(ARTIFACTS_DIR / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n[OK] Training complete.")
    print(f"     Best val_acc = {best_val_acc:.3f}  (loss={best_val_loss:.4f})")
    print(f"     Artifacts saved to: {ARTIFACTS_DIR}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GeoVision AI — Classification Training")
    parser.add_argument("--data-dir", default="data/processed/classification")
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--finetune", action="store_true", help="Enable phase-2 full fine-tuning")
    parser.add_argument("--finetune-epochs", type=int, default=10)
    args = parser.parse_args()
    main(args)
