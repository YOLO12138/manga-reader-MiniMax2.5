# Manga Reader - Technical Documentation

This document provides detailed technical information about the codebase structure and implementation.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Nginx (Port 80)                        │
│                    Reverse Proxy                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌───────────────┐           ┌───────────────┐
│   Frontend    │           │    Backend    │
│  Next.js:3000 │◄─────────►│  FastAPI:8000 │
└───────────────┘           └───────┬───────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │  PostgreSQL   │
                            │   (5432)      │
                            └───────────────┘
```

## Project Structure

```
manga/
├── docker-compose.yml          # Docker orchestration
├── nginx.conf                  # Nginx configuration
├── .env                       # Environment variables
├── .env.example               # Environment template
├── CLAUDE.md                  # This file
├── README.md                  # User-facing documentation
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── init.sql               # Database initialization
│   └── app/
│       ├── __init__.py
│       ├── main.py             # FastAPI app & lifespan
│       ├── config.py           # Configuration
│       ├── database.py         # DB connection & SessionLocal
│       ├── models.py           # SQLAlchemy models
│       ├── auth.py             # JWT & password utilities
│       ├── deps.py             # Dependency injection
│       ├── schemas.py          # Shared schemas
│       ├── routers/
│       │   ├── __init__.py
│       │   ├── auth.py         # /api/auth endpoints
│       │   ├── admin.py        # /api/admin endpoints
│       │   ├── manga.py        # /api/manga endpoints
│       │   └── chapter.py      # /api/chapters endpoints
│       ├── schemas/
│       │   ├── __init__.py
│       │   ├── user.py         # User schemas
│       │   └── manga.py        # Manga schemas
│       └── utils/
│           ├── __init__.py
│           └── auth.py
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── next.config.js
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx
        │   ├── globals.css
        │   ├── login/
        │   │   └── page.tsx
        │   ├── register/
        │   │   └── page.tsx
        │   ├── admin/
        │   │   ├── layout.tsx
        │   │   ├── page.tsx          # Admin dashboard
        │   │   ├── upload/
        │   │   │   └── page.tsx      # Manga upload
        │   │   ├── users/
        │   │   │   └── page.tsx      # User management
        │   │   └── settings/
        │   │       └── page.tsx      # Site settings
        │   ├── manga/
        │   │   └── [id]/
        │   │       └── page.tsx       # Manga detail
        │   └── read/
        │       └── [chapterId]/
        │           └── page.tsx       # Chapter reader
        ├── components/
        │   ├── Navbar.tsx
        │   ├── MangaCard.tsx
        │   ├── ChapterList.tsx
        │   └── Reader.tsx
        ├── lib/
        │   ├── api.ts                # Axios API client
        │   └── auth.tsx              # Auth context
        └── types/
            └── index.ts              # TypeScript types
