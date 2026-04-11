# Deployment Guide

## Prerequisites

- Node.js v24+
- npm v11+
- PM2 (`npm install -g pm2`)
- PostgreSQL (running on localhost:5432)

## Project Structure

```
ai-ats/
├── backend/          # ATS Backend  (Express, port 5000, managed by PM2)
├── frontend/         # ATS Frontend (React + Vite, built to dist/)
├── landing/
│   ├── backend/      # Landing Backend (Express, port 3001, managed by nohup)
│   └── frontend/     # Landing Frontend (React + Vite, built to dist/)
└── deploy.sh         # Deployment script
```

## Quick Deploy

```bash
# Deploy everything
./deploy.sh

# Or deploy specific service
./deploy.sh backend
./deploy.sh frontend
./deploy.sh landing
```

## Deploy Script Commands

| Command | Description |
|---------|-------------|
| `./deploy.sh` | Deploy all services (default) |
| `./deploy.sh all` | Same as above |
| `./deploy.sh backend` | ATS backend only — install deps + pm2 restart |
| `./deploy.sh frontend` | ATS frontend only — install deps + vite build |
| `./deploy.sh landing` | Landing backend + frontend |
| `./deploy.sh landing-backend` | Landing backend only — install deps + restart process |
| `./deploy.sh landing-frontend` | Landing frontend only — install deps + vite build |
| `./deploy.sh status` | Show all running services |
| `./deploy.sh logs` | Show recent logs from all services |
| `./deploy.sh logs backend` | Tail ATS backend logs (pm2) |
| `./deploy.sh logs landing` | Tail landing backend logs |

## Services

### ATS Backend

- **Port:** 5000
- **Process manager:** PM2 (name: `ats-backend`)
- **Entry:** `backend/app.js`
- **Config:** `backend/.env.dev`

```bash
# Manual commands
pm2 restart ats-backend
pm2 logs ats-backend
pm2 status
```

### ATS Frontend

- **Build output:** `frontend/dist/`
- **Dev server:** `cd frontend && npm run dev` (port 5173)

```bash
# Manual build
cd frontend && npm run build
```

### Landing Backend

- **Port:** 3001
- **Process manager:** nohup
- **Entry:** `landing/backend/app.js`
- **Logs:** `/tmp/landing-backend.log`

```bash
# Manual restart
pkill -f "node landing/backend/app.js"
cd landing/backend && nohup node app.js > /tmp/landing-backend.log 2>&1 &
```

### Landing Frontend

- **Build output:** `landing/frontend/dist/`
- **Dev server:** `cd landing/frontend && npm run dev`

```bash
# Manual build
cd landing/frontend && npm run build
```

## Environment Variables

Backend config lives in `backend/.env.dev`:

```env
DATABASEURL=postgresql://postgres:<password>@localhost:5432/ats
JWT_SECRET=<your_jwt_secret>
ENCRYPTION_KEY=<your_encryption_key>
```

## First-Time Setup

```bash
# 1. Install PM2 globally
npm install -g pm2

# 2. Setup database
cd backend && node src/db/run-script.js

# 3. Start ATS backend with PM2 for the first time
cd backend && pm2 start app.js --name ats-backend
pm2 save

# 4. Deploy all
./deploy.sh
```

## Monitoring

```bash
# Check all services
./deploy.sh status

# View logs
./deploy.sh logs            # All services
./deploy.sh logs backend    # ATS backend only
./deploy.sh logs landing    # Landing backend only

# PM2 monitoring dashboard
pm2 monit
```
