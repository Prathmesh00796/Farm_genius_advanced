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
async def save_chat_message(
    data: schemas.ChatMessageCreate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Save user message
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

    # 2. If it's a user message, generate AI response
    if data.role == "user":
        try:
            from routers.ai import call_openrouter
            
            # System prompt for the chatbot
            system_msg = {
                "role": "system",
                "content": "You are FarmGenius AI, a helpful Indian agricultural assistant. Answer questions about farming, crops, weather, and market prices in a helpful, professional tone. Keep answers brief and scientific."
            }
            user_msg = {"role": "user", "content": data.content}
            
            ai_content = await call_openrouter([system_msg, user_msg])
            
            # Save AI response
            ai_msg = models.ChatMessage(
                id=str(uuid.uuid4()),
                user_id=current_user.id,
                conversation_id=data.conversation_id,
                role="assistant",
                content=ai_content,
            )
            db.add(ai_msg)
            db.commit()
        except Exception as e:
            print(f"Chatbot AI Error: {e}")
            # Fallback message
            error_msg = models.ChatMessage(
                id=str(uuid.uuid4()),
                user_id=current_user.id,
                conversation_id=data.conversation_id,
                role="assistant",
                content="I'm sorry, I'm having trouble connecting to my brain right now. Please try again in a moment! 🌾",
            )
            db.add(error_msg)
            db.commit()

    return msg
