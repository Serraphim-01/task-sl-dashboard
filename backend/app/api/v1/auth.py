# backend/app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException
from app.services.auth_service import StarlinkAuth
import httpx

router = APIRouter()

@router.get("/kms-test")
async def kms_test():
    """
    Test KMS connection only - fetch Starlink credentials from Azure Key Vault.
    Logs: Vault request sent, response, credentials length.
    """
    from app.services.kms_service import get_kms_service
    from app.services.auth_service import StarlinkAuth
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        kms = await get_kms_service()
        client_id = await kms.get_secret("starlink-provider-client-id")
        client_secret = await kms.get_secret("starlink-provider-client-secret")
        
        logger.info("KMS test: Vault connection successful")
        logger.info(f"KMS test: client_id length={len(client_id) if client_id else 0}")
        logger.info(f"KMS test: client_secret length={len(client_secret) if client_secret else 0}")
        
        if client_id and client_secret:
            logger.info("KMS test: Both credentials fetched successfully")
            auth = StarlinkAuth()
            headers = await auth.get_auth_header()  # Triggers token but don't call Starlink
            return {"status": "success", "kms_working": True, "secrets_loaded": True}
        else:
            raise ValueError("Missing one or both secrets")
    except Exception as e:
        logger.error(f"KMS test failed: {str(e)}")
        raise HTTPException(status_code=503, detail=f"KMS test failed: {str(e)}")


@router.get("/test-connection")
async def test_connection():
    try:
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
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"KMS not configured. Set VAULT_URL in .env. Error: {str(e)}")
