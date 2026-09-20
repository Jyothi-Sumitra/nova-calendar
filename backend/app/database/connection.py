import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

# Local development keeps using the existing SQLite database.
# Production can set DATABASE_URL to the Supabase PostgreSQL connection string.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./calendar.db")

engine_kwargs = {}

if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    **engine_kwargs,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
