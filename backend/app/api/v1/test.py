# backend/app/api/v1/test.py (add to main.py)
from fastapi import APIRouter, Depends
from app.services.auth_service import StarlinkAuth

router = APIRouter()

@router.get("/test-kms")
async def test_kms():
    auth = StarlinkAuth()
    headers = await auth.get_auth_header()
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://starlink.com/api/public/v2/account",
            headers=headers,
            timeout=10
        )
        return {"status": response.status_code, "data": response.json()}