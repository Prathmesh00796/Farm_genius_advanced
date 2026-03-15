from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

# Default to a local SQLite file so the user doesn't need to configure MySQL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./farmgenius.db")
print(f"DEBUG: Using database URL: {DATABASE_URL}")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

try:
    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=False,
    )
    print("DEBUG: Database engine created successfully")
except Exception as e:
    print(f"DEBUG ERROR creating database engine: {e}")
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
