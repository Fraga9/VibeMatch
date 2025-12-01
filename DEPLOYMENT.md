# 🚀 VibeMatch Deployment Guide

This guide covers deploying VibeMatch to production environments.

---

## 📋 Pre-Deployment Checklist

- [ ] Train GNN model and generate embeddings
- [ ] Obtain Last.fm API credentials
- [ ] Set up production database (Qdrant)
- [ ] Configure environment variables
- [ ] Set up monitoring and logging
- [ ] Configure CORS for production domain
- [ ] Enable rate limiting
- [ ] Set up SSL/TLS certificates

---

## ☁️ Deployment Options

### 1. Railway (Recommended for Quick Deploy)

**Advantages**: Easy setup, managed databases, auto-scaling

**Steps**:

1. **Create Railway account** at https://railway.app

2. **Create new project** and add services:
   ```
   - Qdrant (Docker template)
   - Redis (Template)
   - Backend (Python)
   - Frontend (Next.js)
   ```

3. **Configure backend**:
   - Repository: `your-repo/backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Add environment variables from `.env.example`

4. **Configure frontend**:
   - Repository: `your-repo/frontend`
   - Build command: `npm run build`
   - Start command: `npm start`
   - Set `NEXT_PUBLIC_API_URL` to your backend URL

5. **Deploy!**

---

### 2. Fly.io (Best for Global Distribution)

**Advantages**: Edge deployment, great for low latency worldwide

**Backend**:

```bash
cd backend

# Create fly.toml
cat > fly.toml <<EOF
app = "vibematch-api"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "8000"

[[services]]
  internal_port = 8000
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
EOF

# Set secrets
fly secrets set LASTFM_API_KEY=xxx LASTFM_API_SECRET=xxx SECRET_KEY=xxx

# Deploy
fly deploy
```

**Frontend**:

```bash
cd frontend

# Create fly.toml
fly launch

# Deploy
fly deploy
```

**Qdrant**: Use Qdrant Cloud (https://cloud.qdrant.io) or deploy as Fly app

---

### 3. AWS (Enterprise Grade)

**Services**:
- **ECS/Fargate**: Container orchestration
- **RDS**: PostgreSQL for user data
- **ElastiCache**: Redis
- **S3**: Static assets
- **CloudFront**: CDN for frontend
- **ALB**: Load balancer

**Steps**:

1. **Create ECR repositories** for backend and frontend
2. **Build and push Docker images**:
   ```bash
   docker build -t vibematch-backend ./backend
   docker tag vibematch-backend:latest 123456.dkr.ecr.us-east-1.amazonaws.com/vibematch-backend
   docker push 123456.dkr.ecr.us-east-1.amazonaws.com/vibematch-backend
   ```

3. **Create ECS cluster and services**
4. **Set up Qdrant** on EC2 or use Qdrant Cloud
5. **Configure ALB** with health checks
6. **Set up CloudFront** for frontend

---

### 4. Google Cloud Platform

**Services**:
- **Cloud Run**: Serverless containers
- **Cloud SQL**: PostgreSQL
- **Memorystore**: Redis
- **Cloud Storage**: Assets

**Steps**:

```bash
# Backend
gcloud run deploy vibematch-api \
  --source ./backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Frontend
cd frontend && npm run build
gcloud app deploy
```

---

## 🔐 Production Security

### Environment Variables

**Never commit**:
- API keys
- Secret keys
- Database credentials

Use secret management:
- Railway/Fly: Built-in secrets
- AWS: AWS Secrets Manager
- GCP: Secret Manager
- Docker: Docker secrets

### CORS Configuration

Update `backend/app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://vibematch.app"],  # Your production domain
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

### Rate Limiting

Add to `backend/requirements.txt`:
```
slowapi==0.1.9
```

Add to `backend/app/main.py`:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/match/top")
@limiter.limit("10/minute")
async def get_top_matches(...):
    ...
```

---

## 📊 Monitoring

### Backend Logging

Add structured logging:

```python
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format='{"time": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s"}',
    handlers=[logging.StreamHandler(sys.stdout)]
)
```

### Error Tracking

**Sentry** (recommended):

```bash
pip install sentry-sdk[fastapi]
```

```python
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    traces_sample_rate=0.1,
)
```

### Metrics

Use **Prometheus** + **Grafana**:

```bash
pip install prometheus-fastapi-instrumentator
```

```python
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app)
```

---

## 🗄️ Database Backups

### Qdrant Backups

```bash
# Create snapshot
curl -X POST 'http://localhost:6333/collections/users/snapshots'

# Download snapshot
curl 'http://localhost:6333/collections/users/snapshots/snapshot-2025-01-15.snapshot' \
  --output backup.snapshot
```

Automate with cron or cloud backup service.

---

## 📈 Scaling

### Horizontal Scaling

**Backend**: Add more FastAPI instances behind load balancer

**Qdrant**:
- Vertical: Increase CPU/RAM
- Horizontal: Use Qdrant distributed mode (Enterprise)

**Redis**: Use Redis Cluster for high availability

### Optimization Tips

1. **Enable caching**:
   ```python
   from functools import lru_cache

   @lru_cache(maxsize=1000)
   def get_user_embedding(username: str):
       ...
   ```

2. **Batch operations**: Process multiple users at once

3. **Connection pooling**: Reuse DB connections

4. **CDN**: Serve frontend assets via CloudFront/Cloudflare

---

## 🧪 Production Testing

Before going live:

```bash
# Load testing with Locust
pip install locust

# Create locustfile.py
cat > locustfile.py <<EOF
from locust import HttpUser, task

class VibeMatchUser(HttpUser):
    @task
    def get_matches(self):
        self.client.get("/match/top?limit=20", headers={"Authorization": "Bearer token"})
EOF

# Run load test
locust -f locustfile.py --host=http://localhost:8000
```

---

## 🔄 CI/CD Pipeline

**GitHub Actions** example:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          npm install -g @railway/cli
          railway up -d

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          npm install -g vercel
          cd frontend && vercel --prod
```

---

## 🆘 Troubleshooting

### Common Issues

**1. CORS errors**
- Check `allow_origins` in backend CORS config
- Verify frontend is using correct API URL

**2. Qdrant connection failed**
- Ensure Qdrant is running and accessible
- Check firewall rules
- Verify `QDRANT_HOST` and `QDRANT_PORT`

**3. Last.fm OAuth fails**
- Verify callback URL matches exactly
- Check API key is valid
- Ensure HTTPS in production

**4. Slow matches**
- Check Qdrant index is built
- Increase Qdrant resources
- Add caching layer

---

## 📞 Support

For deployment help:
- GitHub Issues: https://github.com/yourusername/vibematch/issues
- Discord: https://discord.gg/vibematch
- Email: support@vibematch.app

---

**Happy Deploying! 🚀**
