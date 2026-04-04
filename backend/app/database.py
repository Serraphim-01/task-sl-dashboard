from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Use plain PostgreSQL connection string
DATABASE_URL = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")
print(f"DEBUG: Connecting to {DATABASE_URL}")
 
engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Import and register models after Base is created
from app.models.user import register_user_model
User = register_user_model(Base)

# Export User for use in other modules
__all__ = ["engine", "SessionLocal", "Base", "User", "get_db"]

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
