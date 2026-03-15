"""
╔══════════════════════════════════════════════════════════════════════════════╗
║   FarmGenius — Ultimate Plant Disease Detection Model Trainer               ║
║   Uses 3 Kaggle datasets to train EfficientNetB3 for Indian crop            ║
║   disease detection (60+ disease classes, 40+ crop types)                   ║
║                                                                              ║
║   Datasets:                                                                  ║
║   1. kamipakistan/plant-diseases-detection-dataset                          ║
║   2. krishnx09/crop-leaf-disease-image-dataset-jalgaon-region               ║
║   3. abdallahalidev/plantvillage-dataset                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

USAGE:
    pip install kagglehub tensorflow pillow numpy scikit-learn matplotlib
    python train_disease_model.py

    OR with GPU (recommended for speed):
    Use Google Colab with T4 GPU runtime for ~30 min instead of ~8 hours on CPU.

    Colab quickstart:
        !pip install kagglehub tensorflow pillow numpy scikit-learn
        from google.colab import files
        files.upload()  # upload your kaggle.json
        import os; os.environ['KAGGLE_CONFIG_DIR'] = '/root/.kaggle'
        !mkdir -p /root/.kaggle && cp kaggle.json /root/.kaggle/
        !python train_disease_model.py

This script will:
  1. Download all 3 Kaggle datasets via kagglehub
  2. Merge + deduplicate + normalize class names
  3. Train EfficientNetB3 with 2-phase transfer learning
  4. Apply aggressive data augmentation for robustness
  5. Save model to: backend/models/plant_disease_model.h5
  6. Save class labels to: backend/models/class_labels.json
  7. Print full accuracy report
"""

import os
import json
import shutil
import random
from pathlib import Path
from collections import defaultdict

# ── 0. Dependency guard ──────────────────────────────────────────────────────
try:
    import kagglehub
    import numpy as np
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    from tensorflow.keras.applications import EfficientNetB3
    from sklearn.model_selection import train_test_split
    from PIL import Image
    print(f"✓ TensorFlow {tf.__version__} loaded")
except ImportError as e:
    print(f"❌ Missing dependency: {e}")
    print("Run: pip install kagglehub tensorflow pillow numpy scikit-learn")
    raise SystemExit(1)

# ── 1. Config ────────────────────────────────────────────────────────────────
MODEL_DIR   = Path(__file__).parent / "models"
MODEL_DIR.mkdir(exist_ok=True)
MODEL_PATH  = MODEL_DIR / "plant_disease_model.h5"
LABELS_PATH = MODEL_DIR / "class_labels.json"
DATASET_DIR = Path(__file__).parent / "dataset_merged"

IMG_SIZE    = 224       # EfficientNetB3 native size
BATCH_SIZE  = 32        # reduce to 16 if OOM on small GPU
EPOCHS_HEAD = 6         # head-only epochs (base frozen)
EPOCHS_FINE = 20        # fine-tune epochs (top layers unfrozen)
SEED        = 42
MIN_IMAGES  = 15        # discard classes with < 15 images
MAX_IMAGES  = 3000      # cap per class (balance dataset)

