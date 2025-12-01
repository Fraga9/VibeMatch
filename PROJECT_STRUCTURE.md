# 📁 VibeMatch Project Structure

Complete file tree of the VibeMatch monorepo.

```
VibeMatch/
│
├── 📄 README.md                    # Main documentation
├── 📄 QUICKSTART.md                # 5-minute quick start guide
├── 📄 DEPLOYMENT.md                # Production deployment guide
├── 📄 LICENSE                      # MIT license
├── 📄 Makefile                     # Convenient commands
├── 📄 .gitignore                   # Git ignore rules
├── 📄 .env.example                 # Environment template
├── 🐳 docker-compose.yml           # Docker orchestration
├── 🔧 setup.sh                     # Auto-setup (Linux/Mac)
├── 🔧 setup.bat                    # Auto-setup (Windows)
│
├── 🐍 backend/                     # FastAPI Backend
│   ├── 🐳 Dockerfile               # Backend container
│   ├── 📄 requirements.txt         # Python dependencies
│   ├── 📓 train_gnn.ipynb          # GNN training notebook
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── 🚀 main.py              # FastAPI app entry point
│   │   │
│   │   ├── api/                    # REST API endpoints
│   │   │   ├── __init__.py
│   │   │   ├── auth.py             # Last.fm OAuth
│   │   │   ├── user.py             # User profile & embeddings
│   │   │   ├── match.py            # Matching endpoints
│   │   │   └── admin.py            # Admin operations
│   │   │
│   │   ├── core/                   # Core configuration
│   │   │   ├── __init__.py
│   │   │   ├── config.py           # Settings & env vars
│   │   │   └── security.py         # JWT & auth utilities
│   │   │
│   │   ├── models/                 # Data models
│   │   │   ├── __init__.py
│   │   │   └── schemas.py          # Pydantic schemas
│   │   │
│   │   ├── services/               # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── lastfm.py           # Last.fm API client
│   │   │   ├── qdrant_service.py   # Vector DB operations
│   │   │   └── embedding.py        # GNN embedding service
│   │   │
│   │   └── utils/                  # Utilities
│   │       ├── __init__.py
│   │       └── ghost_seeder.py     # Ghost user seeding
│   │
│   ├── scripts/
│   │   └── seed_ghost_users.py     # Standalone seeding script
│   │
│   ├── model/                      # GNN model files (generated)
│   │   ├── .gitkeep
│   │   ├── lightgcn_mpd_lfm.pt     # Trained model weights
│   │   ├── precomputed_embeddings.pkl  # Track/artist embeddings
│   │   └── track_artist_mapping.pkl    # Name → ID mappings
│   │
│   └── data/                       # Training datasets (not in git)
│       └── .gitkeep
│
├── ⚛️  frontend/                   # Next.js 15 Frontend
│   ├── 🐳 Dockerfile               # Frontend container
│   ├── 📄 package.json             # NPM dependencies
│   ├── 📄 tsconfig.json            # TypeScript config
│   ├── 📄 next.config.js           # Next.js config
│   ├── 📄 tailwind.config.js       # Tailwind CSS config
│   ├── 📄 postcss.config.js        # PostCSS config
│   │
│   ├── public/                     # Static assets
│   │
│   └── src/
│       ├── app/                    # Next.js App Router
│       │   ├── layout.tsx          # Root layout
│       │   ├── page.tsx            # Landing page
│       │   ├── globals.css         # Global styles
│       │   ├── favicon.ico         # Favicon
│       │   │
│       │   ├── auth/
│       │   │   └── callback/
│       │   │       └── page.tsx    # OAuth callback handler
│       │   │
│       │   └── dashboard/
│       │       └── page.tsx        # Dashboard with matches
│       │
│       ├── components/             # React components
│       │   └── MatchCard.tsx       # Match result card
│       │
│       ├── lib/                    # Libraries & utilities
│       │   ├── api.ts              # API client (Axios)
│       │   ├── store.ts            # Global state (Zustand)
│       │   └── utils.ts            # Helper functions
│       │
│       └── types/                  # TypeScript types
│           └── index.ts            # Type definitions
│
└── 🗄️  Infrastructure (Docker services)
    ├── Qdrant (Vector DB)          → localhost:6333
    ├── Redis (Cache)               → localhost:6379
    ├── Backend (FastAPI)           → localhost:8000
    └── Frontend (Next.js)          → localhost:3000
```

---

## 📊 File Statistics

### Backend
- **20 Python files** (`.py`)
- **1 Jupyter notebook** (`.ipynb`)
- **Total lines**: ~3,500

### Frontend
- **11 TypeScript files** (`.ts`, `.tsx`)
- **5 Config files** (`.json`, `.js`)
- **Total lines**: ~1,500

### Infrastructure
- **2 Dockerfiles**
- **1 docker-compose.yml**
- **Total services**: 4

### Documentation
- **3 Markdown files** (README, QUICKSTART, DEPLOYMENT)
- **Total lines**: ~1,000

**Total Project Size**: ~6,000 lines of code

---

## 🔑 Key Files Explained

### Backend Core Files

| File | Purpose |
|------|---------|
| `app/main.py` | FastAPI application, CORS, routers |
| `app/core/config.py` | Environment variables & settings |
| `app/core/security.py` | JWT tokens & authentication |
| `app/services/embedding.py` | GNN model loading & user embeddings |
| `app/services/qdrant_service.py` | Vector database operations |
| `app/services/lastfm.py` | Last.fm API integration |
| `app/utils/ghost_seeder.py` | Populate database with diverse users |

### Frontend Core Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Landing page with Last.fm login |
| `src/app/dashboard/page.tsx` | User dashboard with matches |
| `src/app/auth/callback/page.tsx` | OAuth redirect handler |
| `src/lib/api.ts` | Backend API client |
| `src/lib/store.ts` | Global state management |
| `src/components/MatchCard.tsx` | Match result UI component |

### Configuration Files

| File | Purpose |
|------|---------|
| `.env.example` | Environment variables template |
| `docker-compose.yml` | Full stack orchestration |
| `Makefile` | Common development commands |
| `setup.sh` / `setup.bat` | Automated setup scripts |

---

## 🚀 Getting Started

1. **Quick Docker Start**:
   ```bash
   docker-compose up
   ```

2. **Manual Setup**:
   ```bash
   ./setup.sh      # Linux/Mac
   setup.bat       # Windows
   ```

3. **Read Guides**:
   - `QUICKSTART.md` - 5-minute setup
   - `README.md` - Full documentation
   - `DEPLOYMENT.md` - Production deployment

---

## 📦 Dependencies

### Backend (Python 3.11+)
- **FastAPI** 0.109.0 - Web framework
- **PyTorch** 2.1.2 - ML framework
- **PyTorch Geometric** 2.4.0 - GNN library
- **Qdrant Client** 1.7.0 - Vector DB
- **pylast** 5.2.0 - Last.fm API
- **Redis** 5.0.1 - Caching

### Frontend (Node.js 20+)
- **Next.js** 15.1.0 - React framework
- **React** 19.0.0 - UI library
- **TypeScript** 5.3.3 - Type safety
- **Tailwind CSS** 3.4.1 - Styling
- **Zustand** 4.5.0 - State management
- **Axios** 1.6.5 - HTTP client

---

**Built with ❤️ by the VibeMatch team**
