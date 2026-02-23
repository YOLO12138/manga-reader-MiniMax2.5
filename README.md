# Manga Reader

A self-hosted manga reading web application built with Next.js, FastAPI, and PostgreSQL.

## Features

- **User Management**: Role-based access control (Admin/User)
- **Manga Library**: Browse and read published manga
- **Admin Dashboard**: 
  - Upload manga with chapters (ZIP files)
  - Manage users (create, edit, delete)
  - Toggle user registration
- **Reader**: Webtoon (vertical scroll) and Manga (RTL) modes
- **Easy Deployment**: Docker-based, one-command setup

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) v2 or later

### Installation

1. Clone the repository:

```bash
git clone https://github.com/YOLO12138/manga-reader-MiniMax2.5 manga-reader
cd manga-reader
```

2. Start the application:

```bash
docker compose up --build
```

3. Access the application:
   - **Web UI**: http://localhost
   - **API**: http://localhost/api
   - **API Documentation**: http://localhost/docs

### Default Admin Account

On first startup, an admin account is automatically created:

- **Username**: `admin`
- **Password**: `changeme`

> ⚠️ **Important**: Change the admin password after first login!

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
POSTGRES_USER=manga_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=manga_db
DATABASE_URL=postgresql://manga_user:your_secure_password@postgres:5432/manga_db

# Backend
SECRET_KEY=your_very_secure_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend (leave empty for relative URLs via nginx)
NEXT_PUBLIC_API_URL=

# Setup Admin (first startup only)
SETUP_ADMIN_USERNAME=admin
SETUP_ADMIN_EMAIL=admin@example.com
SETUP_ADMIN_PASSWORD=admin123
```

### Changing the Admin Credentials

1. Edit `.env`:
   ```
   SETUP_ADMIN_USERNAME=your_username
   SETUP_ADMIN_EMAIL=your_email
   SETUP_ADMIN_PASSWORD=your_password
   ```

2. Restart the containers:
   ```bash
   docker compose down
   docker compose up --build
   ```

> ⚠️ Note: The seed admin is only created when the database is empty. Delete the PostgreSQL volume to reset:
> ```bash
> docker compose down -v
> ```

## Usage Guide

### For Users

1. **Login**: Visit http://localhost/login
2. **Browse Manga**: View published manga on the home page
3. **Read**: Click on a manga to see chapters, then click a chapter to read

### For Administrators

Access the admin dashboard at http://localhost/admin

#### Upload Manga

1. Go to **Admin Dashboard** → **Upload Manga**
2. Enter manga title and description
3. Upload a cover image (optional)
4. Click Create
5. To add chapters:
   - Click Upload Chapter
   - Enter chapter number and title
   - Upload a ZIP file containing images

#### Manage Users

1. Go to **Admin Dashboard** → **Manage Users**
2. View all users
3. Edit: Change role (admin/user) or active status
4. Delete: Remove user accounts

#### Site Settings

1. Go to **Admin Dashboard** → **Site Settings**
2. **User Registration**: Toggle whether new users can register
   - When disabled, only admins can create users from the user management page

## Manga Upload Format

Upload chapters as ZIP files containing images:

```
chapter1.zip/
├── 1.jpg
├── 2.jpg
├── 3.png
└── ...
```

Images are automatically sorted by filename.

## Deployment

### Production Deployment

1. **Update environment variables**:
   - Set a strong `SECRET_KEY`
   - Change default passwords
   - Set `SETUP_ADMIN_*` for your admin account

2. **Build and start**:
   ```bash
   docker compose up --build -d
   ```

3. **Reverse Proxy** (optional):
   - Configure nginx or Traefik to handle HTTPS
   - Update CORS settings in `backend/app/main.py` for your domain

### Updating

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker compose up --build -d
```

### Backup

Backup your PostgreSQL data:
```bash
docker compose exec postgres pg_dump -U manga_user manga_db > backup.sql
```

### Reset Database

```bash
# Stop and remove volumes
docker compose down -v

# Start fresh
docker compose up --build
```

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| POSTGRES_USER | Database user (default: manga_user) |
| POSTGRES_PASSWORD | Database password |
| POSTGRES_DB | Database name (default: manga_db) |
| DATABASE_URL | Full connection URL (auto-constructed if not set) |
| SECRET_KEY | JWT signing key |
| NEXT_PUBLIC_API_URL | Frontend API URL (leave empty for relative) |
| SETUP_ADMIN_* | Initial admin account (first startup only) |

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose logs
```

### Can't login

- Verify credentials are correct
- Check if user account is active (ask admin)
- Clear browser cookies

### Uploaded images not showing

- Check file permissions on the volume
- Ensure images are in correct format (jpg, png, gif, webp)

### "Registration is closed"

- By default, registration is disabled
- Admin can enable it at: **Admin Dashboard** → **Site Settings** → Enable Registration

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14 |
| Styling | Tailwind CSS |
| Backend | FastAPI (Python) |
| Database | PostgreSQL 15 |
| Auth | JWT |
| Deployment | Docker |

## License

MIT
