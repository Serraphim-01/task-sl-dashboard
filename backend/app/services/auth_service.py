import httpx
from typing import Optional
from datetime import datetime, timedelta
import logging
from app.services.kms_service import get_kms_service

logger = logging.getLogger(__name__)


class StarlinkAuth:
    """
    Handles OIDC token retrieval and caching for V2 service accounts.
    Credentials passed explicitly for customer multi-tenancy.
    """
    
    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self._access_token: Optional[str] = None
        self._token_expiry: Optional[datetime] = None
    
    async def _fetch_token(self) -> str:
        """
        Obtain a new access token using client credentials.
        Returns the access token string.
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    "https://starlink.com/api/auth/connect/token",
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    data={
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "grant_type": "client_credentials",
                    },
                    timeout=10,
                )
                response.raise_for_status()
                data = response.json()
                token = data.get("access_token")
                if not token:
                    raise ValueError("Access token missing in response")
                
                expires_in = data.get("expires_in", 3600)
                self._token_expiry = datetime.utcnow() + timedelta(seconds=expires_in - 60)
                self._access_token = token
                logger.info("Successfully obtained access token")
                return token
                
            except httpx.HTTPError as e:
                logger.error(f"Token request failed: {e}")
                raise
            except ValueError as e:
                logger.error(f"Token response invalid: {e}")
                raise
    
    async def get_token(self) -> str:
        """
        Return a valid access token, refreshing if necessary.
        """
        if (self._access_token is None or
            self._token_expiry is None or
            datetime.utcnow() >= self._token_expiry):
            await self._fetch_token()
        return self._access_token
    
    async def get_auth_header(self) -> dict:
        """
        Return the Authorization header dictionary.
        """
        token = await self.get_token()
        return {"Authorization": f"Bearer {token}"}