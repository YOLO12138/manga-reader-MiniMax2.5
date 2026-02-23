export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface Chapter {
  id: number;
  manga_id: number;
  chapter_number: number;
  title: string | null;
  created_at: string;
}

export interface Manga {
  id: number;
  title: string;
  description: string | null;
  cover_image: string | null;
  is_published: boolean;
  created_at: string;
  uploaded_by: number | null;
  chapters: Chapter[];
}

export interface MangaListItem {
  id: number;
  title: string;
  description: string | null;
  cover_image: string | null;
  created_at: string;
}

export interface ChapterPages {
  pages: string[];
  total: number;
}

export interface Token {
  access_token: string;
  token_type: string;
}
