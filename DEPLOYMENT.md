# Production Deployment Guide

## Deploying to Azure VM with DuckDNS

### 1. Setup Your Domain

1. Create a free account at [duckdns.org](https://www.duckdns.org)
2. Create a subdomain (e.g., `mydashboard.duckdns.org`)
3. Point it to your Azure VM's public IP address

### 2. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit with your production values
nano .env
```

**Example `.env` for production:**

```env
# Database
DB_USER=starlink
DB_PASSWORD=YourStrongPassword123!
DB_NAME=starlink_dashboard

# JWT
JWT_SECRET_KEY=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Azure Key Vault
VAULT_URL=https://your-key-vault.vault.azure.net
AZURE_CLIENT_ID=your-client-id
AZURE_TENANT_ID=your-tenant-id

# CORS - Add your duckdns domain
ALLOWED_ORIGINS=http://mydashboard.duckdns.org,https://mydashboard.duckdns.org

# Frontend URLs - Use your duckdns domain
REACT_APP_API_URL=http://mydashboard.duckdns.org/api/v1
REACT_APP_WS_URL=ws://mydashboard.duckdns.org
```

### 3. Deploy with Docker Compose

```bash
# Build and start all services
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Verify services are running
docker-compose ps
```

### 4. Access Your Application

- **Frontend**: `http://mydashboard.duckdns.org`
- **Backend API**: `http://mydashboard.duckdns.org/api/v1/health`
- **WebSocket**: Automatically proxied through nginx

### 5. (Optional) Setup HTTPS with Let's Encrypt

For production, you should use HTTPS. Here's a quick guide:

```bash
# Install certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot certonly --standalone -d mydashboard.duckdns.org

# Update nginx.conf to use SSL (see SSL configuration below)
```

---

## For Local Development

Keep your current `.env` file with localhost values:

```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:80
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_WS_URL=ws://localhost:8000
```

Run with:
```bash
docker-compose up -d
```

---

## Important Production Notes

### Security Checklist

- ✅ Change `JWT_SECRET_KEY` to a random 64-character string
- ✅ Use strong database passwords
- ✅ Remove volume mounts from docker-compose.yml (already done)
- ✅ Disable debug mode in production
- ✅ Use HTTPS in production (recommended)
- ✅ Keep `.env` files out of version control

### Environment Variables Summary

| Variable | Description | Example |
|----------|-------------|---------|
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://domain.com,https://domain.com` |
| `REACT_APP_API_URL` | Backend API URL for frontend | `http://domain.com/api/v1` |
| `REACT_APP_WS_URL` | WebSocket URL for frontend | `ws://domain.com` |
| `JWT_SECRET_KEY` | Secret key for JWT tokens | Random 64-char string |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@db:5432/dbname` |

---

## Troubleshooting

### WebSocket Not Connecting?

1. Check nginx is proxying `/ws/` to backend
2. Verify `REACT_APP_WS_URL` is correct
3. Check browser console for WebSocket errors
4. Ensure firewall allows port 80/443

### CORS Errors?

1. Update `ALLOWED_ORIGINS` in `.env`
2. Include both `http://` and `https://` versions
3. Restart backend: `docker-compose restart backend`

### API Not Working?

1. Verify `REACT_APP_API_URL` matches your domain
2. Check nginx proxy configuration
3. Test backend directly: `curl http://localhost:8000/api/v1/health`

---

## Rebuilding After Changes

```bash
# Rebuild all services
docker-compose down
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build frontend
```
