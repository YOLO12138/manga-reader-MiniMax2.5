from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os

from app.database import engine, Base, get_db
from app.routers import auth, manga, chapter, admin
from app.models import User, SiteConfig
from app.auth import get_password_hash


def create_seed_admin():
    """Create seed admin user if environment variables are set and no users exist"""
    from app.database import SessionLocal
    
    db = SessionLocal()
    try:
        # Check if any users exist
        user_count = db.query(User).count()
        if user_count > 0:
            return  # Skip if users already exist
        
        # Get setup admin credentials from environment
        admin_username = os.getenv("SETUP_ADMIN_USERNAME")
        admin_email = os.getenv("SETUP_ADMIN_EMAIL")
        admin_password = os.getenv("SETUP_ADMIN_PASSWORD")
        
        # Only create if all environment variables are set
        if admin_username and admin_email and admin_password:
            # Check if admin already exists by username
            existing = db.query(User).filter(User.username == admin_username).first()
            if existing:
                return
            
            # Create the seed admin
            admin_user = User(
                username=admin_username,
                email=admin_email,
                hashed_password=get_password_hash(admin_password),
                role="admin"
            )
            db.add(admin_user)
            
            # Set registration to disabled by default
            config = db.query(SiteConfig).filter(SiteConfig.key == "registration_enabled").first()
            if not config:
                config = SiteConfig(key="registration_enabled", value="false")
                db.add(config)
            
            db.commit()
            print(f"Seed admin user '{admin_username}' created successfully!")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    Base.metadata.create_all(bind=engine)

    # Create seed admin if environment variables are set
    create_seed_admin()

    # Ensure storage directory exists
    storage_path = os.getenv("STORAGE_PATH", "/app/storage/manga")
    os.makedirs(storage_path, exist_ok=True)

    yield


app = FastAPI(
    title="Manga Reader API",
    description="Backend API for manga reading webapp",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration - allow all for LAN access
# Can be restricted via CORS_ORIGINS env variable (comma-separated)
cors_origins = os.getenv("CORS_ORIGINS", "*")
cors_origins_list = [o.strip() for o in cors_origins.split(",")] if cors_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Increase max upload size to 200MB
@app.middleware("http")
async def increase_max_body_size(request, call_next):
    if request.url.path.startswith("/api/"):
        request.state.max_body_size = 200 * 1024 * 1024  # 200MB
    return await call_next(request)


# Include routers
app.include_router(auth.router)
app.include_router(manga.router)
app.include_router(chapter.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"message": "Manga Reader API", "status": "running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
