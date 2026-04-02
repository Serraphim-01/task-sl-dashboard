from fastapi import APIRouter, Depends, HTTPException
from app.services.auth_service import StarlinkAuth
import httpx

router = APIRouter()

@router.get("/account")
async def get_account_info():
    """
    Retrieve customer Starlink account information.
    Loads customer-specific credentials from KMS for demo customer.
    """
    from app.services.kms_service import get_kms_service
    kms = await get_kms_service()
    
    customer_id = "demo-customer-1"  # TODO: Resolve from auth/session
    
    client_id = await kms.get_secret(f"starlink-customer-{customer_id}-client-id")
    client_secret = await kms.get_secret(f"starlink-customer-{customer_id}-client-secret")
    
    if not client_id or not client_secret:
        raise HTTPException(status_code=404, detail="Customer credentials not found")
    
    auth = StarlinkAuth(client_id, client_secret)
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
        
        data = response.json()
        print("=== STARLINK ACCOUNT DATA ===")
        print(data)
        print("=== END ===")
        return data
