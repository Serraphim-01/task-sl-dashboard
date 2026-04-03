from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Convert postgresql:// to postgresql+asyncpg://
ASYNC_DATABASE_URL = settings.database_url.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(ASYNC_DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
