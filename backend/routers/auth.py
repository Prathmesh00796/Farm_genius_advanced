from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth as auth_utils
from datetime import timedelta
import uuid

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=schemas.Token)
def register(req: schemas.RegisterRequest, db: Session = Depends(get_db)):
    print(f"DEBUG: Registering user {req.email}")
    # Check email uniqueness
    existing = db.query(models.User).filter(models.User.email == req.email).first()
    if existing:
        print(f"DEBUG: Email {req.email} already exists")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    try:
        # Create user
        user = models.User(
            id=str(uuid.uuid4()),
            email=req.email,
            hashed_password=auth_utils.get_password_hash(req.password),
        )
        db.add(user)
        db.flush()

        # Create profile
        profile = models.Profile(
            id=str(uuid.uuid4()),
            user_id=user.id,
            full_name=req.full_name,
            email=req.email,
            phone=req.phone,
            village_city=req.village_city,
        )
        db.add(profile)

        # Create role
        role = models.UserRole(
            id=str(uuid.uuid4()),
            user_id=user.id,
            role=models.AppRole(req.role.value),
        )
        db.add(role)
        db.commit()
        print(f"DEBUG: Successfully registered user {user.id}")

        token = auth_utils.create_access_token(
            data={"sub": user.id, "role": req.role.value}
        )
        return schemas.Token(access_token=token, user_id=user.id, role=req.role.value)
    except Exception as e:
        db.rollback()
        print(f"DEBUG ERROR during registration: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.post("/login", response_model=schemas.Token)
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    print(f"DEBUG: Login attempt for {req.email}")
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        print(f"DEBUG: User {req.email} not found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid login credentials",
        )
    
    if not auth_utils.verify_password(req.password, user.hashed_password):
        print(f"DEBUG: Invalid password for {req.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid login credentials",
        )

    role_record = db.query(models.UserRole).filter(models.UserRole.user_id == user.id).first()
    role = role_record.role.value if role_record else "farmer"
    print(f"DEBUG: Login successful for {user.id}, role: {role}")

    token = auth_utils.create_access_token(data={"sub": user.id, "role": role})
    return schemas.Token(access_token=token, user_id=user.id, role=role)


@router.get("/me")
def get_me(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    role_record = db.query(models.UserRole).filter(models.UserRole.user_id == current_user.id).first()
    role = role_record.role.value if role_record else "farmer"
    profile = current_user.profile

    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": role,
        "full_name": profile.full_name if profile else "",
        "phone": profile.phone if profile else None,
        "village_city": profile.village_city if profile else None,
        "avatar_url": profile.avatar_url if profile else None,
    }
