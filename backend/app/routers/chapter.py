from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import os
import zipfile
import io

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


def get_zip_path(chapter: Chapter) -> str:
    """Get the path to the chapter's ZIP file"""
    if not chapter.folder_path:
        return None
    zip_path = os.path.join(chapter.folder_path, "chapter.zip")
    if os.path.exists(zip_path):
        return zip_path
    return None


@router.get("/{chapter_id}/pages")
def get_chapter_pages(chapter_id: int, db: Session = Depends(get_db)):
    """Get list of pages for a chapter - reads from ZIP file"""
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    if not chapter.folder_path:
        raise HTTPException(status_code=404, detail="Chapter path not set")

    # Check for ZIP file
    zip_path = get_zip_path(chapter)
    if not zip_path or not os.path.exists(zip_path):
        raise HTTPException(status_code=404, detail="Chapter ZIP file not found")

    # Get image files from ZIP
    valid_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    pages = []
    
    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            for filename in zf.namelist():
                ext = os.path.splitext(filename)[1].lower()
                if ext in valid_extensions and not filename.endswith('/'):
                    pages.append(os.path.basename(filename))
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Invalid ZIP file")

    # Sort naturally
    pages.sort(key=nat_sort_key)

    # Return URLs with just filenames
    page_urls = [f"/api/chapters/{chapter_id}/pages/{filename}" for filename in pages]

    return {"pages": page_urls, "total": len(pages)}


@router.get("/{chapter_id}/pages/{filename}")
def get_page(chapter_id: int, filename: str, db: Session = Depends(get_db)):
    """Get a specific page image - reads from ZIP file"""
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    if not chapter.folder_path:
        raise HTTPException(status_code=404, detail="Chapter path not set")

    # Security: prevent directory traversal
    filename = os.path.basename(filename)

    # Find the ZIP file
    zip_path = get_zip_path(chapter)
    if not zip_path:
        raise HTTPException(status_code=404, detail="Chapter ZIP file not found")

    # Find the file inside ZIP
    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            # Try to find the file with exact name or similar
            target_file = None
            for name in zf.namelist():
                if os.path.basename(name) == filename:
                    target_file = name
                    break
            
            if not target_file:
                raise HTTPException(status_code=404, detail="Page not found")
            
            # Read the file from ZIP
            file_data = zf.read(target_file)
            
            # Determine content type
            ext = os.path.splitext(filename)[1].lower()
            content_type = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp'
            }.get(ext, 'application/octet-stream')
            
            return StreamingResponse(
                io.BytesIO(file_data),
                media_type=content_type,
                headers={"Content-Disposition": f"inline; filename={filename}"}
            )
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Invalid ZIP file")
