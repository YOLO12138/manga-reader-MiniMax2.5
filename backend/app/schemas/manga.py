from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ChapterBase(BaseModel):
    chapter_number: int
    title: Optional[str] = None


class ChapterResponse(ChapterBase):
    id: int
    manga_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class MangaBase(BaseModel):
    title: str
    description: Optional[str] = None


class MangaCreate(MangaBase):
    pass


class MangaUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    is_published: Optional[bool] = None


class MangaResponse(MangaBase):
    id: int
    cover_image: Optional[str]
    is_published: bool
    created_at: datetime
    uploaded_by: Optional[int] = None
    chapters: List[ChapterResponse] = []

    class Config:
        from_attributes = True


class MangaListResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    cover_image: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
