from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.schemas.user import UserOut, UserProfileUpdate
from backend.app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)

@router.patch("", response_model=UserOut)
def update_profile(
    update_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if update_data.display_name is not None:
        current_user.display_name = update_data.display_name.strip()
    if update_data.preferred_level is not None:
        current_user.preferred_level = update_data.preferred_level
    if update_data.learning_preference is not None:
        current_user.learning_preference = update_data.learning_preference

    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)
