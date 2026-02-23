from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.models import User, SiteConfig
from app.schemas.user import UserCreate, UserResponse, Token, PasswordChange
from app.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.deps import get_current_active_user, require_admin

router = APIRouter(prefix="/api/auth", tags=["auth"])


def get_site_config(db: Session, key: str) -> str:
    """Get a site configuration value"""
    config = db.query(SiteConfig).filter(SiteConfig.key == key).first()
    return config.value if config else None


def set_site_config(db: Session, key: str, value: str):
    """Set a site configuration value"""
    config = db.query(SiteConfig).filter(SiteConfig.key == key).first()
    if config:
        config.value = value
    else:
        config = SiteConfig(key=key, value=value)
        db.add(config)
    db.commit()


@router.get("/register-allowed")
def check_registration_allowed(db: Session = Depends(get_db)):
    """Check if registration is allowed based on site config"""
    # Default to disabled if not set
    registration_enabled = get_site_config(db, "registration_enabled")
    is_allowed = registration_enabled == "true"
    return {"registration_allowed": is_allowed}


@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if registration is enabled
    registration_enabled = get_site_config(db, "registration_enabled")
    if registration_enabled != "true":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration is closed. Please contact an administrator."
        )

    # Check if username exists
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Check if email exists
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user with default role (registration always creates regular users)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=get_password_hash(user.password),
        role="user"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.put("/password")
def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Change own password (requires current password)"""
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )

    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()

    return {"message": "Password changed successfully"}


@router.delete("/account")
def delete_account(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete own account"""
    db.delete(current_user)
    db.commit()

    return {"message": "Account deleted successfully"}
