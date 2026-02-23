from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Try to get DATABASE_URL from environment, with explicit fallback for docker
DATABASE_URL = os.getenv("DATABASE_URL")

# If not set, try reading from .env file in app directory
if not DATABASE_URL:
    env_path = '/app/.env'
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.strip().startswith('DATABASE_URL='):
                    DATABASE_URL = line.strip().split('=', 1)[1]
                    break

# Final fallback
if not DATABASE_URL:
    DATABASE_URL = "postgresql://manga_user:manga_password@postgres:5432/manga_db"

print(f"Using DATABASE_URL: {DATABASE_URL}")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
