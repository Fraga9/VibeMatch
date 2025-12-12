# 🚀 DigitalOcean Deployment Quick Start Guide

**For students who want to deploy VibeMatch to DigitalOcean FAST.**

Estimated time: **25-35 minutes**

---

## Why DigitalOcean for Students?

- ✅ **$200 FREE credits** - Valid for 1 year with GitHub Education
- ✅ **Easier than Azure** - Simpler UI, better documentation
- ✅ **Two deployment options** - App Platform (PaaS) or Droplets (VMs)
- ✅ **Longer lasting credits** - $200 vs Azure's $100
- ✅ **No credit card charges** - Only verification, not charged unless you exceed credits

---

## Prerequisites

- [ ] Active GitHub Education account ([apply here](https://education.github.com/pack))
- [ ] Credit/debit card for account verification (won't be charged)
- [ ] Last.fm API credentials ([get them here](https://www.last.fm/api/account/create))
- [ ] Basic terminal/command line knowledge

---

## 📊 Deployment Options Comparison

| Feature | App Platform (PaaS) ⭐ | Droplets (VMs) |
|---------|----------------------|----------------|
| **Difficulty** | Easy (like Heroku/Vercel) | Medium (like Azure) |
| **Setup Time** | 10-15 minutes | 30-40 minutes |
| **Management** | Fully managed, auto-scaling | Manual SSH, Docker setup |
| **Cost** | $12/mo (16+ months free) | $24/mo (8+ months free) |
| **RAM** | 1GB (Basic tier) | 4GB (Basic Droplet) |
| **Best For** | Beginners, quick deploy | Advanced users, more control |

**Recommendation**: Use **App Platform** if you want simplicity. Use **Droplets** if you need more RAM/control.

---

## 🎓 Step 1: Activate GitHub Education Credits (5 minutes)

### 1.1 Get GitHub Student Developer Pack

1. Go to https://education.github.com/pack
2. Click **"Get student benefits"**
3. Verify with your .edu email or student ID
4. Wait for approval (~5 minutes to 2 days)

### 1.2 Claim DigitalOcean $200 Credit

1. Once approved, go to https://www.digitalocean.com/github-students
2. Click **"Get started with DigitalOcean"**
3. Sign up with:
   - Email (use your .edu email)
   - Strong password
   - Accept terms
4. **Add payment method** (for verification only):
   - Credit/debit card OR PayPal
   - You won't be charged unless you exceed $200
5. ✅ **$200 credit auto-applied** for 1 year!

---

## 🗄️ Step 2: Setup Qdrant Database (5 minutes)

1. Go to https://cloud.qdrant.io
2. Sign up with GitHub
3. Click **"Create Cluster"**
4. Select **"Free Tier"** → Choose region close to your location
5. Name: `vibematch-prod`
6. Click **"Create"**
7. **Save these:**
   - Cluster URL: `https://xxx-yyy.cloud.qdrant.io`
   - API Key: `qdrant_xxxxx`

---

## Option A: Deploy with App Platform (RECOMMENDED) ⭐

### When to use this:
- You want the easiest deployment
- You don't need more than 1GB RAM
- You want automatic HTTPS and scaling
- You prefer managed infrastructure

---

## Step 3A: Prepare Backend for App Platform (5 minutes)

### 3A.1 Create `runtime.txt`

In your `backend/` directory, create a file named `runtime.txt`:

```bash
cd backend
echo "python-3.11.0" > runtime.txt
```

### 3A.2 Update `requirements.txt`

Make sure your `backend/requirements.txt` includes gunicorn:

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
gunicorn==21.2.0
qdrant-client==1.7.0
pylast==5.2.0
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0
pydantic==2.5.0
pydantic-settings==2.1.0
httpx==0.25.2
numpy==1.24.3
scikit-learn==1.3.2
```

### 3A.3 Create or Update `Procfile`

Create `backend/Procfile`:

```
web: gunicorn -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8080 app.main:app
```

**Important:** App Platform expects port `8080`, not `8000`.

### 3A.4 Commit and Push Changes

```bash
git add backend/runtime.txt backend/Procfile backend/requirements.txt
git commit -m "feat: configure backend for DigitalOcean App Platform"
git push origin main
```

---

## Step 4A: Deploy Backend to App Platform (10 minutes)

### 4A.1 Create App

1. Login to https://cloud.digitalocean.com
2. Click **"Apps"** → **"Create App"**
3. Choose **GitHub** as source
4. Authorize DigitalOcean to access your repositories
5. Select your **VibeMatch** repository
6. **Branch:** `main`
7. **Autodeploy:** ✅ Enable (deploys on every push)
8. Click **"Next"**

### 4A.2 Configure Resources

**Auto-detected Settings:**
- **Type:** Web Service
- **Source Directory:** `/backend`
- **Detected via:** Dockerfile or requirements.txt

Click **"Edit Plan"**:
- **Resource Type:** Basic
- **Instance Size:** Basic ($12/mo)
  - 1 GB RAM
  - 1 vCPU
  - 100 GB bandwidth
- **Instance Count:** 1

Click **"Back"** → **"Next"**

### 4A.3 Environment Variables

Click **"Edit"** next to your web service, then scroll to **"Environment Variables"**.

Add these variables (click **"Encrypt"** checkbox for sensitive ones):

```bash
# Qdrant Configuration
QDRANT_HOST=xxx-yyy.cloud.qdrant.io
QDRANT_PORT=443
QDRANT_API_KEY=qdrant_xxxxx  # ENCRYPT THIS
QDRANT_USE_HTTPS=true
QDRANT_COLLECTION_USERS=users
QDRANT_VECTOR_SIZE=128

# Last.fm API
LASTFM_API_KEY=your_lastfm_api_key  # ENCRYPT THIS
LASTFM_API_SECRET=your_lastfm_api_secret  # ENCRYPT THIS
LASTFM_CALLBACK_URL=${APP_URL}/auth/lastfm/callback

# Security
SECRET_KEY=your_generated_secret_key_32_chars  # ENCRYPT THIS
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# CORS (will update later with Vercel URL)
FRONTEND_URL=http://localhost:3000

# Server
PORT=8080
ENVIRONMENT=production

# Admin
ADMIN_API_KEY=your_admin_key  # ENCRYPT THIS
```

**Generate SECRET_KEY locally:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Click **"Save"** → **"Next"**

### 4A.4 Review and Deploy

1. **App name:** `vibematch-backend`
2. **Region:** Choose closest to you (e.g., New York, San Francisco, London)
3. **Review costs:** Should show **$12/month** (covered by your $200 credit)
4. Click **"Create Resources"**

**Wait 5-10 minutes** for:
- Building Docker image
- Deploying container
- Health checks

### 4A.5 Get Backend URL

Once deployed:
1. Click on your app **"vibematch-backend"**
2. Copy the **App URL**: `https://vibematch-backend-xxxxx.ondigitalocean.app`
3. Save this - you'll need it for frontend!

### 4A.6 Test Backend

```bash
curl https://vibematch-backend-xxxxx.ondigitalocean.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "api": "up",
    "qdrant": "up",
    "embeddings": "loaded"
  }
}
```

### 4A.7 Initialize Qdrant Collection

Go to **Console** tab in your app, or use:

```bash
curl -X POST https://vibematch-backend-xxxxx.ondigitalocean.app/admin/init-qdrant \
  -H "X-Admin-Key: your_admin_key"
```

Or SSH into the app console and run:
```python
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
    print('✅ Collection created!')
except Exception as e:
    print(f'Note: {e}')
```

---

## Option B: Deploy with Droplets (Advanced)

### When to use this:
- You need more than 1GB RAM
- You want full control over the server
- You're comfortable with SSH and Docker
- You want the VM approach (like Azure)

---

## Step 3B: Create Droplet (10 minutes)

### 3B.1 Create Droplet

1. Login to https://cloud.digitalocean.com
2. Click **"Create"** → **"Droplets"**
3. **Choose an image:**
   - Marketplace → Search **"Docker"**
   - Select **"Docker on Ubuntu 22.04"** (1-Click Install)
4. **Choose a plan:**
   - **Basic** plan
   - **Regular** CPU
   - **$24/month**: 4 GB RAM, 2 vCPUs, 80 GB SSD
5. **Choose a datacenter region:**
   - Select closest to you (New York, San Francisco, etc.)
6. **Authentication:**
   - Select **SSH Key** (recommended)
   - Click **"New SSH Key"**
   - **For Windows:**
     ```powershell
     ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
     # Save to: C:\Users\YourName\.ssh\id_rsa
     # Press Enter for no passphrase
     type C:\Users\YourName\.ssh\id_rsa.pub
     ```
   - **For Mac/Linux:**
     ```bash
     ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
     # Save to: ~/.ssh/id_rsa
     # Press Enter for no passphrase
     cat ~/.ssh/id_rsa.pub
     ```
   - Copy the output and paste into DigitalOcean
   - Name: `my-ssh-key`
   - Click **"Add SSH Key"**
7. **Finalize Details:**
   - Hostname: `vibematch-vm`
   - Tags: `vibematch`, `backend`
8. Click **"Create Droplet"**

Wait ~1 minute for creation.

### 3B.2 Get Droplet IP Address

1. Click on **"vibematch-vm"** droplet
2. Copy the **Public IPv4 address** (e.g., `164.90.123.45`)
3. Save this IP - you'll need it!

### 3B.3 Configure Firewall

1. Click **"Networking"** → **"Firewalls"**
2. Click **"Create Firewall"**
3. **Name:** `vibematch-firewall`
4. **Inbound Rules:**
   - SSH: TCP, Port 22, All IPv4, All IPv6
   - HTTP: TCP, Port 80, All IPv4, All IPv6
   - HTTPS: TCP, Port 443, All IPv4, All IPv6
   - Custom: TCP, Port 8000, All IPv4, All IPv6
5. **Outbound Rules:** All (default)
6. **Apply to Droplets:** Select `vibematch-vm`
7. Click **"Create Firewall"**

---

## Step 4B: Setup Droplet (15 minutes)

### 4B.1 Connect via SSH

**Windows (PowerShell):**
```powershell
ssh root@YOUR_DROPLET_IP
```

**Mac/Linux:**
```bash
ssh root@YOUR_DROPLET_IP
```

Type `yes` when asked about fingerprint.

### 4B.2 Update System and Verify Docker

```bash
# Update system
apt update && apt upgrade -y

# Verify Docker is installed
docker --version
docker compose version

# Add Docker to startup
systemctl enable docker
systemctl start docker
```

Expected output:
```
Docker version 24.x.x
Docker Compose version v2.x.x
```

### 4B.3 Setup Application Directory

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
QDRANT_HOST=xxx-yyy.cloud.qdrant.io
QDRANT_PORT=443
QDRANT_API_KEY=qdrant_xxxxx
QDRANT_USE_HTTPS=true
QDRANT_COLLECTION_USERS=users
QDRANT_VECTOR_SIZE=128

# Last.fm API
LASTFM_API_KEY=your_lastfm_api_key
LASTFM_API_SECRET=your_lastfm_api_secret
LASTFM_CALLBACK_URL=http://YOUR_DROPLET_IP:8000/auth/lastfm/callback

# Security
SECRET_KEY=your_generated_secret_key_32_chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# CORS (update after Vercel deployment)
FRONTEND_URL=http://localhost:3000

# Server
PORT=8000
ENVIRONMENT=production

# Admin
ADMIN_API_KEY=your_admin_api_key
```

Save: `Ctrl+X`, `Y`, `Enter`

### 4B.4 Clone Repository and Build

```bash
# Clone your repo
cd ~
git clone https://github.com/YOUR_USERNAME/VibeMatch.git
cd VibeMatch/backend

# Build Docker image
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

Wait for: `✅ Loaded X track embeddings` and `Application startup complete`

Press `Ctrl+C` to exit logs.

### 4B.5 Test Backend

```bash
# Test from Droplet
curl http://localhost:8000/health

# Test from your computer
curl http://YOUR_DROPLET_IP:8000/health
```

Expected: `{"status": "healthy", ...}`

### 4B.6 Initialize Qdrant

```bash
docker exec -it vibematch-backend python3 -c "
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
import os

client = QdrantClient(
    url=f\"https://{os.environ['QDRANT_HOST']}\",
    api_key=os.environ['QDRANT_API_KEY']
)

try:
    client.create_collection(
        collection_name='users',
        vectors_config=VectorParams(size=128, distance=Distance.COSINE)
    )
    print('✅ Collection created!')
except Exception as e:
    print(f'Note: {e}')
"
```

---

## Step 5: Deploy Frontend to Vercel (5 minutes)

### 5.1 Create Vercel Account

1. Go to https://vercel.com
2. **Sign up with GitHub**
3. Authorize Vercel

### 5.2 Import Project

1. Click **"Add New..."** → **"Project"**
2. Import **VibeMatch** repository
3. Configure:
   - **Framework:** Next.js (auto-detected)
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)

### 5.3 Environment Variables

Add this variable:

**For App Platform users:**
```bash
NEXT_PUBLIC_API_URL=https://vibematch-backend-xxxxx.ondigitalocean.app
```

**For Droplet users:**
```bash
NEXT_PUBLIC_API_URL=http://YOUR_DROPLET_IP:8000
```

### 5.4 Deploy

1. Click **"Deploy"**
2. Wait ~2-3 minutes
3. Copy your Vercel URL: `https://vibematch-xyz.vercel.app`

---

## Step 6: Update CORS (2 minutes)

### For App Platform:

1. Go to your app in DigitalOcean dashboard
2. Click **"Settings"** → **"vibematch-backend"** component
3. Edit environment variables
4. Change `FRONTEND_URL` to: `https://vibematch-xyz.vercel.app`
5. Click **"Save"**
6. App will auto-redeploy (~2 minutes)

### For Droplets:

```bash
ssh root@YOUR_DROPLET_IP
cd ~/vibematch
nano .env
```

Change:
```bash
FRONTEND_URL=https://vibematch-xyz.vercel.app
```

Save and restart:
```bash
docker restart vibematch-backend
docker logs -f vibematch-backend
```

### Update Last.fm Callback

1. Go to https://www.last.fm/api/accounts
2. Update callback URL:
   - **App Platform:** `https://vibematch-backend-xxxxx.ondigitalocean.app/auth/lastfm/callback`
   - **Droplets:** `http://YOUR_DROPLET_IP:8000/auth/lastfm/callback`

---

## ✅ Done! Test Your App

1. Visit your Vercel URL
2. Click "Login with Last.fm"
3. Authorize
4. Your profile should load!

---

## 🔄 Setup CI/CD (Optional - 10 minutes)

### For App Platform:

✅ **Already done!** Auto-deploys on every push to `main`.

To disable/enable:
1. Go to your app → **Settings**
2. **Source** → Toggle **"Autodeploy"**

### For Droplets:

Create `.github/workflows/deploy-digitalocean.yml`:

```yaml
name: Deploy to DigitalOcean Droplet

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Droplet
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.DO_DROPLET_IP }}
          username: root
          key: ${{ secrets.DO_SSH_KEY }}
          script: |
            cd ~/VibeMatch
            git pull origin main
            cd backend
            docker build -t vibematch-backend .
            docker stop vibematch-backend || true
            docker rm vibematch-backend || true
            cd ~/vibematch
            docker run -d \
              --name vibematch-backend \
              -p 8000:8000 \
              --env-file .env \
              --restart unless-stopped \
              vibematch-backend
            docker image prune -af
            echo "=== Deployment Complete ==="
            docker logs --tail 50 vibematch-backend
```

**Add GitHub Secrets:**
1. GitHub repo → **Settings** → **Secrets** → **Actions**
2. Add:
   - `DO_DROPLET_IP`: Your Droplet IP
   - `DO_SSH_KEY`: Content of your private SSH key

---

## 📊 Monitor Costs

### Check Credit Balance

1. DigitalOcean Dashboard → **Billing**
2. View **Account Balance**: Shows remaining credit
3. **Current Usage**: Monthly spend

**Expected costs with $200 credit:**
- **App Platform**: $12/mo = 16+ months FREE
- **Droplet**: $24/mo = 8+ months FREE

### Set Budget Alerts

1. **Billing** → **Settings**
2. **Billing Alerts**
3. Set alerts at: $50, $100, $150, $180

---

## 🆘 Troubleshooting

### App Platform Issues

**Build fails:**
1. Check **Runtime & Build** logs
2. Verify `runtime.txt` has correct Python version
3. Ensure `requirements.txt` is valid
4. Check `Procfile` port is `8080`

**Health check fails:**
```bash
# Check logs in DigitalOcean dashboard
# Apps → vibematch-backend → Runtime Logs

# Common issues:
# - Wrong QDRANT_HOST
# - Missing environment variables
# - Port mismatch (use 8080)
```

**Can't access backend:**
- Verify App URL is correct
- Check if app is deployed (green status)
- Review environment variables

### Droplet Issues

**Can't SSH:**
```bash
# Check SSH key permissions
chmod 600 ~/.ssh/id_rsa  # Mac/Linux
# Windows: Use icacls as shown in Step 3B.1

# Try password login instead
ssh root@YOUR_IP
# Then add SSH key manually
```

**Docker container won't start:**
```bash
# Check logs
docker logs vibematch-backend

# Common issues:
# - Missing .env file
# - Wrong environment variables
# - Port already in use
```

**Out of disk space:**
```bash
df -h
docker system prune -a -f
```

---

## 💰 Cost Optimization

### When Credits Run Low

**Option 1: Downgrade App Platform**
- Switch from $12/mo to $5/mo (512MB RAM)
- Good for low traffic

**Option 2: Use Free Tier Options**
- Frontend: Vercel (FREE forever)
- Database: Qdrant Cloud Free Tier (1GB)
- Backend: Look into Railway ($5/mo with GitHub Education)

**Option 3: Pause Resources**
- Destroy Droplet when not in use
- Recreate using snapshot when needed
- Only pay for storage (~$1/mo)

---

## 📚 Additional Resources

- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [DigitalOcean Droplets Docs](https://docs.digitalocean.com/products/droplets/)
- [GitHub Student Pack](https://education.github.com/pack)
- [FastAPI Deployment Best Practices](https://fastapi.tiangolo.com/deployment/)

---

## ✅ Deployment Checklist

Before going live:

- [ ] GitHub Education account verified
- [ ] DigitalOcean account created with $200 credit
- [ ] Qdrant Cloud cluster created
- [ ] Backend deployed (App Platform or Droplet)
- [ ] Backend health check passes
- [ ] Qdrant collection initialized
- [ ] Frontend deployed to Vercel
- [ ] CORS configured for Vercel domain
- [ ] Last.fm callback URL updated
- [ ] Full authentication flow tested
- [ ] Budget alerts configured
- [ ] Backup of .env and SSH keys created

---

## 🎉 Success!

You now have:
- ✅ Backend on DigitalOcean ($0 for 8-16+ months)
- ✅ Frontend on Vercel (free forever)
- ✅ Database on Qdrant Cloud (free tier)
- ✅ Auto-deploy with Git push

**Total cost: $0** (with student credits)

Questions? Open an issue on GitHub!

---

## Sources

- [DigitalOcean GitHub Students](https://www.digitalocean.com/github-students)
- [Python Buildpack on App Platform](https://docs.digitalocean.com/products/app-platform/reference/buildpacks/python/)
- [How to Use Environment Variables in App Platform](https://docs.digitalocean.com/products/app-platform/how-to/use-environment-variables/)
- [DigitalOcean App Platform Pricing](https://www.digitalocean.com/pricing/app-platform)
- [Deploy FastAPI to Digital Ocean](https://dev.to/ndrohith/deploy-a-containerised-fast-api-application-in-digital-ocean-25ik)

*Last updated: December 2025*
