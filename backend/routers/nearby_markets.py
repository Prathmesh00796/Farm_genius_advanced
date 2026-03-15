from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from typing import List

router = APIRouter(prefix="/api/nearby-markets", tags=["nearby-markets"])


@router.get("", response_model=List[schemas.NearbyMarketRead])
def get_nearby_markets(db: Session = Depends(get_db)):
    return db.query(models.NearbyMarket).all()
