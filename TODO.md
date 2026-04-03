# Fix CORS + 500 Error - Missing VAULT_URL

**Status:** In progress

## Root Cause
- Backend running locally (uvicorn)
- test_connection → StarlinkAuth → kms_service.AzureKeyVaultService() raises ValueError: VAULT_URL environment variable is required
- 500 error with CORS headers sent, but browser blocks due to error response handling.

## Final Status
- [x] CORS/500 fixed.
- [x] Pure KMS test endpoint `/api/v1/auth/kms-test` added with terminal logs (connection, secret lengths).
- [x] Frontend button updated to `/kms-test`, displays detail msg.
- [x] Logging: KMS success/fail, client_id/secret lengths in uvicorn terminal.
- [x] Complete: Test KMS only, no Starlink call.
