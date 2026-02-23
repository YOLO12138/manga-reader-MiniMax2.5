from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class LoginRequest(BaseModel):
    username: str
    password: str


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


class ChapterResponse(BaseModel):
    id: int
    manga_id: int
    chapter_number: int
    title: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class MangaResponse(MangaBase):
    id: int
    cover_image: Optional[str]
    is_published: bool
    created_at: datetime
    chapters: List[ChapterResponse] = []

    class Config:
        from_attributes = True


class MangaListResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    cover_image: Optional[str]
    is_published: bool
    created_at: datetime
    chapter_count: int = 0

    class Config:
        from_attributes = True


class ChapterCreate(BaseModel):
    chapter_number: int
    title: Optional[str] = None


class PageResponse(BaseModel):
    page_number: int
    image_url: str
