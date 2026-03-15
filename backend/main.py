
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
import time

from routers import (
    auth, profiles, policies, tips, crop_scans, 
    yield_predictions, chat, dealer, ai,
    market_prices, nearby_markets
)

# 1. Initialize Tables
Base.metadata.create_all(bind=engine)

# Use redirect_slashes=False to prevent CORS-breaking 307 redirects
app = FastAPI(title="FarmGenius API", redirect_slashes=False)

# Log all requests for debugging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        print(f"DEBUG: {request.method} {request.url.path} - Status: {response.status_code} - {process_time:.2f}ms")
        return response
    except Exception as e:
        print(f"DEBUG ERROR: {request.method} {request.url.path} - {str(e)}")
        raise

# 2. CORS CONFIGURATION
origins = [
    "http://localhost:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://*.onrender.com",
    "https://*.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. ROUTERS
# Ensure the prefixes match what your frontend is calling
app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(market_prices.router)
app.include_router(nearby_markets.router)
app.include_router(policies.router)
app.include_router(tips.router)
app.include_router(crop_scans.router)
app.include_router(yield_predictions.router)
app.include_router(chat.router)
app.include_router(dealer.router)
app.include_router(ai.router)
app.include_router(market_prices.router)
app.include_router(nearby_markets.router)

@app.get("/")
def root():
    return {"message": "FarmGenius API is live!", "health_check": "/api/health"}

@app.get("/api/health")
def health():
    return {"status": "ok"}