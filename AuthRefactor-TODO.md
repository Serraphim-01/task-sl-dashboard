# Auth Refactor for Customer Portal - COMPLETE

## Changes:
- [x] StarlinkAuth parametrized (client_id, client_secret), _load_credentials removed
- [x] account.py: demo customer 'demo-customer-1', KMS load, logging with print
- [x] api.ts: getServicePlan removed, getAccountInfo → getAccountDetails
- [x] AccountInfo.tsx: import/use getAccountDetails

**Test:** Backend /api/v1/account prints data to terminal. Frontend compiles/displays.

Ready!
