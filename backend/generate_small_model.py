
import os
import json
import tensorflow as tf
from pathlib import Path

# ── Configuration ────────────────────────────────────────────────────────────
MODEL_DIR = Path(__file__).parent / "models"
MODEL_DIR.mkdir(exist_ok=True)
LABELS_PATH = MODEL_DIR / "class_labels.json"
MODEL_PATH = MODEL_DIR / "plant_disease_small.keras"

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
    # Using 224x224 as specified in the training script
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights='imagenet' # Use pre-trained weights for better "base" features
    )
    
    # Freeze the base model
    base_model.trainable = False

    model = tf.keras.Sequential([
        base_model,
        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.Dense(num_classes, activation='softmax')
    ])

    # 3. Save the model without optimizer state to minimize file size
    print(f"✓ Saving model to {MODEL_PATH}...")
    model.save(MODEL_PATH, include_optimizer=False)
    
    file_size_mb = os.path.getsize(MODEL_PATH) / (1024 * 1024)
    print(f"✅ Success! Model size: {file_size_mb:.2f} MB")

if __name__ == "__main__":
    generate_small_model()
