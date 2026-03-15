
import json

labels = [
    "Apple_Apple_Scab",
    "Apple_Black_Rot",
    "Apple_Cedar_Rust",
    "Apple_Healthy",
    "Background_without_leaves",
    "Blueberry_Healthy",
    "Cherry_Powdery_Mildew",
    "Cherry_Healthy",
    "Corn_Gray_Leaf_Spot",
    "Corn_Common_Rust",
    "Corn_Northern_Leaf_Blight",
    "Corn_Healthy",
    "Grape_Black_Rot",
    "Grape_Esca_Black_Measles",
    "Grape_Leaf_Blight",
    "Grape_Healthy",
    "Orange_Citrus_Greening",
    "Peach_Bacterial_Spot",
    "Peach_Healthy",
    "Pepper_Bacterial_Spot",
    "Pepper_Healthy",
    "Potato_Early_Blight",
    "Potato_Late_Blight",
    "Potato_Healthy",
    "Raspberry_Healthy",
    "Soybean_Healthy",
    "Squash_Powdery_Mildew",
    "Strawberry_Leaf_Scorch",
    "Strawberry_Healthy",
    "Tomato_Bacterial_Spot",
    "Tomato_Early_Blight",
    "Tomato_Late_Blight",
    "Tomato_Leaf_Mold",
    "Tomato_Septoria_Leaf_Spot",
    "Tomato_Spider_Mites",
    "Tomato_Target_Spot",
    "Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato_Mosaic_Virus",
    "Tomato_Healthy"
]

with open('backend/models/class_labels.json', 'w', encoding='utf-8') as f:
    json.dump(labels, f, indent=2)

print(f"Saved {len(labels)} labels to backend/models/class_labels.json")
