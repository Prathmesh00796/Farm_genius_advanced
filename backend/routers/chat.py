from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth as auth_utils
from typing import List
import uuid

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.get("/messages/{conversation_id}", response_model=List[schemas.ChatMessageRead])
def get_chat_messages(
    conversation_id: str,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.ChatMessage)
        .filter(
            models.ChatMessage.user_id == current_user.id,
            models.ChatMessage.conversation_id == conversation_id,
        )
        .order_by(models.ChatMessage.created_at.asc())
        .all()
    )


@router.post("/messages", response_model=schemas.ChatMessageRead)
def save_chat_message(
    data: schemas.ChatMessageCreate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    msg = models.ChatMessage(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        conversation_id=data.conversation_id,
        role=data.role,
        content=data.content,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
