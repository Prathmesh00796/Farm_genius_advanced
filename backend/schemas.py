from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional
from pydantic import BaseModel, EmailStr, field_validator
import enum


class Role(str, enum.Enum):
    farmer = "farmer"
    dealer = "dealer"
    admin = "admin"


# ─── Auth ─────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    village_city: Optional[str] = None
    role: Role = Role.farmer


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str


# ─── Profile ──────────────────────────────────────────────────────────────────

class ProfileRead(BaseModel):
    id: str
    user_id: str
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    village_city: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    village_city: Optional[str] = None
    avatar_url: Optional[str] = None


# ─── Market Prices ────────────────────────────────────────────────────────────

class MarketPriceRead(BaseModel):
    id: str
    crop: str
    variety: str
    market: str
    location: str
    price_per_quintal: Decimal
    trend_percentage: Optional[Decimal] = None
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── Nearby Markets ───────────────────────────────────────────────────────────

class NearbyMarketRead(BaseModel):
    id: str
    name: str
    address: str
    phone: Optional[str] = None
    opening_hours: Optional[str] = None
    available_crops: Optional[list[str]] = None
    rating: Optional[Decimal] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None

    class Config:
        from_attributes = True


# ─── Government Policies ──────────────────────────────────────────────────────

class PolicyRead(BaseModel):
    id: str
    title: str
    description: str
    category: str
    published_date: date
    link: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Agricultural Tips ────────────────────────────────────────────────────────

class TipRead(BaseModel):
    id: str
    title: str
    content: str
    category: str
    is_alert: bool
    published_at: datetime

    class Config:
        from_attributes = True


# ─── Crop Scans ───────────────────────────────────────────────────────────────

class CropScanCreate(BaseModel):
    image_url: str


class CropScanRead(BaseModel):
    id: str
    user_id: str
    image_url: str
    disease_name: Optional[str] = None
    confidence: Optional[Decimal] = None
    description: Optional[str] = None
    recommendations: Optional[list[str]] = None
    severity: Optional[str] = None
    affected_parts: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Yield Predictions ────────────────────────────────────────────────────────

class YieldPredictionCreate(BaseModel):
    crop_type: str
    soil_type: str
    area_acres: float
    sowing_date: date
    irrigation_type: str
    fertilizer_used: str
    estimated_yield: Optional[float] = None
    harvest_days: Optional[int] = None
    estimated_revenue: Optional[float] = None
    comparison_to_avg: Optional[str] = None
    recommendations: Optional[list[dict[str, str]]] = None
    risk_factors: Optional[list[str]] = None
    optimal_harvest_date: Optional[date] = None


class Recommendation(BaseModel):
    title: str
    description: str


class YieldPredictionRead(BaseModel):
    id: str
    user_id: str
    crop_type: str
    soil_type: str
    area_acres: Decimal
    sowing_date: date
    irrigation_type: str
    fertilizer_used: str
    estimated_yield: Optional[Decimal] = None
    harvest_days: Optional[int] = None
    estimated_revenue: Optional[Decimal] = None
    comparison_to_avg: Optional[str] = None
    recommendations: Optional[list[dict[str, str]]] = None
    risk_factors: Optional[list[str]] = None
    optimal_harvest_date: Optional[date] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Chat ─────────────────────────────────────────────────────────────────────

class ChatMessageCreate(BaseModel):
    conversation_id: str
    role: str
    content: str


class ChatMessageRead(BaseModel):
    id: str
    user_id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Dealer ───────────────────────────────────────────────────────────────────

class BuyOfferCreate(BaseModel):
    crop_type: str
    variety: Optional[str] = None
    quantity_quintals: float
    price_per_quintal: float
    quality_requirements: Optional[str] = None
    location: Optional[str] = None
    valid_until: Optional[date] = None


class BuyOfferRead(BaseModel):
    id: str
    dealer_id: str
    crop_type: str
    variety: Optional[str] = None
    quantity_quintals: Decimal
    price_per_quintal: Decimal
    quality_requirements: Optional[str] = None
    location: Optional[str] = None
    valid_until: Optional[date] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class InventoryCreate(BaseModel):
    crop_type: str
    variety: Optional[str] = None
    quantity_quintals: float
    purchase_price: Optional[float] = None
    selling_price: Optional[float] = None
    storage_location: Optional[str] = None
    purchase_date: Optional[date] = None
    notes: Optional[str] = None


class InventoryRead(BaseModel):
    id: str
    dealer_id: str
    crop_type: str
    variety: Optional[str] = None
    quantity_quintals: Decimal
    purchase_price: Optional[Decimal] = None
    selling_price: Optional[Decimal] = None
    storage_location: Optional[str] = None
    purchase_date: Optional[date] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    farmer_id: Optional[str] = None
    crop_type: str
    variety: Optional[str] = None
    quantity_quintals: float
    price_per_quintal: float
    farmer_name: Optional[str] = None
    farmer_village: Optional[str] = None
    notes: Optional[str] = None


class OrderRead(BaseModel):
    id: str
    dealer_id: str
    farmer_id: Optional[str] = None
    crop_type: str
    variety: Optional[str] = None
    quantity_quintals: Decimal
    price_per_quintal: Decimal
    total_amount: Optional[Decimal] = None
    status: str
    farmer_name: Optional[str] = None
    farmer_village: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str


# ─── AI Endpoint Requests ─────────────────────────────────────────────────────

class AnalyzeCropRequest(BaseModel):
    imageUrl: Optional[str] = None          # URL to an existing image
    imageData: Optional[str] = None         # base64 data URI (data:image/jpeg;base64,...)
    language: Optional[str] = "en"


class PredictYieldRequest(BaseModel):
    cropType: str
    soilType: str
    areaAcres: float
    sowingDate: str
    irrigationType: str
    fertilizerUsed: str
    language: Optional[str] = "en"


class FarmChatRequest(BaseModel):
    messages: list[dict[str, Any]]
