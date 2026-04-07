# Multi-Project Deployment on Same VM

## Running Multiple Projects on One Azure VM

When you have multiple projects on the same VM, you need to avoid port conflicts. Here's how to configure each project with unique ports.

---

## Project 1: Starlink Dashboard (This Project)

### Directory Structure
```
/home/azureuser/projects/
├── starlink-dashboard/
│   ├── .env  ← Create this file
│   ├── docker-compose.yml
│   └── ...
```

### `.env` Configuration
```env
# Project Identification
PROJECT_NAME=starlink

# Database - Use unique external port
DB_USER=starlink
DB_PASSWORD=StrongPassword123!
DB_NAME=starlink_dashboard
DB_PORT=5432
DB_EXTERNAL_PORT=5434  ← UNIQUE

# Backend - Use unique external port
BACKEND_PORT=8000
BACKEND_EXTERNAL_PORT=8000  ← UNIQUE

# Frontend - Use unique HTTP/HTTPS ports
FRONTEND_EXTERNAL_PORT=80  ← UNIQUE
FRONTEND_HTTPS_PORT=443  ← UNIQUE

# URLs
REACT_APP_API_URL=http://starlink.yourdomain.com/api/v1
REACT_APP_WS_URL=ws://starlink.yourdomain.com

# Other settings...
ALLOWED_ORIGINS=http://starlink.yourdomain.com,https://starlink.yourdomain.com
JWT_SECRET_KEY=your-secret-key
VAULT_URL=https://your-vault.vault.azure.net
AZURE_CLIENT_ID=your-client-id
AZURE_TENANT_ID=your-tenant-id
```

### Deploy
```bash
cd /home/azureuser/projects/starlink-dashboard
docker-compose up -d --build
```

---

## Project 2: Example - Another App

### Directory Structure
```
/home/azureuser/projects/
├── starlink-dashboard/
├── another-project/
│   ├── .env  ← Create this file
│   ├── docker-compose.yml
│   └── ...
```

### `.env` Configuration
```env
# Project Identification
PROJECT_NAME=anotherapp

# Database - DIFFERENT external port
DB_USER=anotherapp
DB_PASSWORD=StrongPassword456!
DB_NAME=anotherapp_db
DB_PORT=5432
DB_EXTERNAL_PORT=5435  ← DIFFERENT from starlink

# Backend - DIFFERENT external port
BACKEND_PORT=8000
BACKEND_EXTERNAL_PORT=8001  ← DIFFERENT from starlink

# Frontend - DIFFERENT HTTP/HTTPS ports
FRONTEND_EXTERNAL_PORT=8080  ← DIFFERENT from starlink
FRONTEND_HTTPS_PORT=8443  ← DIFFERENT from starlink

# URLs
REACT_APP_API_URL=http://anotherapp.yourdomain.com:8080/api/v1
REACT_APP_WS_URL=ws://anotherapp.yourdomain.com:8080

# Other settings...
ALLOWED_ORIGINS=http://anotherapp.yourdomain.com:8080
```

### Deploy
```bash
cd /home/azureuser/projects/another-project
docker-compose up -d --build
```

---

## Project 3: Example - Third App

### `.env` Configuration
```env
PROJECT_NAME=thirdapp

# Unique ports
DB_EXTERNAL_PORT=5436
BACKEND_EXTERNAL_PORT=8002
FRONTEND_EXTERNAL_PORT=3000
FRONTEND_HTTPS_PORT=3443

# URLs (include port numbers)
REACT_APP_API_URL=http://thirdapp.yourdomain.com:3000/api/v1
REACT_APP_WS_URL=ws://thirdapp.yourdomain.com:3000
ALLOWED_ORIGINS=http://thirdapp.yourdomain.com:3000
```

---

## Port Allocation Strategy

### Recommended Port Scheme

| Project | DB External | Backend External | Frontend HTTP | Frontend HTTPS |
|---------|-------------|------------------|---------------|----------------|
| **Project 1** | 5434 | 8000 | 80 | 443 |
| **Project 2** | 5435 | 8001 | 8080 | 8443 |
| **Project 3** | 5436 | 8002 | 3000 | 3443 |
| **Project 4** | 5437 | 8003 | 9000 | 9443 |

### Port Ranges to Use
- **Database External**: 5434-5499
- **Backend External**: 8000-8099
- **Frontend HTTP**: 80, 3000, 8080, 8888, 9000, 9090
- **Frontend HTTPS**: 443, 3443, 8443, 8843, 9443, 9091

---

## Where to Create `.env` File on VM

### Option 1: In Project Root (Recommended)
```bash
# SSH into your VM
ssh azureuser@your-vm-ip

# Navigate to project directory
cd /home/azureuser/projects/starlink-dashboard

# Create .env file
nano .env

# Paste your configuration
# Save and exit (Ctrl+O, Enter, Ctrl+X)
```

