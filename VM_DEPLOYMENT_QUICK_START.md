# Quick Deployment Guide for Your VM

## Your Current VM Setup

| Service | Port Used By Other Projects |
|---------|----------------------------|
| **Backend API** | 8010, 8020 |
| **Database** | 5433, 5434 |
| **Nginx** | 80, 443 |

---

## This Project's Configuration (No Conflicts!)

| Service | Port | Notes |
|---------|------|-------|
| **Frontend HTTP** | 8080 | Access via `http://your-ip:8080` |
| **Frontend HTTPS** | 8443 | Access via `https://your-ip:8443` |
| **Backend API** | 8030 | Access via `http://your-ip:8030` |
| **Database** | 5435 | Internal use only |

---

## Deployment Steps

### 1. Copy Environment File
```bash
# SSH into your VM
ssh azureuser@your-vm-ip

# Navigate to project directory
cd /path/to/starlink-dashboard

# Copy example file
cp .env.example .env
```

### 2. Edit `.env` File
```bash
nano .env
```

**Minimum changes needed:**
```env
# Project name
PROJECT_NAME=starlink

# Database password (CHANGE THIS!)
DB_PASSWORD=YourStrongPassword123!

# JWT Secret (CHANGE THIS!)
JWT_SECRET_KEY=$(openssl rand -hex 32)

# Azure Key Vault
VAULT_URL=https://your-key-vault.vault.azure.net
AZURE_CLIENT_ID=your-client-id
AZURE_TENANT_ID=your-tenant-id

# CORS - Add your domain if using DuckDNS
ALLOWED_ORIGINS=http://localhost:8080,http://your-domain.duckdns.org:8080

# API URLs - Update with your domain or VM IP
REACT_APP_API_URL=http://your-vm-ip:8030/api/v1
REACT_APP_WS_URL=ws://your-vm-ip:8030
```

### 3. Deploy
```bash
docker-compose up -d --build
```

### 4. Verify
```bash
# Check containers are running
docker-compose ps

# View logs
docker-compose logs -f
```

---

## Access URLs

### Local Development (on your machine)
- **Frontend**: `http://localhost:8080`
- **Backend API**: `http://localhost:8030/api/v1/health`
- **WebSocket**: `ws://localhost:8030`

### On VM (replace with your VM IP)
- **Frontend**: `http://YOUR-VM-IP:8080`
- **Backend API**: `http://YOUR-VM-IP:8030/api/v1/health`
- **WebSocket**: `ws://YOUR-VM-IP:8030`

### With DuckDNS Domain
- **Frontend**: `http://your-domain.duckdns.org:8080`
- **Backend API**: `http://your-domain.duckdns.org:8030/api/v1/health`
- **WebSocket**: `ws://your-domain.duckdns.org:8030`

---

## Firewall Configuration

```bash
# Open required ports on VM
sudo ufw allow 8080/tcp   # Frontend HTTP
sudo ufw allow 8443/tcp   # Frontend HTTPS
sudo ufw allow 8030/tcp   # Backend API

# Verify
sudo ufw status
```

**Also update Azure NSG (Network Security Group):**
1. Azure Portal → Your VM → Networking
2. Add inbound rules:
   - Port 8080 (HTTP)
   - Port 8443 (HTTPS)
   - Port 8030 (API)

---

## Production Configuration with DuckDNS

If using DuckDNS domain, update these in `.env`:

```env
# Replace 'your-domain' with your actual DuckDNS subdomain
ALLOWED_ORIGINS=http://your-domain.duckdns.org:8080,https://your-domain.duckdns.org:8443

REACT_APP_API_URL=http://your-domain.duckdns.org:8030/api/v1
REACT_APP_WS_URL=ws://your-domain.duckdns.org:8030
```

**Rebuild after changing .env:**
```bash
docker-compose down
docker-compose up -d --build
```

---

## Port Summary

| What | Port | Where to Change |
|------|------|-----------------|
| Frontend (HTTP) | **8080** | `FRONTEND_EXTERNAL_PORT` in `.env` |
| Frontend (HTTPS) | **8443** | `FRONTEND_HTTPS_PORT` in `.env` |
| Backend API | **8030** | `BACKEND_EXTERNAL_PORT` in `.env` |
| Database | **5435** | `DB_EXTERNAL_PORT` in `.env` |

---

## Troubleshooting

### Port Already in Use
```bash
# Check what's using a port
sudo lsof -i :8080
sudo lsof -i :8030
sudo lsof -i :5435

# If needed, change port in .env and rebuild
```

### Can't Access from Browser
1. ✅ Check firewall: `sudo ufw status`
2. ✅ Check Azure NSG rules
3. ✅ Verify URLs include port numbers (e.g., `:8080`, `:8030`)
4. ✅ Check `ALLOWED_ORIGINS` includes your access URL

### WebSocket Not Connecting
1. ✅ Verify `REACT_APP_WS_URL` is correct
2. ✅ Check browser console for errors
3. ✅ Ensure port 8030 is open in firewall and Azure NSG

---

## Managing the Project

### View Logs
```bash
docker-compose logs -f
```

### Restart
```bash
docker-compose restart
```

### Stop
```bash
docker-compose down
```

### Update Code
```bash
git pull
docker-compose down
docker-compose up -d --build
```

### Check Running Containers
```bash
docker ps
docker-compose ps
```

---

## Quick Commands Reference

```bash
# Deploy/Update
docker-compose up -d --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart specific service
docker-compose restart backend
docker-compose restart frontend

# Stop everything
docker-compose down

# Database backup
docker exec starlink_db pg_dump -U starlink starlink_dashboard > backup.sql

# Database restore
cat backup.sql | docker exec -i starlink_db psql -U starlink starlink_dashboard
```
