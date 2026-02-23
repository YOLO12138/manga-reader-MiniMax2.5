from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User
from app.schemas.user import UserResponse, UserUpdate, UserCreate
from app.auth import get_password_hash
from app.deps import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new user (admin only)"""
    # Check if username exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Check if email exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Validate role if provided
    role = user_data.role if user_data.role in ["admin", "user"] else "user"

    # Create user
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        role=role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@router.get("/users", response_model=List[UserResponse])
def list_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all users (admin only)"""
    users = db.query(User).all()
    return users


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update user (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent removing own admin status
    if user_id == current_user.id and user_update.role and user_update.role != "admin":
        raise HTTPException(
            status_code=400,
            detail="Cannot remove your own admin role"
        )

    update_data = user_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete user (admin only)"""
    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete yourself"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}


@router.get("/stats")
def get_stats(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get admin statistics"""
    from app.models import Manga, Chapter

    total_users = db.query(User).count()
    total_manga = db.query(Manga).count()
    published_manga = db.query(Manga).filter(Manga.is_published == True).count()
    total_chapters = db.query(Chapter).count()

    return {
        "total_users": total_users,
        "total_manga": total_manga,
        "published_manga": published_manga,
        "total_chapters": total_chapters
    }


# Site Configuration endpoints
from app.models import SiteConfig


@router.get("/config")
def get_site_config(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all site configuration (admin only)"""
    configs = db.query(SiteConfig).all()
    return {config.key: config.value for config in configs}


@router.put("/config")
def update_site_config(
    key: str,
    value: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update a site configuration value (admin only)"""
    config = db.query(SiteConfig).filter(SiteConfig.key == key).first()
    if config:
        config.value = value
    else:
        config = SiteConfig(key=key, value=value)
        db.add(config)
    db.commit()
    return {"key": key, "value": value}


@router.get("/config/registration")
def get_registration_status(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get registration status (admin only)"""
    config = db.query(SiteConfig).filter(SiteConfig.key == "registration_enabled").first()
    enabled = config.value == "true" if config else False
    return {"registration_enabled": enabled}


@router.put("/config/registration")
def toggle_registration(
    enabled: bool,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Enable or disable user registration (admin only)"""
    config = db.query(SiteConfig).filter(SiteConfig.key == "registration_enabled").first()
    value = "true" if enabled else "false"
    if config:
        config.value = value
    else:
        config = SiteConfig(key="registration_enabled", value=value)
        db.add(config)
    db.commit()
    return {"registration_enabled": enabled}