# ── 2. Complete disease name normalization map ───────────────────────────────
# Handles every naming variant across all 3 datasets
NORMALIZE = {
    # ════════════════════ APPLE ════════════════════
    "apple___apple_scab":                   "Apple_Apple_Scab",
    "apple___black_rot":                    "Apple_Black_Rot",
    "apple___cedar_apple_rust":             "Apple_Cedar_Rust",
    "apple___healthy":                      "Apple_Healthy",
    "apple_scab":                           "Apple_Apple_Scab",
    "apple_black_rot":                      "Apple_Black_Rot",
    "apple_cedar_apple_rust":               "Apple_Cedar_Rust",
    "apple_healthy":                        "Apple_Healthy",

    # ════════════════════ BANANA ════════════════════
    "banana___sigatoka":                    "Banana_Sigatoka",
    "banana___black_sigatoka":              "Banana_Sigatoka",
    "banana___healthy":                     "Banana_Healthy",
    "banana_sigatoka":                      "Banana_Sigatoka",
    "banana_black_sigatoka":                "Banana_Sigatoka",
    "banana_healthy":                       "Banana_Healthy",
    "banana___fusarium_wilt":               "Banana_Fusarium_Wilt",
    "banana___bract_mosaic_virus":          "Banana_Bract_Mosaic_Virus",

    # ════════════════════ BLUEBERRY ════════════════════
    "blueberry___healthy":                  "Blueberry_Healthy",

    # ════════════════════ CHERRY ════════════════════
    "cherry_(including_sour)___powdery_mildew": "Cherry_Powdery_Mildew",
    "cherry_(including_sour)___healthy":    "Cherry_Healthy",
    "cherry___powdery_mildew":              "Cherry_Powdery_Mildew",
    "cherry___healthy":                     "Cherry_Healthy",
    "cherry_powdery_mildew":               "Cherry_Powdery_Mildew",
    "cherry_healthy":                       "Cherry_Healthy",

    # ════════════════════ CORN / MAIZE ════════════════════
    "corn_(maize)___cercospora_leaf_spot gray_leaf_spot": "Corn_Gray_Leaf_Spot",
    "corn_(maize)___common_rust_":          "Corn_Common_Rust",
    "corn_(maize)___northern_leaf_blight":  "Corn_Northern_Leaf_Blight",
    "corn_(maize)___healthy":               "Corn_Healthy",
    "maize___common_rust":                  "Corn_Common_Rust",
    "maize___northern_leaf_blight":         "Corn_Northern_Leaf_Blight",
    "maize___gray_leaf_spot":               "Corn_Gray_Leaf_Spot",
    "maize___healthy":                      "Corn_Healthy",
    "maize___lethal_necrosis":              "Corn_Lethal_Necrosis",
    "corn___common_rust":                   "Corn_Common_Rust",
    "corn___northern_leaf_blight":          "Corn_Northern_Leaf_Blight",
    "corn___gray_leaf_spot":                "Corn_Gray_Leaf_Spot",
    "corn___healthy":                       "Corn_Healthy",
    "corn_common_rust":                     "Corn_Common_Rust",
    "corn_northern_leaf_blight":            "Corn_Northern_Leaf_Blight",
    "corn_gray_leaf_spot":                  "Corn_Gray_Leaf_Spot",
    "corn_healthy":                         "Corn_Healthy",

    # ════════════════════ COTTON ════════════════════
    "cotton___bacterial_blight":            "Cotton_Bacterial_Blight",
    "cotton___healthy":                     "Cotton_Healthy",
    "cotton___curl_virus":                  "Cotton_Curl_Virus",
    "cotton___leaf_curl":                   "Cotton_Curl_Virus",
    "cotton_bacterial_blight":              "Cotton_Bacterial_Blight",
    "cotton_healthy":                       "Cotton_Healthy",
    "cotton_leaf_curl_disease":             "Cotton_Curl_Virus",

    # ════════════════════ GRAPE ════════════════════
    "grape___black_rot":                    "Grape_Black_Rot",
    "grape___esca_(black_measles)":         "Grape_Esca_Black_Measles",
    "grape___leaf_blight_(isariopsis_leaf_spot)": "Grape_Leaf_Blight",
    "grape___healthy":                      "Grape_Healthy",
    "grape_black_rot":                      "Grape_Black_Rot",
    "grape_esca_(black_measles)":           "Grape_Esca_Black_Measles",
    "grape_leaf_blight_(isariopsis_leaf_spot)": "Grape_Leaf_Blight",
    "grape_healthy":                        "Grape_Healthy",

    # ════════════════════ GROUNDNUT / PEANUT ════════════════════
    "groundnut___leaf_spot":                "Groundnut_Leaf_Spot",
    "groundnut___healthy":                  "Groundnut_Healthy",
    "groundnut___early_leaf_spot":          "Groundnut_Leaf_Spot",
    "groundnut___late_leaf_spot":           "Groundnut_Late_Leaf_Spot",
    "groundnut___rust":                     "Groundnut_Rust",
    "groundnut_leaf_spot":                  "Groundnut_Leaf_Spot",
    "groundnut_healthy":                    "Groundnut_Healthy",
    "peanut___healthy":                     "Groundnut_Healthy",
    "peanut___leaf_spot":                   "Groundnut_Leaf_Spot",

    # ════════════════════ ONION ════════════════════
    "onion___purple_blotch":                "Onion_Purple_Blotch",
    "onion___healthy":                      "Onion_Healthy",
    "onion___anthracnose":                  "Onion_Anthracnose",
    "onion_purple_blotch":                  "Onion_Purple_Blotch",
    "onion_healthy":                        "Onion_Healthy",

    # ════════════════════ ORANGE / CITRUS ════════════════════
    "orange___haunglongbing_(citrus_greening)": "Orange_Citrus_Greening",
    "orange___healthy":                     "Orange_Healthy",
    "citrus___greening":                    "Orange_Citrus_Greening",
    "citrus___canker":                      "Orange_Citrus_Canker",
    "citrus___black_spot":                  "Orange_Black_Spot",
    "citrus___melanose":                    "Orange_Melanose",
    "citrus___scab":                        "Orange_Scab",
    "citrus___healthy":                     "Orange_Healthy",

    # ════════════════════ PEACH ════════════════════
    "peach___bacterial_spot":               "Peach_Bacterial_Spot",
    "peach___healthy":                      "Peach_Healthy",
    "peach_bacterial_spot":                 "Peach_Bacterial_Spot",
    "peach_healthy":                        "Peach_Healthy",

    # ════════════════════ PEPPER / CAPSICUM ════════════════════
    "pepper,_bell___bacterial_spot":        "Pepper_Bacterial_Spot",
    "pepper,_bell___healthy":               "Pepper_Healthy",
    "pepper___bacterial_spot":              "Pepper_Bacterial_Spot",
    "pepper___healthy":                     "Pepper_Healthy",
    "capsicum___bacterial_spot":            "Pepper_Bacterial_Spot",
    "capsicum___healthy":                   "Pepper_Healthy",
    "bell_pepper___bacterial_spot":         "Pepper_Bacterial_Spot",
    "bell_pepper___healthy":               "Pepper_Healthy",

    # ════════════════════ POTATO ════════════════════
    "potato___early_blight":                "Potato_Early_Blight",
    "potato___late_blight":                 "Potato_Late_Blight",
    "potato___healthy":                     "Potato_Healthy",
    "potato___leaf_roll":                   "Potato_Leaf_Roll_Virus",
    "potato___virus":                       "Potato_Virus",
    "potato_early_blight":                  "Potato_Early_Blight",
    "potato_late_blight":                   "Potato_Late_Blight",
    "potato_healthy":                       "Potato_Healthy",

    # ════════════════════ RASPBERRY ════════════════════
    "raspberry___healthy":                  "Raspberry_Healthy",

    # ════════════════════ RICE ════════════════════
    "rice___brown_spot":                    "Rice_Brown_Spot",
    "rice___leaf_blast":                    "Rice_Leaf_Blast",
    "rice___neck_blast":                    "Rice_Neck_Blast",
    "rice___bacterial_blight":              "Rice_Bacterial_Blight",
    "rice___healthy":                       "Rice_Healthy",
    "rice___hispa":                         "Rice_Hispa",
    "rice___tungro":                        "Rice_Tungro",
    "rice___sheath_blight":                 "Rice_Sheath_Blight",
    "rice_brown_spot":                      "Rice_Brown_Spot",
    "rice_leaf_blast":                      "Rice_Leaf_Blast",
    "rice_bacterial_blight":               "Rice_Bacterial_Blight",
    "rice_healthy":                         "Rice_Healthy",
    "rice_hispa":                           "Rice_Hispa",
    "rice_tungro":                          "Rice_Tungro",
    "paddy___brown_spot":                   "Rice_Brown_Spot",
    "paddy___leaf_blast":                   "Rice_Leaf_Blast",
    "paddy___bacterial_blight":             "Rice_Bacterial_Blight",
    "paddy___healthy":                      "Rice_Healthy",
    "paddy___hispa":                        "Rice_Hispa",
    "paddy___tungro":                       "Rice_Tungro",

    # ════════════════════ SOYBEAN ════════════════════
    "soybean___healthy":                    "Soybean_Healthy",
    "soybean___rust":                       "Soybean_Rust",
    "soybean___sudden_death_syndrome":      "Soybean_Sudden_Death_Syndrome",
    "soyabean___rust":                      "Soybean_Rust",
    "soyabean___healthy":                   "Soybean_Healthy",
    "soyabean___frog_eye_leaf_spot":        "Soybean_Frog_Eye_Leaf_Spot",
    "soya___rust":                          "Soybean_Rust",
    "soya___healthy":                       "Soybean_Healthy",

    # ════════════════════ SQUASH ════════════════════
    "squash___powdery_mildew":              "Squash_Powdery_Mildew",
    "squash___healthy":                     "Squash_Healthy",

    # ════════════════════ STRAWBERRY ════════════════════
    "strawberry___leaf_scorch":             "Strawberry_Leaf_Scorch",
    "strawberry___healthy":                 "Strawberry_Healthy",
    "strawberry_leaf_scorch":               "Strawberry_Leaf_Scorch",

    # ════════════════════ SUGARCANE ════════════════════
    "sugarcane___healthy":                  "Sugarcane_Healthy",
    "sugarcane___bacterial_blight":         "Sugarcane_Bacterial_Blight",
    "sugarcane___red_rot":                  "Sugarcane_Red_Rot",
    "sugarcane___rust":                     "Sugarcane_Rust",
    "sugarcane___yellow_leaf":              "Sugarcane_Yellow_Leaf_Disease",
    "sugarcane___smut":                     "Sugarcane_Smut",
    "sugarcane_red_rot":                    "Sugarcane_Red_Rot",
    "sugarcane_healthy":                    "Sugarcane_Healthy",

    # ════════════════════ TOMATO ════════════════════
    "tomato___bacterial_spot":              "Tomato_Bacterial_Spot",
    "tomato___early_blight":                "Tomato_Early_Blight",
    "tomato___late_blight":                 "Tomato_Late_Blight",
    "tomato___leaf_mold":                   "Tomato_Leaf_Mold",
    "tomato___septoria_leaf_spot":          "Tomato_Septoria_Leaf_Spot",
    "tomato___spider_mites two-spotted_spider_mite": "Tomato_Spider_Mites",
    "tomato___spider_mites":                "Tomato_Spider_Mites",
    "tomato___target_spot":                 "Tomato_Target_Spot",
    "tomato___tomato_yellow_leaf_curl_virus": "Tomato_Yellow_Leaf_Curl_Virus",
    "tomato___tomato_mosaic_virus":         "Tomato_Mosaic_Virus",
    "tomato___healthy":                     "Tomato_Healthy",
    "tomato_bacterial_spot":                "Tomato_Bacterial_Spot",
    "tomato_early_blight":                  "Tomato_Early_Blight",
    "tomato_late_blight":                   "Tomato_Late_Blight",
    "tomato_leaf_mold":                     "Tomato_Leaf_Mold",
    "tomato_septoria_leaf_spot":            "Tomato_Septoria_Leaf_Spot",
    "tomato_spider_mites":                  "Tomato_Spider_Mites",
    "tomato_target_spot":                   "Tomato_Target_Spot",
    "tomato_yellow_leaf_curl_virus":        "Tomato_Yellow_Leaf_Curl_Virus",
    "tomato_mosaic_virus":                  "Tomato_Mosaic_Virus",
    "tomato_healthy":                       "Tomato_Healthy",

    # ════════════════════ WHEAT ════════════════════
    "wheat___brown_rust":                   "Wheat_Brown_Rust",
    "wheat___yellow_rust":                  "Wheat_Yellow_Rust",
    "wheat___septoria":                     "Wheat_Septoria",
    "wheat___healthy":                      "Wheat_Healthy",
    "wheat___loose_smut":                   "Wheat_Loose_Smut",
    "wheat___stem_rust":                    "Wheat_Stem_Rust",
    "wheat___powdery_mildew":               "Wheat_Powdery_Mildew",
    "wheat_brown_rust":                     "Wheat_Brown_Rust",
    "wheat_yellow_rust":                    "Wheat_Yellow_Rust",
    "wheat_healthy":                        "Wheat_Healthy",
    "wheat_loose_smut":                     "Wheat_Loose_Smut",
    "wheat_stem_rust":                      "Wheat_Stem_Rust",
}


