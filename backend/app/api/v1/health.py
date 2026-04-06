from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.cache import get_cache_stats, clear_all_cache, invalidate_user_cache

router = APIRouter(tags=["health"])

@router.get("/db")
async def test_db_connection(db: Session = Depends(get_db)):
    """
    Test database connectivity - executes SELECT 1.
    """
    try:
        result = db.execute(text("SELECT 1"))
        db.commit()
        return {"status": "success", "db_connected": True, "message": "Database ping successful"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB connection failed: {str(e)}")


@router.get("/cache")
async def get_cache_health():
    """
    Get cache statistics and health information.
    """
    try:
        stats = await get_cache_stats()
        return {
            "status": "success",
            "cache": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cache health check failed: {str(e)}")


@router.post("/cache/clear")
async def clear_cache():
    """
    Clear all cached data.
    Admin only endpoint for cache management.
    """
    try:
        success = await clear_all_cache()
        if success:
            return {"status": "success", "message": "All cache cleared successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to clear cache")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cache clear failed: {str(e)}")