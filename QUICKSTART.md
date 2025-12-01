# ⚡ VibeMatch Quick Start

Get VibeMatch running in **5 minutes** with this streamlined guide.

---

## 🎯 TL;DR

```bash
# 1. Clone and setup
git clone https://github.com/yourusername/vibematch.git
cd vibematch
cp .env.example .env

# 2. Edit .env with your Last.fm API keys
# Get them from: https://www.last.fm/api/account/create

# 3. Start everything
docker-compose up --build

# 4. Open http://localhost:3000
```

That's it! 🎉

---

## 📝 Detailed Steps

### Step 1: Get Last.fm API Credentials

1. Go to https://www.last.fm/api/account/create
2. Fill in the form:
   - **Application name**: VibeMatch Local Dev
   - **Application description**: Music matching app
   - **Callback URL**: `http://localhost:3000/auth/callback`
3. Copy your **API Key** and **Shared Secret**

### Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add:
```env
LASTFM_API_KEY=your_api_key_here
LASTFM_API_SECRET=your_shared_secret_here
SECRET_KEY=some_random_string_at_least_32_characters
ADMIN_API_KEY=admin_secret_key
```

### Step 3: Start the App

```bash
docker-compose up --build
```

Wait for all services to start (~2 minutes first time).

You'll see:
```
✓ Qdrant running on :6333
✓ Redis running on :6379
✓ Backend API on :8000
✓ Frontend on :3000
```

### Step 4: Access the App

Open your browser to **http://localhost:3000**

---

## 🎵 First Time User Flow

1. Click **"Connect with Last.fm"**
2. Authorize on Last.fm
3. Get redirected back to VibeMatch
4. Wait ~5 seconds while we analyze your taste
5. See your top matches!

---

## 🤖 Optional: Seed Ghost Users

For better initial experience, populate the database with 10K diverse users:

```bash
# In a new terminal while the app is running
docker-compose exec backend python scripts/seed_ghost_users.py --count 10000
```

This takes ~10-15 minutes.

---

## 🔧 Troubleshooting

### "Cannot connect to Qdrant"

Wait a bit longer, Qdrant takes ~30 seconds to start on first run.

### "Authentication failed"

- Double-check your Last.fm API credentials in `.env`
- Verify the callback URL is exactly `http://localhost:3000/auth/callback`

### "No matches found"

- Run the ghost user seeding script (see above)
- Or connect a second account to test

### Port already in use

Change ports in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Frontend on 3001 instead of 3000
```

---

## 📚 Next Steps

- **Train the GNN model**: See `backend/train_gnn.ipynb` for production-quality embeddings
- **Customize the UI**: Edit `frontend/src/app/page.tsx` and components
- **Deploy to production**: Check `DEPLOYMENT.md`

---

## 🎓 Understanding the Stack

**Backend** (FastAPI):
- `app/api/` - REST endpoints
- `app/services/` - Business logic (Last.fm, Qdrant, embeddings)
- `model/` - GNN embeddings (auto-generated if missing)

**Frontend** (Next.js 15):
- `src/app/` - Pages (landing, dashboard, auth)
- `src/components/` - Reusable UI components
- `src/lib/` - API client, store, utilities

**Infrastructure**:
- **Qdrant**: Vector database for similarity search
- **Redis**: Caching (optional for now)

---

## 💡 Pro Tips

### Fast Reload

Backend changes auto-reload with `--reload` flag (already configured).

Frontend changes hot-reload automatically.

### API Docs

While running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Direct API Testing

```bash
# Get auth URL
curl http://localhost:8000/auth/lastfm/authorize-url

# Get matches (requires token)
curl http://localhost:8000/match/top?limit=5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Database GUI

Access Qdrant web UI at: http://localhost:6333/dashboard

---

## 🆘 Still Stuck?

- Check logs: `docker-compose logs -f backend`
- GitHub Issues: https://github.com/yourusername/vibematch/issues
- Read full README: `README.md`

---

**Happy Matching! 🎵💜**