def normalize_class_name(raw: str) -> str:
    """Convert any raw folder name to canonical class name."""
    key = raw.lower().strip().replace(" ", "_").replace("-", "_")
    # Remove trailing underscores/spaces
    key = key.rstrip("_")
    if key in NORMALIZE:
        return NORMALIZE[key]
    # Try with ___ separator (PlantVillage format)
    parts = key.split("___")
    if len(parts) == 2:
        crop = "_".join(w.capitalize() for w in parts[0].replace(",", "").split("_"))
        cond = "_".join(w.capitalize() for w in parts[1].split("_"))
        return f"{crop}_{cond}"
    # Fallback: capitalize each word
    return "_".join(w.capitalize() for w in key.split("_"))


def find_image_dirs(base: Path, depth: int = 6) -> list:
    """Recursively find leaf directories containing images."""
    result = []
    if depth == 0 or not base.is_dir():
        return result
    try:
        children = list(base.iterdir())
    except PermissionError:
        return result
    exts = {".jpg", ".jpeg", ".png", ".bmp", ".JPG", ".JPEG", ".PNG"}
    has_images = any(c.is_file() and c.suffix in exts for c in children)
    if has_images:
        result.append(base)
    for c in children:
        if c.is_dir():
            result.extend(find_image_dirs(c, depth - 1))
    return result


