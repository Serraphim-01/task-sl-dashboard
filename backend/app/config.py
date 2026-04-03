# backend/app/config.py
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    vault_url: Optional[str] = None  # Azure Key Vault URL

    class Config:
        env_file = ".env"

settings = Settings()