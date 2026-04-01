from fastapi import APIRouter, Depends, HTTPException
from app.services.auth_service import StarlinkAuth
import httpx

router = APIRouter()

@router.get("/account")
async def get_account_info():
    """
    Retrieve the provider's Starlink account information.
    This uses the provider's service account credentials stored in Azure Key Vault.
    """
    auth = StarlinkAuth()
    headers = await auth.get_auth_header()

    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://starlink.com/api/public/v2/account",
            headers=headers,
            timeout=10
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Starlink API error: {response.text}"
            )
        return response.json()
