import os
from typing import Optional
from azure.keyvault.secrets.aio import SecretClient
from azure.identity.aio import DefaultAzureCredential
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)


class AzureKeyVaultService:
    """
    Secure Key Management Service using Azure Key Vault.
    Handles storage and retrieval of Starlink credentials.
    """
    
    def __init__(self, vault_url: Optional[str] = None):
        """
        Initialize the Key Vault client.
        
        Args:
            vault_url: The URL of your Azure Key Vault.
                       If not provided, reads from VAULT_URL environment variable.
        """
        self.vault_url = vault_url or os.environ.get("VAULT_URL")
        if not self.vault_url:
            raise ValueError("VAULT_URL environment variable is required")
        
        self._client: Optional[SecretClient] = None
    
    async def _get_client(self) -> SecretClient:
        """Get or create the SecretClient with managed identity."""
        if self._client is None:
            # DefaultAzureCredential automatically uses:
            # - Managed Identity when running in Azure
            # - az login credentials when developing locally [citation:1][citation:3]
            credential = DefaultAzureCredential()
            self._client = SecretClient(
                vault_url=self.vault_url,
                credential=credential
            )
        return self._client
    
    async def get_secret(self, secret_name: str) -> Optional[str]:
        """
        Retrieve a secret from Key Vault.
        
        Args:
            secret_name: Name of the secret to retrieve
        
        Returns:
            Secret value as string, or None if not found
        """
        try:
            client = await self._get_client()
            secret = await client.get_secret(secret_name)
            logger.info(f"Successfully retrieved secret: {secret_name}")
            return secret.value
        except Exception as e:
            logger.error(f"Failed to retrieve secret {secret_name}: {e}")
            return None
    
    async def set_secret(self, secret_name: str, secret_value: str) -> bool:
        """
        Store a secret in Key Vault.
        
        Args:
            secret_name: Name of the secret to store
            secret_value: Secret value to store
        
        Returns:
            True if successful, False otherwise
        """
        try:
            client = await self._get_client()
            await client.set_secret(secret_name, secret_value)
            logger.info(f"Successfully stored secret: {secret_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to store secret {secret_name}: {e}")
            return False
    
    async def close(self):
        """Close the client connection."""
        if self._client:
            await self._client.close()
            await self._client.credential.close()
            self._client = None


# Singleton instance with caching for performance [citation:3]
_kms_instance: Optional[AzureKeyVaultService] = None


async def get_kms_service() -> AzureKeyVaultService:
    """Get the singleton KMS service instance."""
    global _kms_instance
    if _kms_instance is None:
        _kms_instance = AzureKeyVaultService()
    return _kms_instance