# 🎵 VibeMatch

**Find Your Music Soulmate** — A Tinder-style music matching app powered by Graph Neural Networks and Last.fm.

VibeMatch uses cutting-edge AI to analyze your music taste and connect you with people who share your exact vibe. Built with modern tech stack and ready to scale to 100K+ users.

---

## 🚀 Features

- **🤖 AI-Powered Matching**: GNN-based embeddings (LightGCN) trained on millions of playlists
- **🎯 Last.fm Integration**: OAuth authentication and rich profile data
- **💾 Vector Search**: Lightning-fast similarity search with Qdrant
- **👻 Ghost Users**: Pre-seeded with 10K diverse music profiles for instant matches
- **📊 Deep Analytics**: Compatibility scores, shared artists, genre insights
- **🎨 Beautiful UI**: Next.js 15 with Tailwind CSS and smooth animations
- **🔐 Secure & Private**: JWT authentication, ToS compliant

---

## 🏗️ Architecture

```
VibeMatch/
├── backend/           # FastAPI + PyTorch Geometric
│   ├── app/
│   │   ├── api/       # REST endpoints (auth, user, match, admin)
│   │   ├── core/      # Config & security
│   │   ├── models/    # Pydantic schemas
│   │   ├── services/  # Business logic (Last.fm, Qdrant, embeddings)
│   │   └── utils/     # Ghost user seeding
│   ├── model/         # Trained GNN model + embeddings
│   ├── scripts/       # Standalone utilities
│   └── train_gnn.ipynb # Model training notebook
│
├── frontend/          # Next.js 15 + TypeScript
│   ├── src/
│   │   ├── app/       # Pages (landing, auth, dashboard)
│   │   ├── components/# React components
│   │   ├── lib/       # API client, store, utils
│   │   └── types/     # TypeScript definitions
│
└── docker-compose.yml # Full stack orchestration
```

---

## 📋 Prerequisites

- **Docker & Docker Compose** (recommended)
- **OR** Manual setup:
  - Python 3.11+
  - Node.js 20+
  - Qdrant (running on port 6333)
  - Redis (running on port 6379)

---

