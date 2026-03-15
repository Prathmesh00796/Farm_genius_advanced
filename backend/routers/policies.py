from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from typing import List

router = APIRouter(prefix="/api/policies", tags=["policies"])


@router.get("", response_model=List[schemas.PolicyRead])
def get_policies(db: Session = Depends(get_db)):
    return db.query(models.GovernmentPolicy).order_by(models.GovernmentPolicy.published_date.desc()).all()
