
import tensorflow as tf
from pathlib import Path

MODEL_PATH = r"C:\Users\Prem\Downloads\plant_disease_recog_model_pwp.keras"

try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print(f"Model loaded successfully")
    print(f"Input shape: {model.input_shape}")
    print(f"Output shape: {model.output_shape}")
    num_classes = model.output_shape[-1]
    print(f"Number of classes: {num_classes}")
except Exception as e:
    print(f"Error loading model: {e}")
