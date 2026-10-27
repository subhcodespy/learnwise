from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.schemas.user import UserRegister, UserLogin, UserOut, Token
from backend.app.core.security import verify_password, get_password_hash, create_access_token
from backend.app.api.deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address is already registered."
        )

    user = User(
        display_name=user_in.display_name.strip(),
        email=user_in.email.lower(),
        password_hash=get_password_hash(user_in.password),
        preferred_level=user_in.preferred_level or "Beginner",
        learning_preference=user_in.learning_preference or "Simple explanations"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return Token(access_token=token, user=UserOut.model_validate(user))

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email.lower()).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(user.id)
    return Token(access_token=token, user=UserOut.model_validate(user))

@router.post("/google", response_model=Token)
def google_auth(auth_data: dict, db: Session = Depends(get_db)):
    import json, base64, uuid
    email = auth_data.get("email")
    display_name = auth_data.get("displayName") or "Google Student"
    credential = auth_data.get("credential")

    if credential:
        try:
            parts = credential.split(".")
            if len(parts) == 3:
                # Add padding if needed
                padded = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
                decoded = base64.urlsafe_b64decode(padded).decode("utf-8")
                payload = json.loads(decoded)
                email = payload.get("email", email)
                display_name = payload.get("name", display_name)
        except Exception:
            pass

    if not email:
        email = "student.google@learnwise.ai"

    user = db.query(User).filter(User.email == email.lower()).first()
    if not user:
        user = User(
            id=str(uuid.uuid4()),
            display_name=display_name,
            email=email.lower(),
            password_hash=get_password_hash(str(uuid.uuid4())),
            preferred_level="Intermediate",
            learning_preference="Practical coding"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id)
    return Token(access_token=token, user=UserOut.model_validate(user))

@router.post("/logout")
def logout():
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