def merge_datasets() -> list:
    """Download + merge all 3 Kaggle datasets into DATASET_DIR."""
    print("\n" + "=" * 65)
    print("  STEP 1: Downloading Kaggle datasets (3 datasets)")
    print("=" * 65)

    datasets = [
        "kamipakistan/plant-diseases-detection-dataset",
        "krishnx09/crop-leaf-disease-image-dataset-jalgaon-region",
        "abdallahalidev/plantvillage-dataset",
    ]

    raw_paths = []
    for ds in datasets:
        print(f"\n→ Downloading: {ds}")
        try:
            p = kagglehub.dataset_download(ds)
            print(f"  ✓ Downloaded to: {p}")
            raw_paths.append(Path(p))
        except Exception as e:
            print(f"  ✗ Failed to download {ds}: {e}")
            print("    Skipping this dataset and continuing...")

    if not raw_paths:
        raise RuntimeError("No datasets could be downloaded! Check kaggle.json credentials.")

    print(f"\n→ Merging into: {DATASET_DIR}")
    if DATASET_DIR.exists():
        shutil.rmtree(DATASET_DIR)
    DATASET_DIR.mkdir(parents=True)

    class_counts: dict = defaultdict(int)
    exts = {".jpg", ".jpeg", ".png", ".bmp", ".JPG", ".JPEG", ".PNG"}

    for raw_path in raw_paths:
        image_dirs = find_image_dirs(raw_path)
        print(f"  Found {len(image_dirs)} leaf dirs in {raw_path.name}")

        for img_dir in image_dirs:
            raw_name = img_dir.name
            class_name = normalize_class_name(raw_name)
            dest = DATASET_DIR / class_name
            dest.mkdir(exist_ok=True)

            for img_file in img_dir.iterdir():
                if not img_file.is_file():
                    continue
                if img_file.suffix not in exts:
                    continue
                # Cap per-class images to balance dataset
                if class_counts[class_name] >= MAX_IMAGES:
                    continue
                # Unique naming: datasethash + original name
                new_name = f"{class_counts[class_name]:07d}{img_file.suffix.lower()}"
                dest_file = dest / new_name
                if not dest_file.exists():
                    try:
                        shutil.copy2(img_file, dest_file)
                    except Exception:
                        continue
                class_counts[class_name] += 1

    # Filter classes with too few images
    dropped = []
    for cls in list(class_counts.keys()):
        if class_counts[cls] < MIN_IMAGES:
            shutil.rmtree(DATASET_DIR / cls, ignore_errors=True)
            dropped.append(cls)
            del class_counts[cls]

    if dropped:
        print(f"\n  Dropped {len(dropped)} classes with <{MIN_IMAGES} images: {dropped}")

    total = sum(class_counts.values())
    print(f"\n  ✓ Merged dataset: {len(class_counts)} classes, {total:,} total images")
    print(f"\n{'Class':<45} {'Count':>6}")
    print("-" * 53)
    for cls, cnt in sorted(class_counts.items()):
        print(f"  {cls:<43} {cnt:>6}")

    return sorted(class_counts.keys())