```

## Database Models

### User
| Field | Type | Description |
|-------|------|-------------|
| id | Integer (PK) | Primary key |
| username | String(50) | Unique username |
| email | String(100) | Unique email |
| hashed_password | String(255) | Bcrypt hashed password |
| role | String(20) | "admin" or "user" |
| is_active | Boolean | Account active status |
| created_at | DateTime | Creation timestamp |

### Manga
| Field | Type | Description |
|-------|------|-------------|
| id | Integer (PK) | Primary key |
| title | String(255) | Manga title |
| description | Text | Manga description |
| cover_image | String(500) | Cover image URL |
| folder_path | String(500) | Storage path |
| uploaded_by | Integer (FK) | Uploader user ID |
| is_published | Boolean | Public visibility |
| created_at | DateTime | Creation timestamp |

### Chapter
| Field | Type | Description |
|-------|------|-------------|
| id | Integer (PK) | Primary key |
| manga_id | Integer (FK) | Parent manga ID |
| chapter_number | Integer | Chapter number |
| title | String(255) | Chapter title |
| folder_path | String(500) | Storage path |
| created_at | DateTime | Creation timestamp |

### SiteConfig
| Field | Type | Description |
|-------|------|-------------|
| id | Integer (PK) | Primary key |
| key | String(50) | Config key (unique) |
| value | String(255) | Config value |
| updated_at | DateTime | Last update |

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /register-allowed | Check if registration is open | No |
| POST | /register | Register new user | No |
| POST | /login | Login (returns JWT) | No |
| GET | /me | Get current user | Yes |

### Manga (`/api/manga`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | / | List published manga | No |
| GET | /{id} | Get manga details | No |
| POST | / | Create manga | Admin |
| PUT | /{id} | Update manga | Admin |
| DELETE | /{id} | Delete manga | Admin |
| GET | /{id}/chapters | List chapters | No |
| POST | /{id}/upload | Upload chapter | Admin |

### Chapters (`/api/chapters`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /{id}/pages | Get chapter pages | No |
| GET | /{id}/pages/{filename} | Get page image | No |

### Admin (`/api/admin`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /users | List all users | Admin |
| POST | /users | Create user | Admin |
| PUT | /users/{id} | Update user | Admin |
| DELETE | /users/{id} | Delete user | Admin |
| GET | /stats | Get statistics | Admin |
| GET | /config | Get site config | Admin |
| PUT | /config | Update config | Admin |
| GET | /config/registration | Get registration status | Admin |
| PUT | /config/registration | Toggle registration | Admin |

## Authentication Flow

1. **Login**: User submits username/password → Backend verifies → Returns JWT token
2. **Token Storage**: Frontend stores token in cookies
3. **Protected Routes**: Frontend sends token in Authorization header
4. **Token Verification**: Backend validates JWT on each protected request

### JWT Payload
```json
{
  "sub": "username",
  "exp": 1234567890
}
```

## Setup Mode

On first startup, if environment variables are set, a seed admin is created:

```env
SETUP_ADMIN_USERNAME=admin
SETUP_ADMIN_EMAIL=admin@example.com
SETUP_ADMIN_PASSWORD=admin123
```

The `create_seed_admin()` function in `main.py`:
1. Checks if any users exist in database
2. If no users and env vars are set, creates admin
3. Sets `registration_enabled` to "false" by default

## Registration System

- **Default**: Registration is DISABLED
- **Control**: Admin can toggle from `/admin/settings`
- **Storage**: `SiteConfig` table with key `registration_enabled`
- **Values**: "true" (enabled) or "false" (disabled)

## Frontend Pages

| Route | Description | Access |
|-------|-------------|--------|
| / | Home - published manga list | Public |
| /login | Login page | Public |
| /register | Registration (if enabled) | Public |
| /manga/{id} | Manga detail with chapters | Public |
| /read/{chapterId} | Chapter reader | Public |
| /admin | Admin dashboard | Admin |
| /admin/upload | Upload manga/chapters | Admin |
| /admin/users | Manage users | Admin |
| /admin/settings | Site settings | Admin |

## Docker Services

### PostgreSQL (manga_db)
- Image: postgres:15
- Port: 5432 (internal)
- Volume: postgres_data
- Init: Runs init.sql on first startup

### Backend (manga_backend)
- Port: 8000 (internal)
- Depends on: postgres (healthy)
- Volumes: manga-storage

### Frontend (manga_frontend)
- Port: 3000 (internal via nginx)
- Depends on: backend

### Nginx (manga_nginx)
- Port: 80 (external)
- Proxies: /api → backend, / → frontend

## Development Commands

```bash
# Build and start all services
docker compose up --build

# Start in background
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Rebuild specific service
docker compose build backend
docker compose up -d backend
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| POSTGRES_USER | manga_user | Database user |
| POSTGRES_PASSWORD | manga_password | Database password |
| POSTGRES_DB | manga_db | Database name |
| SECRET_KEY | your-secret-key | JWT signing key |
| ALGORITHM | HS256 | JWT algorithm |
| ACCESS_TOKEN_EXPIRE_MINUTES | 30 | JWT expiry |
| SETUP_ADMIN_USERNAME | admin | Initial admin username |
| SETUP_ADMIN_EMAIL | admin@example.com | Initial admin email |
| SETUP_ADMIN_PASSWORD | changeme | Initial admin password |
| STORAGE_PATH | /app/storage/manga | Manga file storage |
| NEXT_PUBLIC_API_URL | http://localhost:8000 | API URL |

## Key Dependencies

### Backend (requirements.txt)
- fastapi
- sqlalchemy
- psycopg2-binary
- pydantic
- pydantic-email
- python-jose
- passlib
- bcrypt
- python-multipart
- python-dotenv

### Frontend (package.json)
- next
- react
- react-dom
- axios
- js-cookie
- tailwindcss
- typescript
