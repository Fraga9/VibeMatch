# 🚀 VibeMatch Deployment Guide - Student Edition

This guide covers deploying VibeMatch to production using **student free credits** for maximum cost efficiency.

**Last Updated:** December 2025

---

## 🎯 Recommended Deployment Options for Students

### Option 1: DigitalOcean (RECOMMENDED) ⭐

| Component | Platform | Cost with Student Credits |
|-----------|----------|---------------------------|
| **Frontend** | Vercel | FREE (100GB bandwidth/month) |
| **Backend** | **DigitalOcean App Platform** ⭐ | FREE for 16+ months with $200 credits |
| **Vector DB** | Qdrant Cloud | FREE (1GB storage ~700K users) |

**Total Cost with DigitalOcean:**
- **Months 1-16:** $0 (using $200 credits @ $12/mo)
- **After credits:** $12/month or switch to Droplets

**Why DigitalOcean for Students?**
- ✅ **$200 FREE credits** - Double Azure's $100 (valid 1 year)
- ✅ **Easier setup** - Simpler UI than Azure, better for beginners
- ✅ **App Platform (PaaS)** - Deploy like Heroku/Vercel, no SSH/Docker needed
- ✅ **Longer lasting** - 16+ months free vs Azure's 3-4 months
- ✅ **Auto-deploy** - Git push to deploy, built-in CI/CD
- ✅ **Auto HTTPS** - Free SSL certificates
- ✅ **Great DX** - Better documentation and developer experience

**Quick Start:** See [DIGITALOCEAN_QUICKSTART.md](DIGITALOCEAN_QUICKSTART.md) for step-by-step guide.

---

### Option 2: Azure (Alternative)

| Component | Platform | Cost with Student Credits |
|-----------|----------|---------------------------|
| **Frontend** | Vercel | FREE (100GB bandwidth/month) |
| **Backend** | **Azure VM (B2s)** | FREE for 3-4 months with $100 credits |
| **Vector DB** | Qdrant Cloud | FREE (1GB storage ~700K users) |

**Total Cost with Azure for Students:**
- **Months 1-3:** $0 (using credits)
- **After credits:** ~$30/month or switch to free tier VM

**Why Azure for Students?**
- ✅ **$100 FREE credits** - No credit card required with .edu email
- ✅ **Renewable yearly** - Get another $100 each year you're a student
- ✅ **2 vCPU, 4GB RAM** - More RAM than DigitalOcean App Platform
- ✅ **Full control** - Ubuntu VM, install anything
- ✅ **Industry standard** - Azure experience valuable for resume
- ✅ **No sleep/cold starts** - Runs 24/7

**Quick Start:** See [AZURE_QUICKSTART.md](AZURE_QUICKSTART.md) for step-by-step guide.

---

## 📊 Detailed Comparison

| Feature | DigitalOcean App Platform | DigitalOcean Droplets | Azure VMs |
|---------|---------------------------|----------------------|-----------|
| **Difficulty** | ⭐ Easy | ⭐⭐ Medium | ⭐⭐⭐ Advanced |
| **Setup Time** | 15 min | 30 min | 45 min |
| **Credits** | $200 (1 year) | $200 (1 year) | $100 (1 year) |
| **Cost/Month** | $12 | $24 | $30 |
| **Free Months** | 16+ months | 8+ months | 3-4 months |
| **RAM** | 1 GB | 4 GB | 4 GB |
| **CPU** | 1 vCPU | 2 vCPU | 2 vCPU |
| **Management** | Fully managed | Manual | Manual |
| **SSH Access** | Limited console | Full root | Full root |
| **Auto-scaling** | ✅ Yes | ❌ No | ❌ No |
| **Auto HTTPS** | ✅ Yes | ⚙️ Manual | ⚙️ Manual |
| **Best For** | Beginners | Advanced users | Enterprise/learning Azure |

**Our Recommendation:**
1. **Start with DigitalOcean App Platform** - Easiest, longest free tier
2. **Upgrade to Droplets** if you need more RAM (4GB)
3. **Use Azure** if you want enterprise experience or need specific Azure services

---

## 📋 Pre-Deployment Checklist

