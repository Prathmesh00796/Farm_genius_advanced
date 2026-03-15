"""
Seed script — populates the database with initial demo data.
Run from the backend/ directory:
    python seed.py
"""
import uuid
from datetime import date, datetime
from database import SessionLocal, engine, Base
import models

# Create all tables first
Base.metadata.create_all(bind=engine)

db = SessionLocal()

def seed_market_prices():
    if db.query(models.MarketPrice).count() > 0:
        return
    items = [
        {"crop": "Wheat", "variety": "Sharbati", "market": "Indore Mandi", "location": "Indore, MP", "price_per_quintal": 2150.00, "trend_percentage": 2.3},
        {"crop": "Rice", "variety": "Basmati 1121", "market": "Amritsar Mandi", "location": "Amritsar, Punjab", "price_per_quintal": 4200.00, "trend_percentage": -1.2},
        {"crop": "Soybean", "variety": "JS 335", "market": "Ujjain Mandi", "location": "Ujjain, MP", "price_per_quintal": 4500.00, "trend_percentage": 5.1},
        {"crop": "Cotton", "variety": "Bt Cotton", "market": "Akola Mandi", "location": "Akola, Maharashtra", "price_per_quintal": 6200.00, "trend_percentage": 3.8},
        {"crop": "Maize", "variety": "Hybrid", "market": "Gulbarga Mandi", "location": "Gulbarga, Karnataka", "price_per_quintal": 1850.00, "trend_percentage": -0.5},
        {"crop": "Tomato", "variety": "Hybrid", "market": "Nasik Mandi", "location": "Nasik, Maharashtra", "price_per_quintal": 1200.00, "trend_percentage": 10.2},
        {"crop": "Onion", "variety": "Red Nasik", "market": "Lasalgaon Mandi", "location": "Nasik, Maharashtra", "price_per_quintal": 1800.00, "trend_percentage": -3.1},
        {"crop": "Sugarcane", "variety": "CO-0238", "market": "Kolhapur Mandi", "location": "Kolhapur, Maharashtra", "price_per_quintal": 320.00, "trend_percentage": 1.5},
    ]
    for item in items:
        db.add(models.MarketPrice(id=str(uuid.uuid4()), **item))
    db.commit()
    print("✅ Market prices seeded")


def seed_nearby_markets():
    if db.query(models.NearbyMarket).count() > 0:
        return
    markets = [
        {
            "name": "Indore Main Mandi",
            "address": "Chhawani Road, Indore, Madhya Pradesh",
            "phone": "0731-2465800",
            "opening_hours": "Mon–Sat, 6AM–6PM",
            "available_crops": ["Wheat", "Soybean", "Garlic", "Onion"],
            "rating": 4.2,
            "latitude": 22.7196,
            "longitude": 75.8577,
        },
        {
            "name": "Nasik Agricultural Produce Market",
            "address": "Market Yard, Nasik, Maharashtra",
            "phone": "0253-2310234",
            "opening_hours": "Mon–Sun, 5AM–7PM",
            "available_crops": ["Onion", "Tomato", "Grapes", "Pomegranate"],
            "rating": 4.5,
            "latitude": 19.9975,
            "longitude": 73.7898,
        },
        {
            "name": "Amritsar Grain Market",
            "address": "Lawrence Road, Amritsar, Punjab",
            "phone": "0183-2553200",
            "opening_hours": "Mon–Sat, 7AM–5PM",
            "available_crops": ["Rice", "Wheat", "Maize"],
            "rating": 4.0,
            "latitude": 31.6340,
            "longitude": 74.8723,
        },
    ]
    for m in markets:
        db.add(models.NearbyMarket(id=str(uuid.uuid4()), **m))
    db.commit()
    print("✅ Nearby markets seeded")


def seed_policies():
    if db.query(models.GovernmentPolicy).count() > 0:
        return
    policies = [
        {
            "title": "PM-KISAN Samman Nidhi Scheme",
            "description": "Under PM-KISAN, eligible farmer families receive financial benefit of Rs 6000/- per year, paid in three equal installments of Rs 2000/- each, every four months.",
            "category": "Financial Support",
            "published_date": date(2024, 2, 24),
            "link": "https://pmkisan.gov.in/",
        },
        {
            "title": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
            "description": "Provides comprehensive financial support to farmers suffering crop loss/damage due to unforeseen events. Premium rates are very low — 2% for Kharif and 1.5% for Rabi crops.",
            "category": "Crop Insurance",
            "published_date": date(2024, 1, 13),
            "link": "https://pmfby.gov.in/",
        },
        {
            "title": "Soil Health Card Scheme",
            "description": "Provides soil health cards to farmers which carry crop-wise recommendations of nutrients/fertilizers required. Helps farmers improve productivity through judicious use of inputs.",
            "category": "Soil Health",
            "published_date": date(2023, 11, 5),
            "link": "https://soilhealth.dac.gov.in/",
        },
        {
            "title": "Kisan Credit Card (KCC)",
            "description": "Aims to provide adequate and timely credit support from the banking system to the farmers for their cultivation and other agricultural needs. Covers short-term credit requirements, post-harvest expenses, and maintenance needs.",
            "category": "Credit & Finance",
            "published_date": date(2023, 8, 20),
            "link": "https://www.nabard.org/content1.aspx?id=572",
        },
    ]
    for p in policies:
        db.add(models.GovernmentPolicy(id=str(uuid.uuid4()), **p))
    db.commit()
    print("✅ Government policies seeded")


def seed_tips():
    if db.query(models.AgriculturalTip).count() > 0:
        return
    tips = [
        {
            "title": "Best Time to Sow Wheat",
            "content": "For optimal wheat yield, sow between November 1–25. Late sowing after December 15 can reduce yield by 15–25%. Ensure soil moisture is adequate — neither too dry nor waterlogged.",
            "category": "Sowing",
            "is_alert": False,
        },
        {
            "title": "Alert: Pink Bollworm Threat in Cotton",
            "content": "Pink bollworm (PBW) infestation has been reported in several cotton-growing districts. Regularly monitor your crop and use pheromone traps. If infestation exceeds ETL, apply recommended pesticides.",
            "category": "Pest Alert",
            "is_alert": True,
        },
        {
            "title": "Drip Irrigation Saves 40% Water",
            "content": "Switch from flood irrigation to drip irrigation for vegetables and fruit crops. Studies show drip irrigation can reduce water usage by 40% while increasing yield by 20–25%.",
            "category": "Water Management",
            "is_alert": False,
        },
        {
            "title": "Use Neem-Based Pesticides",
            "content": "Neem-based bio-pesticides are effective against a wide range of pests and are safe for beneficial insects like bees. They are also cheaper than chemical pesticides and cause no soil damage.",
            "category": "Organic Farming",
            "is_alert": False,
        },
    ]
    for t in tips:
        db.add(models.AgriculturalTip(id=str(uuid.uuid4()), published_at=datetime.utcnow(), **t))
    db.commit()
    print("✅ Agricultural tips seeded")


if __name__ == "__main__":
    seed_market_prices()
    seed_nearby_markets()
    seed_policies()
    seed_tips()
    db.close()
    print("\n🎉 Database seeded successfully!")
