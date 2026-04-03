# Starlink Partner Dashboard - Backend

## Quick Start (Development)

1. **Install dependencies:**
   ```
   cd backend
   pip install -r requirements.txt
   ```

2. **Set up Azure Key Vault (KMS):**
   - Login: `az login`
   - Create/use Key Vault
   - Add secrets: `starlink-provider-client-id`, `starlink-provider-client-secret`
   - Grant `get` secret permission to your account
   - Add to `backend/.env`:
     ```
     VAULT_URL=https://your-vault-name.vault.azure.net/
     ```

3. **Run server:**
   ```
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   Visit `http://localhost:8000/docs` for API docs.

## Docker
```
docker-compose up --build
```

## Test KMS Connection
- Frontend button now shows helpful error if KMS missing.
- `/api/v1/auth/test-connection` returns 503 with setup instructions until configured.

## Troubleshooting
- **CORS error:** Fixed - middleware allows localhost:3000.
- **500 KMS error:** Fixed - now proper 503.
- **Vault access:** Ensure `az login` and policy set.