### Option 2: Using SCP from Local Machine
```bash
# From your local machine
scp .env azureuser@your-vm-ip:/home/azureuser/projects/starlink-dashboard/.env
```

### Option 3: Using Git (Secure Method)
```bash
# DON'T commit .env to git!
# Instead, commit .env.example and copy on VM

# On VM:
cp .env.example .env
nano .env  # Edit with production values
```

---

## Verify Ports Are Not in Use

Before deploying, check if ports are available:

```bash
# Check if a port is in use
sudo lsof -i :8000
sudo lsof -i :5434
sudo lsof -i :80

# Or use netstat
sudo netstat -tulpn | grep :8000

# View all listening ports
sudo ss -tulpn
```

---

## Managing Multiple Projects

### Start All Projects
```bash
# Project 1
cd /home/azureuser/projects/starlink-dashboard
docker-compose up -d

# Project 2
cd /home/azureuser/projects/another-project
docker-compose up -d

# Project 3
cd /home/azureuser/projects/third-project
docker-compose up -d
```

### Check Status of All Containers
```bash
# View all running containers
docker ps

# Filter by project name
docker ps --filter "name=starlink"
docker ps --filter "name=anotherapp"
```

### View Logs
```bash
# Starlink project
cd /home/azureuser/projects/starlink-dashboard
docker-compose logs -f

# Another project
cd /home/azureuser/projects/another-project
docker-compose logs -f
```

### Stop a Project
```bash
cd /home/azureuser/projects/starlink-dashboard
docker-compose down
```

### Update a Project
```bash
cd /home/azureuser/projects/starlink-dashboard
docker-compose down
git pull
docker-compose up -d --build
```

---

## Firewall Configuration

Open required ports on Azure VM:

```bash
# Check firewall status
sudo ufw status

# Allow ports for Project 1 (Starlink)
sudo ufw allow 80/tcp    # Frontend HTTP
sudo ufw allow 443/tcp   # Frontend HTTPS
sudo ufw allow 8000/tcp  # Backend API

# Allow ports for Project 2
sudo ufw allow 8080/tcp  # Frontend HTTP
sudo ufw allow 8443/tcp  # Frontend HTTPS
sudo ufw allow 8001/tcp  # Backend API

# Enable firewall
sudo ufw enable
```

**Also update Azure Network Security Group (NSG):**
1. Go to Azure Portal → Your VM → Networking
2. Add inbound rules for each port
3. Set source to `Any` or specific IPs

---

## Access URLs

After deployment:

### Project 1 (Starlink)
- **Frontend**: `http://your-vm-ip` or `http://starlink.yourdomain.com`
- **Backend API**: `http://your-vm-ip:8000/api/v1/health`
- **WebSocket**: `ws://your-vm-ip:8000`

### Project 2
- **Frontend**: `http://your-vm-ip:8080` or `http://anotherapp.yourdomain.com:8080`
- **Backend API**: `http://your-vm-ip:8001/api/v1/health`
- **WebSocket**: `ws://your-vm-ip:8001`

### Project 3
- **Frontend**: `http://your-vm-ip:3000`
- **Backend API**: `http://your-vm-ip:8002/api/v1/health`

---

## Quick Reference: Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `PROJECT_NAME` | Unique project identifier | `starlink`, `app2`, `app3` |
| `DB_EXTERNAL_PORT` | Database port on host | `5434`, `5435`, `5436` |
| `BACKEND_EXTERNAL_PORT` | Backend API port on host | `8000`, `8001`, `8002` |
| `FRONTEND_EXTERNAL_PORT` | Frontend HTTP port on host | `80`, `8080`, `3000` |
| `FRONTEND_HTTPS_PORT` | Frontend HTTPS port on host | `443`, `8443`, `3443` |
| `REACT_APP_API_URL` | Frontend → Backend URL | `http://domain:8000/api/v1` |
| `REACT_APP_WS_URL` | Frontend → WebSocket URL | `ws://domain:8000` |

---

## Troubleshooting

### Port Already in Use
```bash
# Find what's using the port
sudo lsof -i :8000

# Kill the process (if needed)
sudo kill -9 <PID>

# Or change port in .env
BACKEND_EXTERNAL_PORT=8001
```

### Container Name Conflicts
```bash
# Each project has unique container names due to PROJECT_NAME
# If conflicts occur:
docker-compose down
docker system prune -f
docker-compose up -d
```

### Can't Access from Browser
1. Check firewall: `sudo ufw status`
2. Check Azure NSG rules
3. Verify URLs include correct ports
4. Check ALLOWED_ORIGINS in .env
