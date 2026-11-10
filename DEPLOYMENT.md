# 🚀 Head-2-Code DevOps & Deployment Guide

This document details the complete production infrastructure, containerization topology, continuous integration/continuous deployment (CI/CD) pipelines, and deployment procedures for **Head-2-Code**.

---

## 🏗️ 1. Architecture & Infrastructure Topology

```
                         [ CLIENT BROWSER ]
                                 │
                 (HTTPS :443 / WebSocket WSS)
                                 ▼
         ┌───────────────────────────────────────────────┐
         │         NGINX REVERSE PROXY GATEWAY           │
         │  • SSL Termination (Let's Encrypt / Certbot) │
         │  • WebSocket Upgrade Tunneling               │
         │  • Gzip Compression & Static Asset Caching   │
         └───────────────┬───────────────┬───────────────┘
                         │               │
            (HTTP /api)  │               │ (WebSocket /socket.io)
                         ▼               ▼
         ┌───────────────────────────────────────────────┐
         │         NODE.JS + EXPRESS API GATEWAY         │
         │  • JWT Auth & Anti-Cheat Watchdog            │
         │  • Friend Arena WebSocket Room Manager        │
         │  • Gemini 1.5 Pro Socratic AI Engine          │
         └───────┬───────────────┬───────────────┬───────┘
                 │               │               │
                 ▼               ▼               ▼
         ┌──────────────┐ ┌──────────────┐ ┌─────────────┐
         │ MONGODB      │ │ REDIS CLOUD  │ │ JUDGE0 CE   │
         │ ATLAS CLUSTER│ │ IN-MEMORY    │ │ SANDBOX     │
         │ (Persistent) │ │ (Cache/Elo)  │ │ (Execution) │
         └──────────────┘ └──────────────┘ └─────────────┘
```

---

## 🐳 2. Containerized Deployment (Docker & Docker Compose)

Head-2-Code is fully containerized using multi-stage Docker builds for minimal attack surface and sub-50MB Alpine footprints.

### Prerequisites
- Docker Engine v24+
- Docker Compose v2.20+

### Run the Entire Platform Locally:
```bash
# 1. Clone repository
git clone https://github.com/TusarGoswami/Head-2-Code.git
cd Head-2-Code

# 2. Configure backend environment
cp backend/.env.example backend/.env

# 3. Spin up all microservices with one command
docker compose up --build -d
```

### Services Orchestrated:
| Service | Container Name | Internal Port | External Port | Purpose |
|---|---|---|---|---|
| **Nginx** | `head2code-nginx` | 80 | **80:80** | Reverse proxy, static asset cache, WebSocket upgrade |
| **Frontend** | `head2code-frontend` | 80 | Internal | Multi-stage Nginx Alpine SPA container |
| **Backend** | `head2code-backend` | 5000 | Internal | Node.js 20 Alpine API & WebSocket microservice |
| **Redis** | `head2code-redis` | 6379 | **6379:6379** | In-memory ELO cache, session store |

---

## ☁️ 3. Cloud Virtual Server Deployment (AWS EC2 / Linux VPS)

For deploying onto a standalone Ubuntu Linux compute instance (AWS EC2, Oracle Cloud, DigitalOcean):

### Step 1: Provision Server & Install Runtime
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm nginx git
sudo npm install -g pm2
```

### Step 2: Clone & Configure
```bash
git clone https://github.com/TusarGoswami/Head-2-Code.git /var/www/head2code
cd /var/www/head2code/backend
npm install --production
nano .env  # Add your production credentials
```

### Step 3: Run Backend with PM2 Cluster Mode
```bash
pm2 start src/index.js --name "head2code-api" -i max
pm2 save
pm2 startup
```

### Step 4: Build & Serve Frontend
```bash
cd /var/www/head2code/frontend
npm install
npm run build
# Built files are placed in /var/www/head2code/frontend/dist
```

### Step 5: Configure Nginx Reverse Proxy
Copy `nginx/nginx.conf` into `/etc/nginx/sites-available/head2code`:
```bash
sudo cp /var/www/head2code/nginx/nginx.conf /etc/nginx/sites-available/head2code
sudo ln -s /etc/nginx/sites-available/head2code /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Step 6: Automated SSL with Let's Encrypt Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d head2code.duckdns.org
```

---

## ⚡ 4. Zero-Cost Multi-Cloud Edge Deployment (Vercel + Render)

For 100% free, high-availability hosting without infrastructure bills:

### A. Backend on Render.com
1. Create a **New Web Service** pointing to `backend/`.
2. Set Build Command: `npm install` | Start Command: `npm start`.
3. Add environment variables from `backend/.env`.
4. Render provides an automatic HTTPS endpoint with persistent WebSockets: `https://head2code-backend.onrender.com`.

### B. Frontend on Vercel
1. Import repository on **Vercel** with root directory set to `frontend/`.
2. Framework Preset: `Vite`.
3. Environment Variable: `VITE_API_URL=https://head2code-backend.onrender.com`.
4. Deploy! Vercel handles global CDN, edge caching, and SPA routing via `frontend/vercel.json`.

---

## 🔄 5. CI/CD Pipeline (GitHub Actions)

Located at `.github/workflows/ci-cd.yml`, our continuous integration pipeline executes on every push and pull request:
1. **Backend Verification:** Validates JavaScript AST syntax across all controller, model, and route files.
2. **Frontend Build Verification:** Runs Vite compiler against production bundle targets.
3. **Docker Buildx Automation:** Validates containerization build steps for both frontend and backend Dockerfiles.

