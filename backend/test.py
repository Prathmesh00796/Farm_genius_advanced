import asyncio
import os
import httpx
from dotenv import load_dotenv
load_dotenv()
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions'

async def test():
    import random
    kaggle_diseases = ['Apple Scab', 'Apple Black Rot', 'Healthy']
    top_n = 2
    predicted_diseases = random.sample(kaggle_diseases, top_n)
    confidences = sorted([random.randint(15, 88) for _ in range(top_n)], reverse=True)
    predictions_str = ', '.join([f'{d} ({c}%)' for d, c in zip(predicted_diseases, confidences)])
    primary_disease = predicted_diseases[0]

    prompt = f"""You are an agricultural plant disease expert.
    A deep learning model trained on a Kaggle dataset has analyzed a crop image.
    The model predicts these possible conditions: {predictions_str}.
    
    Based on these ML predictions, provide detailed information focusing primarily on the most likely disease: {primary_disease}.
    Respond ONLY with valid JSON in this exact format:
    {{
      "disease_name": "{primary_disease}",
      "confidence": {confidences[0]},
      "severity": "mild|moderate|severe|none",
      "affected_parts": "leaves, stems, roots etc",
      "description": "Brief description focusing on {primary_disease}, and mentioning why the model might consider the other predicted options.",
      "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
    }}
    Do not include any extra text outside the JSON."""

    headers = {'Authorization': f'Bearer {OPENROUTER_API_KEY}', 'Content-Type': 'application/json'}
    payload = {'model': 'meta-llama/Meta-Llama-3.1-8B-Instruct:free', 'messages': [{'role': 'user', 'content': prompt}]}
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(OPENROUTER_BASE, headers=headers, json=payload)
        print('1', resp.status_code, resp.text)
        payload['model'] = 'nvidia/nemotron-3-super-120b-a12b:free'
        resp2 = await client.post(OPENROUTER_BASE, headers=headers, json=payload)
        print('2', resp2.status_code, resp2.text)

asyncio.run(test())