## 🎬 Quick Start (Docker)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/vibematch.git
cd vibematch
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Last.fm API (get from https://www.last.fm/api/account/create)
LASTFM_API_KEY=your_api_key_here
LASTFM_API_SECRET=your_api_secret_here
LASTFM_CALLBACK_URL=http://localhost:3000/auth/callback

# Admin
ADMIN_API_KEY=your_secure_admin_key
SECRET_KEY=your_jwt_secret_key_min_32_chars
```

### 3. Train the GNN model (First time only)

**Option A: Use the training notebook** (recommended for real datasets)

```bash
cd backend
jupyter notebook train_gnn.ipynb
```

Follow the notebook instructions to:
1. Download Spotify MPD and Last.fm LFM-360K datasets
2. Build the graph and train LightGCN
3. Generate embeddings (saved to `backend/model/`)

**Option B: Skip training** (for quick demo)

The backend will create dummy embeddings automatically if model files don't exist.

### 4. Start the application

```bash
docker-compose up --build
```

This will start:
- **Qdrant** (vector DB) on `localhost:6333`
- **Redis** on `localhost:6379`
- **Backend API** on `localhost:8000`
- **Frontend** on `localhost:3000`

### 5. Seed ghost users (optional but recommended)

In a new terminal:

```bash
docker-compose exec backend python scripts/seed_ghost_users.py --count 10000
```

### 6. Open the app

Visit http://localhost:3000 and click **"Connect with Last.fm"**

---

## 🛠️ Manual Setup (Without Docker)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export LASTFM_API_KEY=your_key
export LASTFM_API_SECRET=your_secret
# ... (see .env.example for all vars)

# Train model (optional)
jupyter notebook train_gnn.ipynb

# Run server
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set environment variables
export NEXT_PUBLIC_API_URL=http://localhost:8000
export NEXT_PUBLIC_LASTFM_API_KEY=your_key

# Run dev server
npm run dev
```

---

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Authentication
- `GET /auth/lastfm/authorize-url` - Get Last.fm OAuth URL
- `POST /auth/lastfm` - Exchange token for JWT

#### User
- `GET /user/profile?username={username}` - Get Last.fm profile
- `POST /user/embedding` - Generate user embedding
- `GET /user/embedding/status` - Check if embedding exists

#### Matching
- `GET /match/top?limit=20` - Get top matches
- `GET /match/stats` - Get matching statistics

#### Admin
- `POST /admin/seed/ghosts` - Seed ghost users (requires `X-Admin-Key` header)
- `GET /admin/stats` - Get admin statistics

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

---

## 🚀 Deployment

### Railway (Recommended)

1. **Push to GitHub**
2. **Connect Railway** to your repo
3. **Add services**:
   - Qdrant (use Railway template or Docker)
   - Redis (Railway template)
   - Backend (Python)
   - Frontend (Next.js)
4. **Set environment variables** in Railway dashboard
5. **Deploy!**

### Fly.io

```bash
# Backend
cd backend
fly launch
fly deploy

# Frontend
cd frontend
fly launch
fly deploy
```

### Render

1. Create new **Web Service** for backend (Python)
2. Create new **Static Site** for frontend (Next.js)
3. Create **Qdrant** via Docker or external service
4. Add environment variables

---

## 🎓 How It Works

### 1. Graph Neural Network (GNN)

VibeMatch uses **LightGCN** (Light Graph Convolutional Network) trained on:
- **Nodes**: 2M+ tracks + 500K+ artists
- **Edges**:
  - Track ↔ Artist (authorship)
  - Track ↔ Track (playlist co-occurrence)
  - Artist ↔ Artist (collaboration)

The model learns 128-dimensional embeddings that capture musical relationships.

### 2. User Embedding Generation

When a user connects their Last.fm:
1. Fetch their top 50 artists + top 50 tracks (all-time)
2. Look up precomputed embeddings for each track/artist
3. Compute **weighted average** (by playcount)
4. Normalize to unit vector
5. Store in Qdrant with metadata

### 3. Matching Algorithm

```python
similarity = cosine_similarity(user_embedding, other_user_embedding)
compatibility_score = int(similarity * 100)
```

Qdrant's HNSW index enables sub-millisecond searches across millions of users.

### 4. Ghost Users

To ensure new users have matches immediately, we pre-seed Qdrant with 10K diverse profiles:
- **40%** top global scrobblers (mainstream taste)
- **30%** niche genres (vaporwave, hyperpop, etc.)
- **20%** veteran users (10+ years of history)
- **10%** international users (non-English countries)

---

## 🔒 Security & Privacy

- ✅ **No scraping**: Only uses public Last.fm API
- ✅ **JWT authentication**: Secure token-based auth
- ✅ **Rate limiting**: Respects Last.fm API limits
- ✅ **No PII storage**: Only public profile data
- ✅ **ToS compliant**: Follows Last.fm terms of service

---

## 📊 Datasets

### Spotify Million Playlist Dataset (MPD)
- **Source**: https://www.aicrowd.com/challenges/spotify-million-playlist-dataset-challenge
- **Size**: 1M playlists, 2M+ unique tracks
- **License**: Research use only

### Last.fm LFM-360K
- **Source**: http://www.cp.jku.at/datasets/LFM-1b/
- **Size**: 360K users, 292K artists, 17M listening events
- **License**: Research use only

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a PR

---

## 📝 License

MIT License - see [LICENSE](LICENSE)

---

## 🙏 Acknowledgments

- **Last.fm** for the amazing API
- **Spotify** for the Million Playlist Dataset
- **PyTorch Geometric** for GNN framework
- **Qdrant** for vector search
- **Next.js** team for the incredible framework

---

## 📧 Contact

Built by [Your Name]

- GitHub: [@yourusername](https://github.com/yourusername)
- Twitter: [@yourhandle](https://twitter.com/yourhandle)
- Email: your.email@example.com

---

⭐ **If you like VibeMatch, give it a star!** ⭐
