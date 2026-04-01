# backend/app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    vault_url: str  # Azure Key Vault URL
    # Add other settings as needed (e.g., database URL, API keys, etc.)

    class Config:
        env_file = ".env"
        # Allow extra fields? We'll keep it strict (default) and explicitly list needed fields.
        # This ensures we don't accidentally miss required settings.

settings = Settings()