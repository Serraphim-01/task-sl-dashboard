from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import get_db

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