- [ ] Active .edu email address or student verification
- [ ] GitHub Education account verified ([apply here](https://education.github.com/pack))
- [ ] Train GNN model and generate embeddings (`backend/model/precomputed_embeddings.pkl`)
- [ ] Obtain Last.fm API credentials ([get here](https://www.last.fm/api/account/create))
- [ ] Create cloud account:
  - **DigitalOcean:** Sign up and claim $200 credit
  - **OR Azure:** Create Azure for Students account ($100 credit)
- [ ] Create Qdrant Cloud account ([free tier](https://cloud.qdrant.io))
- [ ] Create Vercel account ([sign up](https://vercel.com))
- [ ] Test Docker build locally (optional but recommended)
- [ ] Have payment method ready for account verification (won't be charged)

---

## 🚀 Deployment Guides

### Quick Start Guides (Recommended)

For the fastest deployment experience, use our quick start guides:

- **[DigitalOcean Quick Start](DIGITALOCEAN_QUICKSTART.md)** ⭐ - 25-35 minutes, easiest setup
- **[Azure Quick Start](AZURE_QUICKSTART.md)** - 30-45 minutes, more advanced

### Detailed Deployment Instructions

The sections below provide comprehensive deployment instructions for each platform.

---

## 🗄️ Step 1: Deploy Qdrant Database (Qdrant Cloud)

**Note:** This step is the same for all deployment options (DigitalOcean, Azure, etc.)

### 1.1 Create Qdrant Cloud Account

1. Go to **https://cloud.qdrant.io**
2. Sign up with GitHub or email
3. Verify your email

### 1.2 Create Free Cluster

1. Click **"Create Cluster"**
2. Select **Free Tier**:
   - 1GB storage
   - Managed hosting
   - Automatic backups
3. Choose a region closest to Azure region you'll use:
   - `us-east` (if deploying to East US Azure)
   - `eu-west` (if deploying to West Europe Azure)
4. Name your cluster: `vibematch-prod`
5. Click **"Create"**

### 1.3 Get Connection Details

After cluster creation (~2 minutes):

1. Click on your cluster
2. Copy these values:
   ```
   Cluster URL: https://xyz-abc123.cloud.qdrant.io
   API Key: qdrant_XXXXXXXXXXXXXXXXXXXXXXXX
   ```

3. **Save these** - you'll need them for backend deployment

**Storage Capacity:**
- **1GB = ~700,000-850,000 users** with 128-dim embeddings
- Includes metadata (username, genres, stats)

---

## 🚀 Step 2: Deploy Backend (Choose Your Platform)

You have two main options for deploying your backend:

### Option A: DigitalOcean (RECOMMENDED) ⭐

**Choose this if you want:**
- Easiest deployment (PaaS like Heroku)
- Longest free tier (16+ months)
- Built-in CI/CD and auto-deploy
- Auto HTTPS/SSL certificates
- Beginner-friendly interface

**Two deployment methods:**
1. **App Platform** - Fully managed, easiest (recommended for beginners)
2. **Droplets** - VM with more control, similar to Azure

**See:** [DIGITALOCEAN_QUICKSTART.md](DIGITALOCEAN_QUICKSTART.md) for complete step-by-step instructions.

### Option B: Azure (Alternative)

**Choose this if you want:**
- Enterprise cloud experience for resume
- More RAM (4GB vs 1GB)
- Full VM control from the start
- Specific Azure services

**See:** Sections below or [AZURE_QUICKSTART.md](AZURE_QUICKSTART.md) for complete instructions.

---

## 🟦 Option A: DigitalOcean Deployment

### Method 1: DigitalOcean App Platform (Recommended)

**Best for:** Beginners, quick deployment, managed infrastructure

#### 2A.1 Activate GitHub Education Credits

1. Apply for [GitHub Student Developer Pack](https://education.github.com/pack)
2. Wait for verification (5 minutes - 2 days)
3. Visit [DigitalOcean for Students](https://www.digitalocean.com/github-students)
4. Sign up and get **$200 credit for 1 year**
5. Add payment method (verification only, won't be charged)

#### 2A.2 Prepare Your Backend

Update `backend/Procfile`:
```
web: gunicorn -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8080 app.main:app
```

Create `backend/runtime.txt`:
```
python-3.11.0
```

Update `backend/requirements.txt` to include:
```
gunicorn==21.2.0
```

Commit and push:
```bash
git add backend/Procfile backend/runtime.txt backend/requirements.txt
git commit -m "feat: configure for DigitalOcean App Platform"
git push origin main
```

#### 2A.3 Deploy to App Platform

1. Go to [DigitalOcean Dashboard](https://cloud.digitalocean.com)
2. Click **"Apps"** → **"Create App"**
3. Connect your GitHub repository
4. Configure:
   - **Source Directory:** `/backend`
   - **Branch:** `main`
   - **Autodeploy:** ✅ Enabled
5. Choose **Basic** plan ($12/month = 16+ months free)
6. Set environment variables (see DIGITALOCEAN_QUICKSTART.md)
7. Deploy and wait ~5 minutes

**Your backend will be at:** `https://vibematch-backend-xxxxx.ondigitalocean.app`

### Method 2: DigitalOcean Droplets (Advanced)

**Best for:** Advanced users who need more RAM (4GB)

#### 2A-ALT.1 Create Droplet

1. Dashboard → **Create** → **Droplets**
2. Choose **Docker on Ubuntu 22.04** (1-Click)
3. **Plan:** Basic, $24/month (4GB RAM, 2 vCPUs)
4. **Authentication:** SSH Key (generate if needed)
5. **Hostname:** `vibematch-vm`
6. Create and note the public IP

#### 2A-ALT.2 Setup Backend

SSH into droplet:
```bash
ssh root@YOUR_DROPLET_IP
```

Clone and deploy:
```bash
git clone https://github.com/YOUR_USERNAME/VibeMatch.git
cd VibeMatch/backend
docker build -t vibematch-backend .
docker run -d --name vibematch-backend -p 8000:8000 --env-file .env vibematch-backend
```

See [DIGITALOCEAN_QUICKSTART.md](DIGITALOCEAN_QUICKSTART.md) for complete instructions.

---

## 🔷 Option B: Azure VM Deployment (Student Credits)

### 2.1 Create Azure for Students Account

1. Go to **https://azure.microsoft.com/free/students**
2. Click **"Start free"**
3. Sign in with Microsoft account or create one
4. Verify student status:
   - **Option A:** Use .edu email (instant approval)
   - **Option B:** Upload student ID/verification document
5. **NO CREDIT CARD REQUIRED** ✅
6. Wait for approval (~1-5 minutes with .edu email)

**Important:** You get $100 credit valid for 12 months, renewable each year you're a student.

### 2.2 Create Ubuntu VM Instance

1. **Login** to Azure Portal: https://portal.azure.com
2. Click **"Create a resource"** → **"Virtual machine"**
3. **Configure Basics:**

   **Subscription:** Azure for Students

   **Resource group:**
   - Click "Create new"
   - Name: `vibematch-rg`

   **Virtual machine name:** `vibematch-vm`

   **Region:**
   - `East US` (cheapest, recommended)
   - `West Europe` (if you're in Europe)

   **Availability options:** No infrastructure redundancy required

   **Security type:** Standard

   **Image:**
   - Click "See all images"
   - Search "Ubuntu"
   - Select **Ubuntu Server 22.04 LTS - x64 Gen2**

   **Size:**
   - Click "See all sizes"
   - Search for **"B2s"**
   - Select **Standard_B2s** (2 vCPUs, 4 GiB RAM)
   - **Cost:** ~$0.0416/hour = ~$30/month
   - **With $100 credit:** 3-4 months FREE ✅

4. **Administrator account:**

   **Authentication type:** SSH public key ⚠️ (IMPORTANT)

   **Username:** `azureuser`

   **SSH public key source:**
   - **Generate new key pair** (recommended)
   - OR **Use existing public key** (if you have one)

   **Key pair name:** `vibematch-vm-key`

5. **Inbound port rules:**

   **Public inbound ports:** Allow selected ports

   **Select inbound ports:**
   - ✅ SSH (22)
   - ✅ HTTP (80)
   - ✅ HTTPS (443)

6. Click **"Next: Disks >"**

### 2.3 Configure Disks (CRITICAL FOR FREE TIER)

⚠️ **IMPORTANT:** To avoid storage charges, you MUST select the correct disk size.

1. **OS disk size:** Custom
2. **OS disk type:**
   - Click "Change size"
   - Search for **"P6"**
   - Select **Premium SSD - 64 GiB P6**
   - **MUST BE P6 64GB** to qualify for free tier!
   - Click "OK"

3. **Encryption type:** (Default) Encryption at-rest with platform-managed key

4. Click **"Next: Networking >"**

### 2.4 Configure Networking

1. **Virtual network:** (new) vibematch-vm-vnet
2. **Subnet:** (new) default (10.0.0.0/24)
3. **Public IP:** (new) vibematch-vm-ip
4. **NIC network security group:** Advanced
5. **Configure network security group:**
   - Click "Create new"
   - Name: `vibematch-vm-nsg`
   - **Add inbound rules:**

**Add these custom rules (click "Add an inbound rule" for each):**

**Rule 1: Custom Backend Port**
```
Source: Any
Source port ranges: *
Destination: Any
Service: Custom
Destination port ranges: 8000
Protocol: TCP
Action: Allow
Priority: 320
Name: Port_8000
```

6. Click **"OK"** to save security group
7. Click **"Review + create"**

### 2.5 Review and Create

1. Review all settings
2. Verify estimated cost shows **$0.00** (covered by credits)
3. Click **"Create"**
4. **Download private key** popup will appear
   - Click **"Download private key and create resource"**
   - Save `vibematch-vm-key.pem` in a safe location
   - **KEEP THIS SAFE** - you'll need it to connect

5. Wait 2-3 minutes for deployment

### 2.6 Get VM Public IP Address

1. Go to **Home** → **Virtual machines**
2. Click **vibematch-vm**
3. Copy the **Public IP address** (e.g., `20.123.45.67`)
4. Save this IP - you'll need it frequently

### 2.7 Connect to Your VM

**Windows (PowerShell):**
```powershell
# Set correct permissions on private key
icacls vibematch-vm-key.pem /inheritance:r
icacls vibematch-vm-key.pem /grant:r "%USERNAME%:R"

# Connect via SSH
ssh -i vibematch-vm-key.pem azureuser@<YOUR_PUBLIC_IP>
```

**macOS/Linux:**
```bash
# Set correct permissions
chmod 400 vibematch-vm-key.pem

# Connect via SSH
ssh -i vibematch-vm-key.pem azureuser@<YOUR_PUBLIC_IP>
```

Replace `<YOUR_PUBLIC_IP>` with your VM's public IP.

**First connection:** Type `yes` when asked about fingerprint.

### 2.8 Install Docker on Azure VM

Once connected to your VM:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group (no sudo needed)
sudo usermod -aG docker azureuser

# Install Docker Compose
sudo apt install docker-compose -y

# Logout and login again for group changes to take effect
exit
```

**Reconnect:**
```bash
ssh -i vibematch-vm-key.pem azureuser@<YOUR_PUBLIC_IP>

# Verify Docker works
docker --version
docker compose version
```

Expected output:
```
Docker version 24.x.x
Docker Compose version v2.x.x
```

### 2.9 Setup Environment Variables

Create `.env` file on the VM:

```bash
# Create app directory
mkdir -p ~/vibematch
cd ~/vibematch

# Create .env file
nano .env
```

**Paste this configuration** (replace with your actual values):

```bash
# Qdrant Configuration
QDRANT_HOST=xyz-abc123.cloud.qdrant.io
QDRANT_PORT=443
QDRANT_API_KEY=qdrant_XXXXXXXXXXXXXXXXXXXXXXXX
QDRANT_USE_HTTPS=true
QDRANT_COLLECTION_USERS=users
QDRANT_VECTOR_SIZE=128

# Last.fm API
LASTFM_API_KEY=your_lastfm_api_key
LASTFM_API_SECRET=your_lastfm_api_secret
LASTFM_CALLBACK_URL=http://<YOUR_PUBLIC_IP>:8000/auth/lastfm/callback

# Security
SECRET_KEY=your_super_secret_key_min_32_chars_long_random_string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# CORS (update after Vercel deployment)
FRONTEND_URL=http://localhost:3000

# Server
PORT=8000
ENVIRONMENT=production

# Admin
ADMIN_API_KEY=your_admin_api_key_change_this
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

**Generate SECRET_KEY:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```
Copy the output and paste it as `SECRET_KEY` in your `.env` file.

### 2.10 Setup GitHub Container Registry Authentication

Your CI/CD will push Docker images to GitHub Container Registry (GHCR). The VM needs to pull them:

**Get GitHub Personal Access Token:**
1. Go to GitHub → **Settings** → **Developer settings**
2. **Personal access tokens** → **Tokens (classic)**
3. **Generate new token (classic)**
4. Scopes needed:
   - ✅ `read:packages`
   - ✅ `write:packages`
   - ✅ `delete:packages`
5. Generate and copy the token

**Login to GHCR on VM:**
```bash
# Replace with your values
echo "<YOUR_GITHUB_TOKEN>" | docker login ghcr.io -u <YOUR_GITHUB_USERNAME> --password-stdin
```

Expected output: `Login Succeeded`

### 2.11 Create Docker Compose Configuration

```bash
cd ~/vibematch
nano docker-compose.yml
```

**Paste this:**

```yaml
version: '3.8'

services:
  backend:
    image: ghcr.io/<YOUR_GITHUB_USERNAME>/vibematch-backend:latest
    container_name: vibematch-backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    env_file:
      - .env
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    environment:
      - PORT=8000
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

Replace `<YOUR_GITHUB_USERNAME>` with your GitHub username (lowercase).

Save: `Ctrl+X`, `Y`, `Enter`

### 2.12 Initial Manual Deployment (Testing)

For the first deployment, let's test manually:

```bash
cd ~/vibematch

# Clone your repo (first time only)
git clone https://github.com/<YOUR_USERNAME>/VibeMatch.git
cd VibeMatch/backend

# Build Docker image locally
docker build -t vibematch-backend .

# Run container
cd ~/vibematch
docker run -d \
  --name vibematch-backend \
  -p 8000:8000 \
  --env-file .env \
  --restart unless-stopped \
  vibematch-backend

# Check logs
docker logs -f vibematch-backend
```

**Wait for startup messages:**
```
Loading embeddings...
✅ Loaded X track embeddings
✅ Loaded Y artist embeddings
INFO: Application startup complete
```

Press `Ctrl+C` to stop following logs.

### 2.13 Test Backend

```bash
# Test from VM
curl http://localhost:8000/health

# Test from your local machine
curl http://<YOUR_PUBLIC_IP>:8000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "services": {
    "api": "up",
    "qdrant": "up",
    "embeddings": "loaded"
  },
  "stats": {
    "total_users": 0
  }
}
```

### 2.14 Initialize Qdrant Collection

From the VM, initialize the vector database:

```bash
docker exec -it vibematch-backend python3 << 'EOF'
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
import os

client = QdrantClient(
    url=f"https://{os.environ['QDRANT_HOST']}",
    api_key=os.environ['QDRANT_API_KEY']
)

try:
    client.create_collection(
        collection_name='users',
        vectors_config=VectorParams(size=128, distance=Distance.COSINE)
    )
    print('✅ Collection "users" created successfully!')
except Exception as e:
    print(f'Collection may already exist or error: {e}')
EOF
```

### 2.15 Make Backend Auto-Start on Boot

```bash
# Create systemd service
sudo nano /etc/systemd/system/vibematch.service
```

**Paste this:**

```ini
[Unit]
Description=VibeMatch Backend
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/azureuser/vibematch
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
User=azureuser
Group=docker

[Install]
WantedBy=multi-user.target
```

Save: `Ctrl+X`, `Y`, `Enter`

**Enable and start the service:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable vibematch
sudo systemctl start vibematch
sudo systemctl status vibematch
```

Expected: `Active: active (exited)`

**✅ Backend is now deployed and will auto-start on reboot!**

---

## ⚛️ Step 3: Deploy Frontend (Vercel)

### 3.1 Create Vercel Account

1. Go to **https://vercel.com**
2. **Sign up with GitHub**
3. Authorize Vercel to access your repositories

### 3.2 Import Project

1. Click **"Add New..."** → **"Project"**
2. Import your **VibeMatch** repository
3. Configure build settings:

   **Framework Preset:** Next.js (auto-detected)

   **Root Directory:** `frontend`

   **Build Command:** `npm run build` (default)

   **Output Directory:** `.next` (default)

   **Install Command:** `npm install` (default)

### 3.3 Environment Variables

Click **"Environment Variables"** and add:

```bash
NEXT_PUBLIC_API_URL=http://<YOUR_AZURE_VM_IP>:8000
```

Replace `<YOUR_AZURE_VM_IP>` with your Azure VM's public IP.

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait for build (~2-3 minutes)
3. Your app will be live at:
   ```
   https://<your-project>.vercel.app
   ```

### 3.5 Update Backend CORS

Now that you have your Vercel URL, update the backend:

**SSH to Azure VM:**
```bash
ssh -i vibematch-vm-key.pem azureuser@<YOUR_PUBLIC_IP>
```

**Update .env:**
```bash
cd ~/vibematch
nano .env
```

**Change this line:**
```bash
FRONTEND_URL=https://<your-project>.vercel.app
```

Save and restart:
```bash
docker restart vibematch-backend
docker logs -f vibematch-backend
```

**Update Last.fm Callback URL:**
1. Go to https://www.last.fm/api/accounts
2. Find your API account
3. Update callback URL to:
   ```
   http://<YOUR_AZURE_VM_IP>:8000/auth/lastfm/callback
   ```

---

## 🚀 Step 4: Setup CI/CD with GitHub Actions

Automate deployment: every push to `main` will build and deploy to Azure.

### 4.1 Configure GitHub Secrets

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** for each:

| Secret Name | Value | How to get |
|-------------|-------|------------|
| `AZURE_SSH_KEY` | Private SSH key content | Copy content of `vibematch-vm-key.pem` |
| `AZURE_VM_IP` | Your Azure VM public IP | From Azure Portal |
| `AZURE_VM_USER` | `azureuser` | Default Azure user |
| `GHCR_TOKEN` | GitHub Personal Access Token | Same token from step 2.10 |

**To get AZURE_SSH_KEY:**
```bash
# Windows:
type vibematch-vm-key.pem

# macOS/Linux:
cat vibematch-vm-key.pem
```
Copy the **entire output** including `-----BEGIN...-----` and `-----END...-----`.

### 4.2 Update GitHub Actions Workflow

The workflow file already exists at `.github/workflows/deploy.yml`. Let's update it for Azure:

```bash
# In your local VibeMatch repo
code .github/workflows/deploy.yml
```

**Replace the entire content with:**

```yaml
name: Deploy to Azure VM

on:
  push:
    branches: [main]
  workflow_dispatch:  # Allow manual triggers

jobs:
  build-and-push:
    name: Build and Push Docker Image
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GHCR_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository_owner }}/vibematch-backend
          tags: |
            type=raw,value=latest
            type=sha,prefix={{date 'YYYYMMDD'}}-

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          platforms: linux/amd64  # Azure B-series uses AMD64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-to-azure:
    name: Deploy to Azure VM
    runs-on: ubuntu-latest
    needs: build-and-push

    steps:
      - name: Deploy to Azure VM
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.AZURE_VM_IP }}
          username: ${{ secrets.AZURE_VM_USER }}
          key: ${{ secrets.AZURE_SSH_KEY }}
          script: |
            # Navigate to app directory
            cd ~/vibematch

            # Pull latest image
            docker pull ghcr.io/${{ github.repository_owner }}/vibematch-backend:latest

            # Stop and remove old container
            docker stop vibematch-backend || true
            docker rm vibematch-backend || true

            # Start new container
            docker run -d \
              --name vibematch-backend \
              -p 8000:8000 \
              --env-file .env \
              --restart unless-stopped \
              ghcr.io/${{ github.repository_owner }}/vibematch-backend:latest

            # Clean up old images
            docker image prune -af

            # Show status
            echo "=== Container Status ==="
            docker ps | grep vibematch-backend

            echo "=== Recent Logs ==="
            docker logs --tail 50 vibematch-backend

      - name: Health Check
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.AZURE_VM_IP }}
          username: ${{ secrets.AZURE_VM_USER }}
          key: ${{ secrets.AZURE_SSH_KEY }}
          script: |
            echo "Waiting for application to start..."
            for i in {1..30}; do
              if curl -f http://localhost:8000/health &>/dev/null; then
                echo "✅ Application is healthy!"
                curl http://localhost:8000/health
                exit 0
              fi
              echo "Attempt $i/30: Waiting..."
              sleep 2
            done
            echo "❌ Health check failed"
            docker logs --tail 100 vibematch-backend
            exit 1
```

### 4.3 Commit and Push Workflow

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: configure CI/CD for Azure VM deployment"
git push origin main
```

### 4.4 Watch Deployment

1. Go to GitHub → **Actions** tab
2. Click on the running workflow
3. Watch build and deploy progress
4. Verify all steps pass ✅

**Total deployment time:** ~3-5 minutes

---

## 📊 Monitoring & Cost Management

### Monitor Azure Credit Usage

1. Go to **Azure Portal** → **Cost Management + Billing**
2. Click **"Cost analysis"**
3. View remaining credit balance
4. Set up budget alerts:
   - Click **"Budgets"** → **"Add"**
   - Set budget: $30/month
   - Alert at: 80%, 90%, 100%

**Expected monthly costs:**
- B2s VM: ~$30/month (covered by credits for 3+ months)
- P6 Disk: $0 (free tier)
- Bandwidth: Usually <$1/month

### Free Monitoring Tools

**1. Azure Monitor (built-in)**
```bash
# View metrics in Azure Portal
Portal → Virtual machines → vibematch-vm → Metrics
```
- CPU usage
- Network traffic
- Disk performance

**2. Docker Stats (on VM)**
```bash
ssh -i vibematch-vm-key.pem azureuser@<YOUR_IP>
docker stats vibematch-backend
```

**3. Application Logs**
```bash
# Real-time logs
docker logs -f vibematch-backend

# Last 100 lines
docker logs --tail 100 vibematch-backend
```

**4. Qdrant Cloud Dashboard**
- Storage usage
- Query performance
- Collection statistics

---

## 🔐 Security Best Practices

### 1. Firewall Configuration

Azure NSG already configured, but verify:

```bash
# On VM, check UFW (optional additional firewall)
sudo ufw status

# If inactive, enable it:
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8000/tcp
sudo ufw enable
```

### 2. Keep System Updated

```bash
# Run monthly
sudo apt update && sudo apt upgrade -y
sudo reboot  # If kernel updated
```

### 3. Docker Security

```bash
# Scan images for vulnerabilities
docker scan ghcr.io/<YOUR_USERNAME>/vibematch-backend:latest

# Update base images regularly
```

### 4. Rotate Secrets

Quarterly rotation:
- Last.fm API keys
- Qdrant API keys
- JWT SECRET_KEY
- GitHub tokens

### 5. Backup Important Data

```bash
# Backup .env file
scp -i vibematch-vm-key.pem azureuser@<YOUR_IP>:~/vibematch/.env ./env-backup-$(date +%Y%m%d)

# Backup Qdrant (auto-backed up by Qdrant Cloud)
```

---

## 📈 Scaling & Cost Optimization

### For DigitalOcean Users

**When $200 Credits Run Out (After 16+ months with App Platform):**

**Option 1: Continue Paying** (Recommended)
- $12/month for App Platform is very affordable
- By this time, you'll likely have graduated or have income
- Worth it if app has active users

**Option 2: Downgrade to Cheaper Plan**
- Switch to $5/month plan (512MB RAM)
- Good for low traffic apps

**Option 3: Switch to Droplets**
- More control, same features
- Start at $6/month (1GB RAM droplet)
- Manual management required

**Option 4: Switch Platforms**
- Migrate to Railway ($5/mo with GitHub Education)
- Try Fly.io free tier
- Azure for Students if you renew ($100 more)

**Optimize App Platform Costs:**
- Scale down during low traffic periods
- Use autoscaling to match actual usage
- Monitor bandwidth usage

### For Azure Users

**When $100 Credits Run Out (After 3-4 months):**

**Option 1: Renew Azure for Students** (Recommended)
- If still a student, renew for another $100
- Go to https://azure.microsoft.com/free/students
- Sign in and renew
- Get another 3-4 months free

**Option 2: Downgrade to B1s (Free Tier)**
```
B1s: 1 vCPU, 1 GB RAM
Cost: FREE for 750 hours/month (12 months)
```
⚠️ May need to optimize backend for lower RAM

**Option 3: Switch to DigitalOcean**
- More cost-effective at $12-24/month
- Easier to manage
- Better value for students

**Option 4: Pay as Student ($30/month)**
- Keep B2s if you have income
- ~$30/month for 24/7 uptime
- Worth it if app gains users

**Optimize Azure Costs:**

Stop VM when not needed:
```bash
# From Azure Portal or CLI
az vm deallocate --resource-group vibematch-rg --name vibematch-vm

# Start when needed
az vm start --resource-group vibematch-rg --name vibematch-vm
```
⚠️ Only do this if app has no users

Auto-shutdown schedule:
1. Azure Portal → Virtual machines → vibematch-vm
2. Operations → Auto-shutdown
3. Set schedule (e.g., 2 AM - 8 AM daily)

---

## 🆘 Troubleshooting

### DigitalOcean App Platform Issues

**App won't deploy:**
```bash
# Check build logs in DigitalOcean dashboard
# Common issues:
# - Missing runtime.txt
# - Wrong Python version in runtime.txt
# - Missing requirements.txt
# - Port mismatch (must use 8080, not 8000)
```

**Environment variables not working:**
1. Go to App → Settings → Component
2. Verify all variables are set correctly
3. Check encrypted variables are properly saved
4. Redeploy app after changing variables

**Health check fails:**
- Ensure your app exposes port 8080
- Check runtime logs for startup errors
- Verify Qdrant connection credentials
- Check if embeddings file exists in Docker image

**App is slow or crashes:**
- Upgrade from Basic ($12) to Professional ($24)
- Check memory usage in metrics
- Optimize embedding loading
- Consider switching to Droplets for more RAM

### DigitalOcean Droplets Issues

**Can't SSH to Droplet:**
```bash
# Verify SSH key permissions
chmod 600 ~/.ssh/id_rsa  # Mac/Linux

# Check firewall allows port 22
# DigitalOcean → Networking → Firewalls

# Try recovery console
# DigitalOcean → Droplet → Access → Recovery
```

**Docker container issues:**
```bash
# Check logs
docker logs vibematch-backend

# Restart container
docker restart vibematch-backend

# Rebuild if needed
docker stop vibematch-backend
docker rm vibematch-backend
cd ~/VibeMatch/backend
docker build -t vibematch-backend .
docker run -d --name vibematch-backend -p 8000:8000 --env-file ~/vibematch/.env vibematch-backend
```

**Out of disk space:**
```bash
df -h
docker system prune -a -f
apt autoremove -y
```

### Azure VM Issues

**VM won't start
```bash
# Check VM status
az vm get-instance-view --resource-group vibematch-rg --name vibematch-vm

# Start VM
az vm start --resource-group vibematch-rg --name vibematch-vm
```

### Can't SSH to VM
```bash
# Verify NSG rules allow port 22
# Azure Portal → Network settings → Inbound port rules

# Reset SSH key (if lost)
# Azure Portal → Reset password → Reset SSH public key
```

### Backend container won't start
```bash
# SSH to VM
ssh -i vibematch-vm-key.pem azureuser@<YOUR_IP>

# Check container status
docker ps -a

# View logs
docker logs vibematch-backend

# Common issues:
# - Missing .env file
# - Wrong QDRANT_HOST
# - Port 8000 already in use

# Restart container
docker restart vibematch-backend
```

### Out of disk space
```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a -f

# Remove old logs
sudo journalctl --vacuum-time=7d
```

### High memory usage
```bash
# Check memory
free -h

# If near limit, restart container
docker restart vibematch-backend

# Or upgrade to B2ms (8 GB RAM)
```

### GitHub Actions deployment fails
```bash
# Check secrets are set correctly
# GitHub → Settings → Secrets

# Test SSH manually
ssh -i vibematch-vm-key.pem azureuser@<YOUR_IP>

# Check GHCR token permissions
# GitHub → Settings → Developer settings → Tokens
```

---

## 📞 Getting Help

### DigitalOcean Support

**Official Support:**
- Community Q&A: https://www.digitalocean.com/community/questions
- Documentation: https://docs.digitalocean.com
- Tutorials: https://www.digitalocean.com/community/tutorials
- Support tickets (paid plans): https://cloud.digitalocean.com/support

**Community:**
- DigitalOcean Community: https://www.digitalocean.com/community
- Stack Overflow: Tag `digitalocean` + `digitalocean-app-platform`
- Reddit: r/digital_ocean

### Azure Support

**Official Support (Students):**
- Free technical support included with student account
- https://portal.azure.com → Support
- Learning resources: https://learn.microsoft.com/azure

**Community:**
- Azure Community: https://techcommunity.microsoft.com/azure
- Stack Overflow: Tag `azure` + `azure-virtual-machine`
- Reddit: r/AZURE

### VibeMatch Issues

- GitHub: https://github.com/YOUR_USERNAME/VibeMatch/issues
- Discussions: Use GitHub Discussions for questions
- Contributing: See CONTRIBUTING.md (if available)

---

## ✅ Deployment Checklist

### General (All Platforms)

- [ ] GitHub Education account verified
- [ ] Last.fm API credentials obtained
- [ ] Qdrant Cloud cluster created and initialized
- [ ] GNN model trained and embeddings generated
- [ ] Backend tested locally with Docker
- [ ] Frontend tested locally
- [ ] All environment variables documented

### Platform-Specific

**For DigitalOcean App Platform:**
- [ ] DigitalOcean account created with $200 credit
- [ ] Backend configured with Procfile and runtime.txt
- [ ] App created and connected to GitHub
- [ ] Environment variables set in App Platform
- [ ] Auto-deploy enabled
- [ ] Health check endpoint passing
- [ ] Frontend deployed to Vercel
- [ ] CORS configured for Vercel domain
- [ ] Last.fm callback URL updated
- [ ] Full authentication flow tested
- [ ] Budget alerts configured in DigitalOcean

**For DigitalOcean Droplets:**
- [ ] DigitalOcean account created with $200 credit
- [ ] Droplet created with Docker
- [ ] SSH key configured and secured
- [ ] Firewall rules configured
- [ ] .env file created on droplet
- [ ] Docker container running
- [ ] Health check endpoint passing
- [ ] Frontend deployed to Vercel
- [ ] CORS configured for Vercel domain
- [ ] Last.fm callback URL updated
- [ ] Full authentication flow tested
- [ ] Backup of .env file created

**For Azure VM:**
- [ ] Azure for Students account activated
- [ ] B2s VM created with P6 disk
- [ ] SSH key downloaded and secured
- [ ] Docker and Docker Compose installed
- [ ] .env file configured on VM
- [ ] Docker container running
- [ ] GitHub Actions secrets configured
- [ ] CI/CD pipeline tested
- [ ] Frontend deployed to Vercel
- [ ] CORS configured for Vercel domain
- [ ] Last.fm callback URL updated
- [ ] Full authentication flow tested
- [ ] Budget alerts configured in Azure
- [ ] Backup of SSH key and .env file created

---

**Happy Deploying! 🚀**

---

## 💰 Cost Summary

### DigitalOcean

**With $200 Student Credits:**
- **App Platform:** 16+ months FREE ($12/month)
- **Droplets:** 8+ months FREE ($24/month)
- **After credits:** $12-24/month depending on choice

**Total first year cost:** $0

### Azure

**With $100 Student Credits:**
- **VM (B2s):** 3-4 months FREE ($30/month)
- **Renewable yearly** if still student
- **After credits:** $30/month or switch to free tier

**Total first year cost:** $0-180 (depending on renewal)

### Recommended Path

1. **Start:** DigitalOcean App Platform (easiest, 16+ months free)
2. **If need more RAM:** Upgrade to DigitalOcean Droplets (4GB)
3. **Year 2:** Continue paying ($12/mo) or switch to Azure renewal
4. **Long term:** $12-30/month depending on platform and traffic

---

## 📚 Additional Documentation

- [DIGITALOCEAN_QUICKSTART.md](DIGITALOCEAN_QUICKSTART.md) - Quick DigitalOcean deployment
- [AZURE_QUICKSTART.md](AZURE_QUICKSTART.md) - Quick Azure deployment
- [README.md](README.md) - Project overview and local development
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute (if available)

---

## 📖 Sources & References

### DigitalOcean

- [DigitalOcean GitHub Students](https://www.digitalocean.com/github-students)
- [App Platform Documentation](https://docs.digitalocean.com/products/app-platform/)
- [Python Buildpack Reference](https://docs.digitalocean.com/products/app-platform/reference/buildpacks/python/)
- [DigitalOcean Pricing](https://www.digitalocean.com/pricing)
- [Environment Variables Guide](https://docs.digitalocean.com/products/app-platform/how-to/use-environment-variables/)

### Azure

- [Azure for Students](https://azure.microsoft.com/en-us/free/students)
- [Azure VM B-series Pricing](https://azure.microsoft.com/en-us/pricing/details/virtual-machines/windows/)
- [GitHub Actions for Azure](https://azure.github.io/actions/)
- [Azure Free Services](https://azure.microsoft.com/en-us/pricing/free-services)

### General

- [GitHub Student Developer Pack](https://education.github.com/pack)
- [Qdrant Cloud](https://cloud.qdrant.io)
- [Vercel Documentation](https://vercel.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Last.fm API](https://www.last.fm/api)

---

*Last updated: December 2025*
