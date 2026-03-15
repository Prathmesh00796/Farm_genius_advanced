
import io
import base64
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from pathlib import Path
import json

# ─── Configuration ────────────────────────────────────────────────────────────
MODEL_DIR = Path(__file__).parent / "models"
MODEL_PATH = MODEL_DIR / "plant_disease_model.pth"
LABELS_PATH = MODEL_DIR / "class_labels.json"

class DiseasePredictor:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.class_names = []
        self._load_labels()
        self._load_model()
        
        # Standard MobileNetV2 transforms
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

    def _load_labels(self):
        try:
            if LABELS_PATH.exists():
                with open(LABELS_PATH, "r") as f:
                    self.class_names = json.load(f)
        except Exception as e:
            print(f"Error loading labels: {e}")

    def _load_model(self):
        try:
            if MODEL_PATH.exists() and self.class_names:
                # Initialize ResNet18 architecture
                self.model = models.resnet18()
                num_classes = len(self.class_names)
                num_ftrs = self.model.fc.in_features
                self.model.fc = nn.Sequential(
                    nn.Dropout(p=0.3),
                    nn.Linear(num_ftrs, num_classes),
                )
                
                # Load weights
                state_dict = torch.load(MODEL_PATH, map_location=self.device)
                self.model.load_state_dict(state_dict)
                self.model.to(self.device)
                self.model.eval()
                print(f"✓ ResNet18 model loaded successfully ({len(self.class_names)} classes)")
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model = None

    def predict_from_base64(self, base64_str: str):
        if not self.model or not self.class_names:
            return []

        try:
            # Clean base64 string
            if "," in base64_str:
                base64_str = base64_str.split(",")[1]
            
            image_data = base64.b64decode(base64_str)
            image = Image.open(io.BytesIO(image_data)).convert("RGB")
            
            # Preprocess
            input_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Inference
            with torch.no_grad():
                outputs = self.model(input_tensor)
                probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
                
                # Get top 3 predictions
                top_probs, top_indices = torch.topk(probabilities, 3)
                
                results = []
                for prob, idx in zip(top_probs, top_indices):
                    results.append({
                        "class_name": self.class_names[idx.item()],
                        "confidence_pct": float(prob.item() * 100)
                    })
                return results
        except Exception as e:
            print(f"Prediction error: {e}")
            return []

    def predict_from_url(self, url: str):
        # Optional: Implement URL download and prediction
        return []

# Singleton instance
disease_predictor = DiseasePredictor()

def model_ready() -> bool:
    return disease_predictor.model is not None
