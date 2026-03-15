from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from typing import List

router = APIRouter(prefix="/api/tips", tags=["tips"])


@router.get("", response_model=List[schemas.TipRead])
def get_tips(db: Session = Depends(get_db)):
    return db.query(models.AgriculturalTip).order_by(models.AgriculturalTip.published_at.desc()).all()
