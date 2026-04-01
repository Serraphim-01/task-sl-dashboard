from fastapi import APIRouter, HTTPException
from app.services.auth_service import StarlinkAuth
import httpx

router = APIRouter()

@router.get("/service-plan")
async def get_service_plan():
    """
    Retrieve the service lines (subscriptions) and current plan information
    for the provider's Starlink account.
    """
    auth = StarlinkAuth()
    headers = await auth.get_auth_header()

    async with httpx.AsyncClient() as client:
        # Get the list of service lines
        response = await client.get(
            "https://starlink.com/api/public/v2/service-lines",
            headers=headers,
            timeout=10
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Starlink API error: {response.text}"
            )

        return response.json()
