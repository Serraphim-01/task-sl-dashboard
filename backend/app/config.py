# backend/app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str   # e.g., postgresql://user:pass@db:5432/dbname
    vault_url: str      # e.g., https://your-keyvault.vault.azure.net

    model_config = {"env_file": ".env"}

# Create the instance that will be imported elsewhere
settings = Settings()