from fastapi import APIRouter, HTTPException, Depends
from app.database import User
from app.api.v1.auth import get_current_user
from app.services.kms_service import get_kms_service
import httpx
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/starlink/account")
async def get_starlink_account(current_user: User = Depends(get_current_user)):
    """
    Get Starlink account information for the authenticated customer.
    Fetches credentials from Key Vault and calls Starlink API.
    """
    try:
        # Get credentials from Key Vault using secret names stored in user record
        kms = await get_kms_service()
        
        client_id = await kms.get_secret(current_user.kms_client_id_secret_name)
        client_secret = await kms.get_secret(current_user.kms_client_secret_secret_name)
        
        if not client_id or not client_secret:
            raise HTTPException(status_code=500, detail="Failed to retrieve credentials from Key Vault")
        
        # Get access token from Starlink
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://starlink.com/api/auth/connect/token",
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data={
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "grant_type": "client_credentials",
                },
                timeout=10,
            )
            
            if token_response.status_code != 200:
                logger.error(f"Starlink token request failed: {token_response.status_code}")
                raise HTTPException(status_code=401, detail="Invalid Starlink credentials")
            
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            if not access_token:
                raise HTTPException(status_code=500, detail="Failed to obtain access token")
            
            # Call Starlink API to get account info
            account_response = await client.get(
                "https://starlink.com/api/public/v2/account",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10,
            )
            
            if account_response.status_code != 200:
                logger.error(f"Starlink account API failed: {account_response.status_code}")
                raise HTTPException(
                    status_code=account_response.status_code,
                    detail="Failed to fetch account information from Starlink"
                )
            
            return account_response.json()
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching Starlink account: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/starlink/telemetry")
async def get_starlink_telemetry(current_user: User = Depends(get_current_user)):
    """
    Get Starlink telemetry data for the authenticated customer.
    Fetches credentials from Key Vault and calls Starlink API.
    """
    try:
        # Get credentials from Key Vault using secret names stored in user record
        kms = await get_kms_service()
        
        client_id = await kms.get_secret(current_user.kms_client_id_secret_name)
        client_secret = await kms.get_secret(current_user.kms_client_secret_secret_name)
        
        if not client_id or not client_secret:
            raise HTTPException(status_code=500, detail="Failed to retrieve credentials from Key Vault")
        
        # Get access token from Starlink
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://starlink.com/api/auth/connect/token",
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data={
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "grant_type": "client_credentials",
                },
                timeout=10,
            )
            
            if token_response.status_code != 200:
                logger.error(f"Starlink token request failed: {token_response.status_code}")
                raise HTTPException(status_code=401, detail="Invalid Starlink credentials")
            
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            if not access_token:
                raise HTTPException(status_code=500, detail="Failed to obtain access token")
            
            # Call Starlink API to get telemetry
            telemetry_response = await client.get(
                "https://starlink.com/api/public/v2/telemetry",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10,
            )
            
            if telemetry_response.status_code != 200:
                logger.error(f"Starlink telemetry API failed: {telemetry_response.status_code}")
                raise HTTPException(
                    status_code=telemetry_response.status_code,
                    detail="Failed to fetch telemetry data from Starlink"
                )
            
            return telemetry_response.json()
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching Starlink telemetry: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
