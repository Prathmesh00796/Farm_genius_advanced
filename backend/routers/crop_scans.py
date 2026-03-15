from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth as auth_utils
from typing import List
import uuid

router = APIRouter(prefix="/api/crop-scans", tags=["crop-scans"])


@router.get("", response_model=List[schemas.CropScanRead])
def get_crop_scans(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.CropScan)
        .filter(models.CropScan.user_id == current_user.id)
        .order_by(models.CropScan.created_at.desc())
        .all()
    )


@router.post("", response_model=schemas.CropScanRead)
def create_crop_scan(
    data: schemas.CropScanCreate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    scan = models.CropScan(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        image_url=data.image_url,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan


@router.put("/{scan_id}", response_model=schemas.CropScanRead)
def update_crop_scan(
    scan_id: str,
    data: dict,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    scan = db.query(models.CropScan).filter(
        models.CropScan.id == scan_id,
        models.CropScan.user_id == current_user.id,
    ).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    for field, value in data.items():
        if hasattr(scan, field):
            setattr(scan, field, value)
    db.commit()
    db.refresh(scan)
    return scan
