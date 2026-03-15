from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from typing import List

router = APIRouter(prefix="/api/market-prices", tags=["market-prices"])


@router.get("", response_model=List[schemas.MarketPriceRead])
def get_market_prices(db: Session = Depends(get_db)):
    return db.query(models.MarketPrice).order_by(models.MarketPrice.updated_at.desc()).all()
