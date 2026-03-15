
import os
import json
import torch
import torch.nn as nn
from torchvision import models, transforms
from pathlib import Path

# ── Configuration ────────────────────────────────────────────────────────────
MODEL_DIR = Path(__file__).parent / "models"
MODEL_DIR.mkdir(exist_ok=True)
LABELS_PATH = MODEL_DIR / "class_labels.json"
MODEL_PATH = MODEL_DIR / "plant_disease_model.pth"

def generate_small_model():
    # 1. Load labels to get the number of classes
    if not LABELS_PATH.exists():
        print("❌ class_labels.json not found!")
        return
    
    with open(LABELS_PATH, "r") as f:
        labels = json.load(f)
    
    num_classes = len(labels)
    print(f"✓ Found {num_classes} classes")

    # 2. Build a very small model (MobileNetV2 is ~14MB)
    # Using pre-trained weights for the feature extractor
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
    
    # Replace the classification head for our specific number of classes
    model.classifier[1] = nn.Linear(model.last_channel, num_classes)
    
    # 3. Save the model's state dictionary to minimize file size
    print(f"✓ Saving model to {MODEL_PATH}...")
    torch.save(model.state_dict(), MODEL_PATH)
    
    file_size_mb = os.path.getsize(MODEL_PATH) / (1024 * 1024)
    print(f"✅ Success! Model size: {file_size_mb:.2f} MB")

if __name__ == "__main__":
    generate_small_model()
