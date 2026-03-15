from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth as auth_utils
from typing import List
import uuid

router = APIRouter(prefix="/api/dealer", tags=["dealer"])


def verify_dealer(current_user: models.User, db: Session):
    role = db.query(models.UserRole).filter(
        models.UserRole.user_id == current_user.id,
        models.UserRole.role.in_(["dealer", "admin"]),
    ).first()
    if not role:
        raise HTTPException(status_code=403, detail="Dealer access required")


# ─── Buy Offers ──────────────────────────────────────────────────────────────

@router.get("/buy-offers", response_model=List[schemas.BuyOfferRead])
def get_buy_offers(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    verify_dealer(current_user, db)
    return (
        db.query(models.DealerBuyOffer)
        .filter(models.DealerBuyOffer.dealer_id == current_user.id)
        .order_by(models.DealerBuyOffer.created_at.desc())
        .all()
    )


@router.post("/buy-offers", response_model=schemas.BuyOfferRead)
def create_buy_offer(
    data: schemas.BuyOfferCreate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    verify_dealer(current_user, db)
    offer = models.DealerBuyOffer(
        id=str(uuid.uuid4()),
        dealer_id=current_user.id,
        **data.model_dump(),
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


@router.delete("/buy-offers/{offer_id}")
def delete_buy_offer(
    offer_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    verify_dealer(current_user, db)
    offer = db.query(models.DealerBuyOffer).filter(
        models.DealerBuyOffer.id == offer_id,
        models.DealerBuyOffer.dealer_id == current_user.id,
    ).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    db.delete(offer)
    db.commit()
    return {"message": "Deleted"}


# ─── Inventory ──────────────────────────────────────────────────────────────

@router.get("/inventory", response_model=List[schemas.InventoryRead])
def get_inventory(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    verify_dealer(current_user, db)
    return (
        db.query(models.DealerInventory)
        .filter(models.DealerInventory.dealer_id == current_user.id)
        .order_by(models.DealerInventory.created_at.desc())
        .all()
    )


@router.post("/inventory", response_model=schemas.InventoryRead)
def add_inventory(
    data: schemas.InventoryCreate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    verify_dealer(current_user, db)
    item = models.DealerInventory(
        id=str(uuid.uuid4()),
        dealer_id=current_user.id,
        **data.model_dump(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/inventory/{item_id}")
def delete_inventory(
    item_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    verify_dealer(current_user, db)
    item = db.query(models.DealerInventory).filter(
        models.DealerInventory.id == item_id,
        models.DealerInventory.dealer_id == current_user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}


# ─── Orders ─────────────────────────────────────────────────────────────────

@router.get("/orders", response_model=List[schemas.OrderRead])
def get_orders(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    verify_dealer(current_user, db)
    return (
        db.query(models.DealerOrder)
        .filter(models.DealerOrder.dealer_id == current_user.id)
        .order_by(models.DealerOrder.created_at.desc())
        .all()
    )


@router.post("/orders", response_model=schemas.OrderRead)
def create_order(
    data: schemas.OrderCreate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    verify_dealer(current_user, db)
    total = float(data.quantity_quintals) * float(data.price_per_quintal)
    order = models.DealerOrder(
        id=str(uuid.uuid4()),
        dealer_id=current_user.id,
        total_amount=total,
        **data.model_dump(),
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.put("/orders/{order_id}", response_model=schemas.OrderRead)
def update_order_status(
    order_id: str,
    data: schemas.OrderStatusUpdate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    verify_dealer(current_user, db)
    order = db.query(models.DealerOrder).filter(
        models.DealerOrder.id == order_id,
        models.DealerOrder.dealer_id == current_user.id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = data.status
    db.commit()
    db.refresh(order)
    return order


# ─── Farmer Directory ────────────────────────────────────────────────────────

@router.get("/farmers")
def get_farmers(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    verify_dealer(current_user, db)
    farmer_roles = db.query(models.UserRole).filter(models.UserRole.role == "farmer").all()
    farmer_ids = [r.user_id for r in farmer_roles]
    profiles = db.query(models.Profile).filter(models.Profile.user_id.in_(farmer_ids)).all()
    return [
        {
            "id": p.user_id,
            "full_name": p.full_name,
            "phone": p.phone,
            "village_city": p.village_city,
            "email": p.email,
        }
        for p in profiles
    ]
