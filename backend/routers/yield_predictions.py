from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth as auth_utils
from typing import List
import uuid

router = APIRouter(prefix="/api/yield-predictions", tags=["yield-predictions"])


@router.get("", response_model=List[schemas.YieldPredictionRead])
def get_yield_predictions(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.YieldPrediction)
        .filter(models.YieldPrediction.user_id == current_user.id)
        .order_by(models.YieldPrediction.created_at.desc())
        .all()
    )


@router.post("", response_model=schemas.YieldPredictionRead)
def create_yield_prediction(
    data: schemas.YieldPredictionCreate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    prediction = models.YieldPrediction(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        crop_type=data.crop_type,
        soil_type=data.soil_type,
        area_acres=data.area_acres,
        sowing_date=data.sowing_date,
        irrigation_type=data.irrigation_type,
        fertilizer_used=data.fertilizer_used,
        estimated_yield=data.estimated_yield,
        harvest_days=data.harvest_days,
        estimated_revenue=data.estimated_revenue,
        comparison_to_avg=data.comparison_to_avg,
        recommendations=data.recommendations,
        risk_factors=data.risk_factors,
        optimal_harvest_date=data.optimal_harvest_date,
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction


@router.put("/{prediction_id}", response_model=schemas.YieldPredictionRead)
def update_yield_prediction(
    prediction_id: str,
    data: dict,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    prediction = db.query(models.YieldPrediction).filter(
        models.YieldPrediction.id == prediction_id,
        models.YieldPrediction.user_id == current_user.id,
    ).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    for field, value in data.items():
        if hasattr(prediction, field):
            setattr(prediction, field, value)
    db.commit()
    db.refresh(prediction)
    return prediction
