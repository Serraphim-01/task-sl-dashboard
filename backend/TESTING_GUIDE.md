# Customer Portal Testing Guide

## Problem
Your company doesn't have any Starlink customers/devices yet, so the Starlink API returns 404 "not_found" errors. This is **expected behavior** and not a bug.

## Solution Implemented

### 1. Graceful Error Handling
The backend now handles "not found" responses gracefully:
- **404 errors** from Starlink API return empty data with friendly messages instead of 500 errors
- Frontend displays "No devices found" or "No account information available" instead of error screens
- All endpoints return **HTTP 200 OK** even when no data exists

### 2. What Changed
- `backend/app/services/starlink_v2_service.py`: Detects 404 "not_found" errors and returns `{}` instead of raising exceptions
- `backend/app/api/v1/customer.py`: Returns user-friendly messages for empty results
- Frontend components already handle empty arrays/objects correctly

## How to Test

### Option 1: Automated Test Script (Recommended)

```bash
cd backend
python test_customer_endpoints.py
```

This script will:
1. Login as a customer
2. Test all Starlink V2 endpoints
3. Verify they return 200 OK (not 500 errors)
4. Show clear pass/fail indicators

**Expected Output:**
```
✅ Endpoint accessible!
📡 Devices found: 0
ℹ️  No devices found (expected for new accounts)
```

### Option 2: Manual Testing via Browser

1. **Login as customer**: Go to `http://localhost:3000/login`
2. **Navigate to Customer Portal**: Should auto-redirect after login
3. **Check each section**:
   - Account Info: Should show "No account information available"
   - Devices: Should show "No devices found"
   - Telemetry: Should show "No telemetry data available"
   - Tasks: Should show "No tasks found"
   - Network: Should allow device selection but show empty config
   - Alerts: Should show "✅ No active alerts"

### Option 3: Using curl/Postman

```bash
# 1. Login (cookie will be set automatically)
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# 2. Test devices endpoint
curl http://localhost:8000/api/v1/customer/starlink/devices \
  -b cookies.txt

# Expected response: {"devices":[],"message":"No devices found..."}
```

## Understanding the Responses

### ✅ Good Response (Working Correctly)
```json
{
  "devices": [],
  "message": "No devices found for this account"
}
```
**Status Code**: 200 OK  
**Meaning**: Endpoint works, just no data exists yet

### ❌ Bad Response (Broken)
```json
{
  "detail": "Starlink API error: 404 - {...}"
}
```
**Status Code**: 500 Internal Server Error  
**Meaning**: Something is broken (this should NOT happen anymore)

## When You Get Real Customers

Once your company has actual Starlink customers with real Client ID/Secret:

1. Create customer via Admin Portal with their credentials
2. Customer logs in
3. All endpoints will return real data from Starlink API
4. No code changes needed - it just works!

## Troubleshooting

### Still Getting 500 Errors?

1. Check backend logs for the actual error
2. Verify Starlink credentials are correct in Key Vault
3. Ensure the customer's Starlink partner account exists
4. Run the test script to isolate the issue

### Authentication Issues?

1. Clear browser cookies
2. Re-login as customer
3. Check that `/auth/me` returns `is_admin: false`

## Summary

- **Empty data = Normal** ✅
- **500 errors = Bug** ❌ (should be fixed now)
- **200 OK with message = Working perfectly** ✅

The system is designed to work whether you have 0 customers or 1000 customers!