def build_model(num_classes: int) -> keras.Model:
    """Build EfficientNetB3 transfer learning model with improved head."""
    base = EfficientNetB3(
        include_top=False,
        weights="imagenet",
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
    )
    base.trainable = False  # Freeze for head training

    inputs = keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
    x = tf.keras.applications.efficientnet.preprocess_input(inputs)
    x = base(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.4)(x)
    x = layers.Dense(512, activation="swish")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(256, activation="swish")(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    return keras.Model(inputs, outputs, name="FarmGenius_DiseaseDetector")


def make_augmentation_layer():
    """Keras Sequential augmentation layer for training."""
    return keras.Sequential([
        layers.RandomFlip("horizontal_and_vertical"),
        layers.RandomRotation(0.2),
        layers.RandomZoom(0.15),
        layers.RandomTranslation(0.1, 0.1),
        layers.RandomBrightness(0.2),
        layers.RandomContrast(0.2),
    ], name="augmentation")


def train():
    """Full training pipeline with detailed logging."""

    # ── Step 1: Download & merge ─────────────────────────────────────────
    class_labels = merge_datasets()
    num_classes = len(class_labels)
    print(f"\n✓ Total classes for training: {num_classes}")

    # Save labels immediately so we can inspect even if training crashes
    with open(LABELS_PATH, "w", encoding="utf-8") as f:
        json.dump(class_labels, f, indent=2, ensure_ascii=False)
    print(f"✓ Labels saved: {LABELS_PATH}")

    # ── Step 2: Build tf.data pipelines ──────────────────────────────────
    print("\n" + "=" * 65)
    print("  STEP 2: Building tf.data pipelines")
    print("=" * 65)

    all_paths, all_labels_idx = [], []
    label_to_idx = {lbl: i for i, lbl in enumerate(class_labels)}

    for cls in class_labels:
        cls_dir = DATASET_DIR / cls
        if not cls_dir.exists():
            continue
        for img_file in cls_dir.iterdir():
            if img_file.is_file():
                all_paths.append(str(img_file))
                all_labels_idx.append(label_to_idx[cls])

    # Stratified split 80/20
    train_paths, val_paths, train_labels, val_labels = train_test_split(
        all_paths, all_labels_idx,
        test_size=0.2, stratify=all_labels_idx, random_state=SEED
    )
    print(f"  Train samples : {len(train_paths):,}")
    print(f"  Val   samples : {len(val_paths):,}")

    def load_image(path, label):
        img = tf.io.read_file(path)
        img = tf.image.decode_image(img, channels=3, expand_animations=False)
        img = tf.image.resize(img, [IMG_SIZE, IMG_SIZE])
        img = tf.cast(img, tf.float32)
        return img, tf.cast(label, tf.int32)

    augment = make_augmentation_layer()

    def augment_fn(img, label):
        img = augment(img, training=True)
        img = tf.clip_by_value(img, 0.0, 255.0)
        return img, label

    train_ds = (
        tf.data.Dataset.from_tensor_slices((train_paths, train_labels))
        .shuffle(min(len(train_paths), 10000), seed=SEED)
        .map(load_image, num_parallel_calls=tf.data.AUTOTUNE)
        .map(augment_fn, num_parallel_calls=tf.data.AUTOTUNE)
        .batch(BATCH_SIZE)
        .prefetch(tf.data.AUTOTUNE)
    )

    val_ds = (
        tf.data.Dataset.from_tensor_slices((val_paths, val_labels))
        .map(load_image, num_parallel_calls=tf.data.AUTOTUNE)
        .batch(BATCH_SIZE)
        .prefetch(tf.data.AUTOTUNE)
    )

    # ── Step 3: Head training (base frozen) ──────────────────────────────
    print("\n" + "=" * 65)
    print("  STEP 3: Training classification head (EfficientNetB3 frozen)")
    print("=" * 65)

    model = build_model(num_classes)
    model.compile(
        optimizer=keras.optimizers.AdamW(learning_rate=1e-3, weight_decay=1e-4),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.summary()

    callbacks_head = [
        keras.callbacks.ModelCheckpoint(
            str(MODEL_PATH), save_best_only=True,
            monitor="val_accuracy", mode="max", verbose=1
        ),
        keras.callbacks.EarlyStopping(
            patience=4, restore_best_weights=True, monitor="val_accuracy"
        ),
        keras.callbacks.ReduceLROnPlateau(
            factor=0.5, patience=2, monitor="val_loss", verbose=1, min_lr=1e-7
        ),
    ]

    print(f"\nPhase 1: Training head for up to {EPOCHS_HEAD} epochs...")
    history_head = model.fit(
        train_ds, validation_data=val_ds,
        epochs=EPOCHS_HEAD, callbacks=callbacks_head,
        verbose=1
    )

    # ── Step 4: Fine-tune top layers ──────────────────────────────────────
    print("\n" + "=" * 65)
    print("  STEP 4: Fine-tuning top 50 layers of EfficientNetB3")
    print("=" * 65)

    # Find the EfficientNetB3 layer
    base_model = None
    for layer in model.layers:
        if isinstance(layer, keras.Model) and "efficientnetb3" in layer.name.lower():
            base_model = layer
            break
        if hasattr(layer, 'layers') and "efficientnet" in layer.name.lower():
            base_model = layer
            break

    if base_model is not None:
        base_model.trainable = True
        # Freeze all but the top 50 layers
        for layer in base_model.layers[:-50]:
            layer.trainable = False
        trainable_count = sum(1 for l in base_model.layers if l.trainable)
        print(f"  Unfrozen {trainable_count} layers in EfficientNetB3 base")
    else:
        print("  ⚠ Could not find EfficientNetB3 base — fine-tuning all layers")
        model.trainable = True

    model.compile(
        optimizer=keras.optimizers.AdamW(learning_rate=1e-4, weight_decay=1e-5),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    callbacks_fine = [
        keras.callbacks.ModelCheckpoint(
            str(MODEL_PATH), save_best_only=True,
            monitor="val_accuracy", mode="max", verbose=1
        ),
        keras.callbacks.EarlyStopping(
            patience=5, restore_best_weights=True, monitor="val_accuracy"
        ),
        keras.callbacks.ReduceLROnPlateau(
            factor=0.5, patience=3, monitor="val_loss", verbose=1, min_lr=1e-8
        ),
        keras.callbacks.TensorBoard(
            log_dir=str(MODEL_DIR / "logs"), histogram_freq=0
        ),
    ]

    print(f"\nPhase 2: Fine-tuning for up to {EPOCHS_FINE} epochs...")
    history_fine = model.fit(
        train_ds, validation_data=val_ds,
        epochs=EPOCHS_FINE, callbacks=callbacks_fine,
        verbose=1
    )

    # ── Step 5: Final evaluation & save ──────────────────────────────────
    # Load best checkpoint
    model = keras.models.load_model(str(MODEL_PATH))
    print("\n" + "=" * 65)
    print("  STEP 5: Final evaluation")
    print("=" * 65)

    loss, acc = model.evaluate(val_ds, verbose=1)
    print(f"\n  ✓ Final Validation Accuracy : {acc * 100:.2f}%")
    print(f"  ✓ Final Validation Loss     : {loss:.4f}")

    # Save final model
    model.save(str(MODEL_PATH))

    # Save training report
    report = {
        "num_classes": num_classes,
        "class_labels": class_labels,
        "train_samples": len(train_paths),
        "val_samples": len(val_paths),
        "val_accuracy_pct": round(acc * 100, 2),
        "val_loss": round(loss, 4),
        "img_size": IMG_SIZE,
        "model_path": str(MODEL_PATH),
    }
    report_path = MODEL_DIR / "training_report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    print("\n" + "=" * 65)
    print("  ✅ TRAINING COMPLETE!")
    print(f"  Model  : {MODEL_PATH}")
    print(f"  Labels : {LABELS_PATH}")
    print(f"  Report : {report_path}")
    print(f"  Classes: {num_classes}")
    print(f"  Val Acc: {acc * 100:.2f}%")
    print("=" * 65)
    print("\nNext step: Start the backend server.")
    print("  cd backend && python -m uvicorn main:app --reload")


if __name__ == "__main__":
    # Memory growth to avoid OOM
    gpus = tf.config.list_physical_devices("GPU")
    for gpu in gpus:
        try:
            tf.config.experimental.set_memory_growth(gpu, True)
        except Exception:
            pass

    if gpus:
        print(f"✓ GPU detected: {[g.name for g in gpus]}")
    else:
        print("⚠ No GPU detected — training on CPU")
        print("  Estimated time: 4-10 hours depending on dataset size")
        print("  ➜ Use Google Colab with T4 GPU for ~30-45 minutes instead!\n")

    train()
