# backend/app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str   # e.g., postgresql://user:pass@db:5432/dbname
    vault_url: str      # e.g., https://your-keyvault.vault.azure.net
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 1440
    backend_port: int = 8000
    database_port: int = 5432

    model_config = {"env_file": ".env", "case_sensitive": False}

# Create the instance that will be imported elsewhere
settings = Settings()