import json
import os
import httpx
import random
import sys
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth as auth_utils
from dotenv import load_dotenv

# Pre-import heavy modules to speed up first request
try:
    import disease_predictor
except ImportError:
    disease_predictor = None

# Add backend root to path so we can import disease modules
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from disease_names import DISEASE_TRANSLATIONS, get_disease_info, TTS_LANG_CODES

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv(
    "OPENROUTER_MODEL",
    "meta-llama/Meta-Llama-3.1-8B-Instruct:free",
)
OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions"

router = APIRouter(prefix="/api/ai", tags=["ai"])


# Optimize OpenRouter calls by using faster models
async def call_openrouter(messages: list[dict], model: str = None) -> str:
    """Call OpenRouter chat completions and return the plain text content."""
    if not OPENROUTER_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="OpenRouter API key not configured. Set OPENROUTER_API_KEY in backend/.env",
        )

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "X-Title": "FarmGenius",
    }
    
    # Use faster, smaller models for quicker responses
    fast_models = [
        "google/gemini-flash-1.5:free",
        "meta-llama/llama-3.1-8b-instruct:free",
        "mistralai/mistral-7b-instruct:free",
        "qwen/qwen-2.5-7b-instruct:free"
    ]
    
    models_to_try = [model] + fast_models if model else fast_models

    async with httpx.AsyncClient(timeout=30) as client: # Reduced timeout for faster failover
        for current_model in models_to_try:
            payload = {
                "model": current_model,
                "messages": messages,
                "temperature": 0.3, # Lower temperature for faster, more focused output
                "max_tokens": 800,
            }
            
            try:
                resp = await client.post(OPENROUTER_BASE, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
            except Exception:
                continue
                
    raise HTTPException(status_code=503, detail="AI models too slow or unavailable.")

async def call_openrouter_vision(image_data: str, prompt: str, model: str = None) -> str:
    """Call OpenRouter with an image for analysis."""
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=503, detail="OpenRouter API key not configured.")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "X-Title": "FarmGenius",
    }
    
    # Prioritize Gemini Flash for speed
    vision_models = [
        "google/gemini-flash-1.5:free",
        "openrouter/free",
        "google/gemini-flash-1.5-8b:free",
    ]
    
    if model:
        vision_models = [model] + vision_models

    if not image_data.startswith("data:"):
        if len(image_data) > 200:
             image_data = f"data:image/jpeg;base64,{image_data}"

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": image_data}}
            ]
        }
    ]

    async with httpx.AsyncClient(timeout=45) as client: # Faster timeout
        for current_model in vision_models:
            payload = {
                "model": current_model,
                "messages": messages,
                "max_tokens": 800,
            }
            try:
                resp = await client.post(OPENROUTER_BASE, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
            except Exception:
                continue
    
    raise HTTPException(status_code=503, detail="Vision AI timed out.")


@router.post("/analyze-crop")
async def analyze_crop(
    req: schemas.AnalyzeCropRequest,
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """
    ULTIMATE Hybrid Diagnostic System.
    1. USES LOCAL PyTorch MODEL (MobileNetV2) for initial disease prediction.
    2. USES AI (OpenRouter) to generate detailed reports based on the prediction.
    """
    FULL_LANG_MAP = {
        "en": "English", "hi": "Hindi", "mr": "Marathi",
        "kn": "Kannada", "te": "Telugu", "ta": "Tamil",
        "bn": "Bengali", "gu": "Gujarati", "pa": "Punjabi", "ur": "Urdu",
    }
    lang = req.language if req.language in FULL_LANG_MAP else "en"
    response_lang = FULL_LANG_MAP[lang]

    # ── 1. Local Model Prediction ────────────────────────────────────────
    ml_predictions = []
    try:
        if disease_predictor:
            image_input = req.imageData or req.imageUrl or ""
            if image_input:
                if image_input.startswith("data:") or (len(image_input) > 200 and "/" not in image_input[:30]):
                    ml_predictions = disease_predictor.predict_from_base64(image_input)
                elif image_input.startswith("http"):
                    ml_predictions = disease_predictor.predict_from_url(image_input)
    except Exception as ml_err:
        print(f"DEBUG ERROR: Local ML model prediction failed: {ml_err}")

    # ── 2. Get detailed info from AI (Hybrid Intelligence) ──────────────
    result: dict = {}
    
    # Use AI for a professional report if local model predicted something 
    # OR fallback to Vision AI if local model is completely unconfident (0%)
    use_vision_fallback = not ml_predictions or ml_predictions[0]["confidence_pct"] < 5

    if not use_vision_fallback:
        primary_class = ml_predictions[0]["class_name"]
        primary_conf  = ml_predictions[0]["confidence_pct"]
        display_name = primary_class.replace("___", " ").replace("__", " ").replace("_", " ")

        prompt = f"""You are a Senior Indian Agricultural Scientist (KVK Officer).
DIAGNOSIS: The local model identifies this as: {display_name} (Confidence: {primary_conf:.1f}%).

TASK: Generate a professional diagnostic report in {response_lang}.
STRICT RULES:
1. LANGUAGE: Respond ONLY in {response_lang}. 
2. ZERO ENGLISH: No English words in 'description', 'symptoms', or 'treatment'.
3. ACCURACY: Base your recommendations on Indian ICAR/KVK standards.
4. DOSAGE: Provide exact measurements (e.g., 2 ग्राम प्रति लीटर पानी).

Return ONLY valid JSON:
{{
  "disease_name": "Standard {response_lang} name",
  "canonical_name": "{primary_class}",
  "confidence": {primary_conf},
  "severity": "low/medium/high/critical",
  "affected_parts": "Parts in {response_lang}",
  "description": "Scientific explanation of {display_name} in 3-4 sentences in {response_lang}",
  "symptoms": ["Symptom 1 in {response_lang}", "Symptom 2"],
  "chemical_treatment": ["Fungicide/Pesticide name + EXACT DOSAGE in {response_lang}"],
  "organic_treatment": ["Traditional Indian solution in {response_lang}"],
  "preventive_measures": ["Cultural practices in {response_lang}"],
  "economic_impact": "Yield/Value impact in {response_lang}",
  "best_time_to_spray": "Best weather/time in {response_lang}",
  "when_to_consult_expert": "Consultation trigger in {response_lang}",
  "tts_summary": "Professional summary in {response_lang}"
}}"""

        try:
            text = await call_openrouter(messages=[{"role": "user", "content": prompt}])
            start = text.find("{")
            end   = text.rfind("}") + 1
            if start >= 0 and end > start:
                result = json.loads(text[start:end])
        except Exception as e:
            print(f"DEBUG: AI Report Error: {e}")

    # Fallback to direct Vision AI for zero-confidence cases
    if use_vision_fallback or not result:
        vision_prompt = f"""Expert Indian Agronomist: Identify crop/disease in {response_lang}.
Return ONLY valid JSON in {response_lang}:
{{
  "disease_name": "Standard {response_lang} name",
  "canonical_name": "English Technical Name",
  "confidence": 98,
  "severity": "low/medium/high/critical",
  "affected_parts": "Parts in {response_lang}",
  "description": "Scientific summary in {response_lang}",
  "symptoms": ["Visual symptom in {response_lang}"],
  "chemical_treatment": ["Fungicide + Dose in {response_lang}"],
  "organic_treatment": ["Bio-method in {response_lang}"],
  "preventive_measures": ["Prevention in {response_lang}"],
  "economic_impact": "Loss/Impact in {response_lang}",
  "best_time_to_spray": "Spray time in {response_lang}",
  "when_to_consult_expert": "Expert trigger in {response_lang}",
  "tts_summary": "Summary in {response_lang}"
}}"""
        try:
            image_input = req.imageData or req.imageUrl or ""
            text = await call_openrouter_vision(image_input, vision_prompt)
            start = text.find("{")
            end   = text.rfind("}") + 1
            if start >= 0 and end > start:
                result = json.loads(text[start:end])
        except Exception:
            pass

    # Emergency fallback if prediction or AI fails
    if not result:
        result = {
            "disease_name": "Unknown / Clear",
            "confidence": 0,
            "severity": "low",
            "affected_parts": "N/A",
            "description": "Please ensure the photo is clear and contains a visible plant leaf.",
            "symptoms": ["No clear disease detected by the local model."],
            "chemical_treatment": [],
            "organic_treatment": [],
            "preventive_measures": ["Keep monitoring your crop regularly."],
            "economic_impact": "None",
            "best_time_to_spray": "N/A",
            "when_to_consult_expert": "If symptoms appear, please rescan.",
            "tts_summary": "Diagnosis failed or crop appears healthy. Please try again with a clearer photo.",
        }

    # ── 3. All-language disease names (For UI tabs) ──────────────────────
    canonical_name = result.get("canonical_name", result.get("disease_name", "Unknown"))
    all_lang_names: dict[str, str] = {}
    if canonical_name in DISEASE_TRANSLATIONS:
        info = DISEASE_TRANSLATIONS[canonical_name]
        for code in ["en","hi","mr","kn","te","ta","bn","gu","pa","ur"]:
            all_lang_names[code] = info.get(code, info.get("en", canonical_name))
    else:
        dn = result.get("disease_name", canonical_name).replace("_", " ")
        for code in ["en","hi","mr","kn","te","ta","bn","gu","pa","ur"]:
            all_lang_names[code] = dn

    result["all_language_names"] = all_lang_names
    result["tts_lang_code"]      = TTS_LANG_CODES.get(lang, "hi-IN")
    result["model_used"]         = "ResNet18_HighAcc_Local"
    result["top_predictions"]    = ml_predictions or []
    
    return result


@router.post("/predict-yield")
async def predict_yield(
    req: schemas.PredictYieldRequest,
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    FULL_LANG_MAP = {
        "en": "English", "hi": "Hindi", "mr": "Marathi",
        "kn": "Kannada", "te": "Telugu", "ta": "Tamil",
        "bn": "Bengali", "gu": "Gujarati", "pa": "Punjabi", "ur": "Urdu",
    }
    lang = req.language if req.language in FULL_LANG_MAP else "en"
    response_lang = FULL_LANG_MAP[lang]

    prompt = f"""You are an expert Indian Agricultural Scientist (KVK Officer).
    
    TASK: Predict crop yield and provide detailed recommendations in {response_lang}.
    
    Farm details:
    - Crop: {req.cropType}
    - Soil type: {req.soilType}
    - Area: {req.areaAcres} acres
    - Sowing date: {req.sowingDate}
    - Irrigation: {req.irrigationType}
    - Fertilizer: {req.fertilizerUsed}
    
    STRICT RULES:
    - ALL text fields must be in {response_lang} (except yield_unit if it is technical like 'quintals/acre').
    - Provide realistic yield estimates based on Indian agricultural data for {req.cropType}.
    - Recommendations must be specific to Indian farming in {response_lang}.
    - Return ONLY valid JSON.
    
    Respond ONLY with valid JSON:
    {{
      "estimated_yield": 12.5,
      "yield_unit": "quintals/acre",
      "harvest_days": 120,
      "estimated_revenue": 56250,
      "comparison_to_avg": "+15% (High/Low/Avg)",
      "optimal_harvest_date": "YYYY-MM-DD",
      "recommendations": [
        {{"title": "Title in {response_lang}", "description": "Detailed description in {response_lang}"}},
        {{"title": "Title in {response_lang}", "description": "Detailed description in {response_lang}"}}
      ],
      "risk_factors": ["Risk 1 in {response_lang}", "Risk 2 in {response_lang}"]
    }}"""
    
    try:
        text = await call_openrouter(messages=[{"role": "user", "content": prompt}])
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(text[start:end])
    except Exception as e:
        print(f"Yield prediction error: {e}")
        
    # Emergency Fallback
    return {
        "estimated_yield": 10.0,
        "yield_unit": "quintals/acre",
        "harvest_days": 110,
        "estimated_revenue": 45000,
        "comparison_to_avg": "Average",
        "optimal_harvest_date": "2026-06-15",
        "recommendations": [
            {"title": "Soil Management", "description": "Ensure proper NPK balance."},
            {"title": "Irrigation", "description": "Maintain regular watering schedule."}
        ],
        "risk_factors": ["Weather dependency"]
    }


@router.post("/farm-chat")
async def farm_chat(
    req: schemas.FarmChatRequest,
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=503, detail="OpenRouter API key not configured")

    system_context = """You are FarmGenius AI, a helpful agricultural assistant for Indian farmers.
    You help with crop diseases, yield optimization, market prices, government schemes, 
    and general farming advice. You can respond in Hindi, Marathi, or English based on 
    the user's language preference. Be practical, specific, and encouraging."""

    # Build conversation for OpenRouter
    messages = [
        {"role": "system", "content": system_context},
    ]
    for msg in req.messages:
        role = "user" if msg["role"] == "user" else "assistant"
        messages.append({"role": role, "content": msg["content"]})

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "X-Title": "FarmGenius",
    }
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": messages,
        "stream": True,
    }

    async def generate():
        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream("POST", OPENROUTER_BASE, headers=headers, json=payload) as resp:
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data = line[6:].strip()
                    if not data or data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                        delta = chunk["choices"][0]["delta"]
                        text = delta.get("content", "")
                        if text:
                            yield f"data: {json.dumps({'text': text})}\n\n"
                    except (KeyError, json.JSONDecodeError):
                        continue

    return StreamingResponse(generate(), media_type="text/event-stream")
