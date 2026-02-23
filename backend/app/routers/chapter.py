from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import os

from app.database import get_db
from app.models import Chapter
import re

router = APIRouter(prefix="/api/chapters", tags=["chapters"])

STORAGE_PATH = os.getenv("STORAGE_PATH", "/app/storage/manga")


def nat_sort_key(s):
    """Natural sort key - extracts numbers for sorting, falls back to ASCII if no numbers"""
    # Find all numbers in the string
    numbers = re.findall(r'\d+', s)
    if numbers:
        # Convert to integers for natural sorting
        # Use a tuple that starts with 0 to prefer files with numbers
        # Then include all found numbers as integers
        return (0, tuple(int(n) for n in numbers), s.lower())
    else:
        # No numbers found - fallback to ASCII (lexicographic) sorting
        # Use 1 to put these after files with numbers
        return (1, (), s.lower())


@router.get("/{chapter_id}/pages")
def get_chapter_pages(chapter_id: int, db: Session = Depends(get_db)):
    """Get list of pages for a chapter"""
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    if not chapter.folder_path or not os.path.exists(chapter.folder_path):
        raise HTTPException(status_code=404, detail="Chapter files not found")

    # Get all image files
    valid_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    pages = []
    for filename in os.listdir(chapter.folder_path):
        ext = os.path.splitext(filename)[1].lower()
        if ext in valid_extensions:
            pages.append(filename)

    # Sort naturally
    pages.sort(key=nat_sort_key)

    # Return full URLs
    page_urls = [f"/api/chapters/{chapter_id}/pages/{filename}" for filename in pages]

    return {"pages": page_urls, "total": len(pages)}


@router.get("/{chapter_id}/pages/{filename}")
def get_page(chapter_id: int, filename: str, db: Session = Depends(get_db)):
    """Get a specific page image"""
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    if not chapter.folder_path:
        raise HTTPException(status_code=404, detail="Chapter path not set")

    # Security: prevent directory traversal
    filename = os.path.basename(filename)
    page_path = os.path.join(chapter.folder_path, filename)

    if not os.path.exists(page_path):
        raise HTTPException(status_code=404, detail="Page not found")

    return FileResponse(page_path)
