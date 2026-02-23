from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import os
import zipfile
import shutil
import re
from pathlib import Path

from app.database import get_db
from app.models import Manga, Chapter, User
from app.schemas.manga import MangaCreate, MangaUpdate, MangaResponse, MangaListResponse, ChapterResponse
from app.deps import get_current_active_user, require_admin
from app.auth import get_password_hash

router = APIRouter(prefix="/api/manga", tags=["manga"])

STORAGE_PATH = os.getenv("STORAGE_PATH", "/app/storage/manga")


def nat_sort_key(s):
    """Natural sort key for strings containing numbers"""
    return [int(c) if c.isdigit() else c.lower() for c in re.split(r'(\d+)', s)]


@router.get("", response_model=List[MangaListResponse])
def list_manga(db: Session = Depends(get_db)):
    """List all published manga"""
    manga = db.query(Manga).filter(Manga.is_published == True).all()
    return manga


@router.get("/{manga_id}", response_model=MangaResponse)
def get_manga(manga_id: int, db: Session = Depends(get_db)):
    """Get manga details with chapters"""
    manga = db.query(Manga).filter(Manga.id == manga_id).first()
    if not manga:
        raise HTTPException(status_code=404, detail="Manga not found")
    if not manga.is_published:
        raise HTTPException(status_code=404, detail="Manga not found")
    return manga


@router.post("", response_model=MangaResponse, dependencies=[Depends(require_admin)])
def create_manga(
    manga: MangaCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new manga entry (admin only)"""
    db_manga = Manga(
        title=manga.title,
        description=manga.description,
        uploaded_by=current_user.id
    )
    db.add(db_manga)
    db.commit()
    db.refresh(db_manga)

    # Create manga folder
    manga_folder = os.path.join(STORAGE_PATH, str(db_manga.id))
    os.makedirs(manga_folder, exist_ok=True)

    return db_manga


@router.put("/{manga_id}", response_model=MangaResponse)
def update_manga(
    manga_id: int,
    manga_update: MangaUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update manga details"""
    manga = db.query(Manga).filter(Manga.id == manga_id).first()
    if not manga:
        raise HTTPException(status_code=404, detail="Manga not found")

    # Check permission (owner or admin)
    if manga.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = manga_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(manga, key, value)

    db.commit()
    db.refresh(manga)
    return manga


@router.delete("/{manga_id}", dependencies=[Depends(require_admin)])
def delete_manga(
    manga_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete manga (admin only)"""
    manga = db.query(Manga).filter(Manga.id == manga_id).first()
    if not manga:
        raise HTTPException(status_code=404, detail="Manga not found")

    # Delete manga folder
    manga_folder = os.path.join(STORAGE_PATH, str(manga.id))
    if os.path.exists(manga_folder):
        shutil.rmtree(manga_folder)

    db.delete(manga)
    db.commit()

    return {"message": "Manga deleted successfully"}


@router.post("/{manga_id}/upload", response_model=ChapterResponse)
async def upload_chapter(
    manga_id: int,
    chapter_number: int = Form(...),
    chapter_title: str = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload a chapter as ZIP file (admin only)"""
    # Check manga exists
    manga = db.query(Manga).filter(Manga.id == manga_id).first()
    if not manga:
        raise HTTPException(status_code=404, detail="Manga not found")

    # Check permission
    if manga.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Create chapter folder
    chapter_folder = os.path.join(STORAGE_PATH, str(manga_id), str(chapter_number))
    os.makedirs(chapter_folder, exist_ok=True)

    # Save and extract ZIP
    zip_path = os.path.join(chapter_folder, "upload.zip")
    with open(zip_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Extract ZIP
    try:
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(chapter_folder)
        os.remove(zip_path)
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Invalid ZIP file")

    # Clean up any extra folders at root of zip
    for item in os.listdir(chapter_folder):
        item_path = os.path.join(chapter_folder, item)
        if os.path.isdir(item_path):
            # Move contents up one level
            for sub_item in os.listdir(item_path):
                shutil.move(os.path.join(item_path, sub_item), chapter_folder)
            os.rmdir(item_path)

    # Create chapter in database
    chapter = Chapter(
        manga_id=manga_id,
        chapter_number=chapter_number,
        title=chapter_title,
        folder_path=chapter_folder
    )

    # Check if chapter already exists
    existing = db.query(Chapter).filter(
        Chapter.manga_id == manga_id,
        Chapter.chapter_number == chapter_number
    ).first()

    if existing:
        # Update existing chapter
        existing.title = chapter_title
        existing.folder_path = chapter_folder
        db.commit()
        db.refresh(existing)
        return existing

    db.add(chapter)
    db.commit()
    db.refresh(chapter)

    return chapter


@router.get("/{manga_id}/chapters", response_model=List[ChapterResponse])
def get_chapters(manga_id: int, db: Session = Depends(get_db)):
    """Get all chapters for a manga"""
    manga = db.query(Manga).filter(Manga.id == manga_id).first()
    if not manga:
        raise HTTPException(status_code=404, detail="Manga not found")

    chapters = db.query(Chapter).filter(Chapter.manga_id == manga_id).order_by(Chapter.chapter_number).all()
    return chapters
