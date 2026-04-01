# backend/app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException
from app.services.auth_service import StarlinkAuth
import httpx

router = APIRouter()

@router.get("/test-connection")
async def test_connection():
    # Instantiate StarlinkAuth without arguments – it will load credentials from KMS
    auth = StarlinkAuth()
    
    # Get headers (this will trigger token retrieval)
    headers = await auth.get_auth_header()
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://starlink.com/api/public/v2/account",
            headers=headers,
            timeout=10
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Starlink API error")
        
        return response.json()