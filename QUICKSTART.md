# Quick Start Guide - Admin Portal

## Prerequisites

1. PostgreSQL database running on port 5434
2. Azure Key Vault configured and accessible
3. Python 3.8+ installed
4. Node.js 16+ installed

## Step 1: Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

## Step 2: Configure Environment Variables

Ensure `backend/.env` has the correct values:

```env
VAULT_URL=https://starlink-dashboard-kv.vault.azure.net
DATABASE_URL=postgresql://starlink:password@127.0.0.1:5434/starlink_dashboard
JWT_SECRET_KEY=<generate-strong-random-key>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

**IMPORTANT:** Generate a strong JWT secret key:
```bash
# On Linux/Mac
openssl rand -hex 32

# On Windows (PowerShell)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

## Step 3: Initialize Database

Run the initialization script to create tables and insert admin user:

```bash
cd backend
python init_db.py
```

This will:
- Create the `users` table in PostgreSQL
- Insert an initial admin user with credentials:
  - Email: `admin@tasksystems.com`
  - Password: `Admin@123456`

**⚠️ IMPORTANT:** Change the admin password after first login!

## Step 4: Start Backend Server

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

The API will be available at: http://localhost:8000

API Documentation: http://localhost:8000/docs

## Step 5: Install Frontend Dependencies

```bash
cd frontend
npm install
```

## Step 6: Start Frontend Development Server

```bash
cd frontend
npm start
```

The frontend will open automatically at: http://localhost:3000

## Step 7: Test the System

### Test Admin Customer Creation

1. Navigate to: http://localhost:3000/admin/customers
2. Fill in the form:
   - Email: customer@example.com
   - Enterprise Name: Test Enterprise
   - Starlink Client ID: (your Starlink client ID)
   - Starlink Client Secret: (your Starlink client secret)
   - Password: Customer@123
   - Confirm Password: Customer@123
3. Click "Create Customer"
4. You should see a success message

### Test Customer Login

1. Navigate to: http://localhost:3000/login
2. Enter the customer credentials you just created
3. Click "Login"
4. You should be redirected to the customer dashboard

### Test Customer Dashboard

1. After login, you'll see the customer dashboard
2. It will fetch and display:
   - Starlink account information
   - Telemetry data
3. Click "Refresh Data" to reload

## Troubleshooting

### Database Connection Error

If you see database connection errors:
1. Ensure PostgreSQL is running on port 5434
2. Check DATABASE_URL in `.env` file
3. Verify database `starlink_dashboard` exists

### Key Vault Connection Error

If KMS fails:
1. Ensure Azure Key Vault is accessible
2. Check VAULT_URL in `.env` file
3. Verify you have proper Azure credentials (run `az login` if developing locally)

### CORS Errors

If you see CORS errors:
1. Ensure backend is running on port 8000
2. Check that `allow_origins` in `main.py` includes `http://localhost:3000`

### Authentication Errors

If login fails:
1. Check browser console for errors
2. Verify backend is returning proper responses
3. Check that cookies are being set (DevTools → Application → Cookies)

## API Endpoints Reference

### Public Endpoints
- `POST /api/v1/auth/login` - Customer login

### Admin Endpoints (Requires admin token)
- `POST /api/v1/admin/customers` - Create new customer

### Customer Endpoints (Requires customer token)
- `GET /api/v1/customer/starlink/account` - Get account info
- `GET /api/v1/customer/starlink/telemetry` - Get telemetry data

## Security Checklist Before Production

- [ ] Change JWT_SECRET_KEY to a strong random value
- [ ] Change admin password from default
- [ ] Set `secure=True` in cookie settings (requires HTTPS)
- [ ] Enable HTTPS
- [ ] Implement rate limiting on login endpoint
- [ ] Set up monitoring and logging
- [ ] Configure separate Key Vaults per environment
- [ ] Review and update CORS origins
- [ ] Set up database backups
- [ ] Configure proper error pages

## Next Steps

1. **Customize the Dashboard:** Modify `CustomerDashboard.tsx` to display data in a more user-friendly format
2. **Add More Features:** Extend with device management, command execution, etc.
3. **Implement Logout:** Add logout functionality to clear cookies
4. **Add User Profile:** Allow customers to update their password
5. **Add Audit Logging:** Track all admin actions

## Support

For issues or questions:
1. Check the IMPLEMENTATION_SUMMARY.md for detailed documentation
2. Review API documentation at http://localhost:8000/docs
3. Check backend logs for error details
4. Check browser console for frontend errors
