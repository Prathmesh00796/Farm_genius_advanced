import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Float, Integer, Boolean, Date,
    DateTime, ForeignKey, Enum as SAEnum, JSON, DECIMAL
)
from sqlalchemy.orm import relationship
from database import Base
import enum


def gen_uuid():
    return str(uuid.uuid4())


class AppRole(str, enum.Enum):
    farmer = "farmer"
    dealer = "dealer"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    user_roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    crop_scans = relationship("CropScan", back_populates="user", cascade="all, delete-orphan")
    yield_predictions = relationship("YieldPrediction", back_populates="user", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False, default="")
    phone = Column(String(20))
    email = Column(String(255))
    village_city = Column(String(255))
    avatar_url = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")


class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(SAEnum(AppRole), nullable=False, default=AppRole.farmer)

    user = relationship("User", back_populates="user_roles")


class CropScan(Base):
    __tablename__ = "crop_scans"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(Text, nullable=False)
    disease_name = Column(String(255))
    confidence = Column(DECIMAL(5, 2))
    description = Column(Text)
    recommendations = Column(JSON)
    severity = Column(String(20))
    affected_parts = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="crop_scans")


class YieldPrediction(Base):
    __tablename__ = "yield_predictions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    crop_type = Column(String(100), nullable=False)
    soil_type = Column(String(100), nullable=False)
    area_acres = Column(DECIMAL(10, 2), nullable=False)
    sowing_date = Column(Date, nullable=False)
    irrigation_type = Column(String(100), nullable=False)
    fertilizer_used = Column(String(100), nullable=False)
    estimated_yield = Column(DECIMAL(10, 2))
    harvest_days = Column(Integer)
    estimated_revenue = Column(DECIMAL(12, 2))
    comparison_to_avg = Column(String(20))
    recommendations = Column(JSON)
    risk_factors = Column(JSON)
    optimal_harvest_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="yield_predictions")


class MarketPrice(Base):
    __tablename__ = "market_prices"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    crop = Column(String(100), nullable=False)
    variety = Column(String(100), nullable=False)
    market = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    price_per_quintal = Column(DECIMAL(10, 2), nullable=False)
    trend_percentage = Column(DECIMAL(5, 2))
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class NearbyMarket(Base):
    __tablename__ = "nearby_markets"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=False)
    phone = Column(String(20))
    opening_hours = Column(String(100))
    available_crops = Column(JSON)
    rating = Column(DECIMAL(2, 1))
    latitude = Column(DECIMAL(10, 8))
    longitude = Column(DECIMAL(11, 8))


class GovernmentPolicy(Base):
    __tablename__ = "government_policies"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    published_date = Column(Date, nullable=False)
    link = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    conversation_id = Column(String(36), nullable=False)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_messages")


class AgriculturalTip(Base):
    __tablename__ = "agricultural_tips"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    is_alert = Column(Boolean, default=False)
    published_at = Column(DateTime, default=datetime.utcnow)


# Dealer-specific tables

class DealerBuyOffer(Base):
    __tablename__ = "dealer_buy_offers"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    dealer_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    crop_type = Column(String(100), nullable=False)
    variety = Column(String(100))
    quantity_quintals = Column(DECIMAL(10, 2), nullable=False)
    price_per_quintal = Column(DECIMAL(10, 2), nullable=False)
    quality_requirements = Column(Text)
    location = Column(String(255))
    valid_until = Column(Date)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)


class DealerInventory(Base):
    __tablename__ = "dealer_inventory"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    dealer_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    crop_type = Column(String(100), nullable=False)
    variety = Column(String(100))
    quantity_quintals = Column(DECIMAL(10, 2), nullable=False)
    purchase_price = Column(DECIMAL(10, 2))
    selling_price = Column(DECIMAL(10, 2))
    storage_location = Column(String(255))
    purchase_date = Column(Date)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class DealerOrder(Base):
    __tablename__ = "dealer_orders"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    dealer_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    farmer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    crop_type = Column(String(100), nullable=False)
    variety = Column(String(100))
    quantity_quintals = Column(DECIMAL(10, 2), nullable=False)
    price_per_quintal = Column(DECIMAL(10, 2), nullable=False)
    total_amount = Column(DECIMAL(12, 2))
    status = Column(String(30), default="pending")
    farmer_name = Column(String(255))
    farmer_village = Column(String(255))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
