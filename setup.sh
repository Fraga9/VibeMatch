#!/bin/bash

# VibeMatch Setup Script
# Automated setup for local development without Docker

set -e

echo "======================================"
echo "🎵 VibeMatch Setup Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Checking prerequisites..."

# Python 3.11+
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found. Please install Python 3.11+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python 3 found${NC}"

# Node.js 20+
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 20+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found${NC}"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ .env file not found. Creating from template...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠ Please edit .env and add your Last.fm API credentials${NC}"
    echo -e "${YELLOW}⚠ Get them from: https://www.last.fm/api/account/create${NC}"
    read -p "Press Enter when you've added your credentials..."
fi

# Setup backend
echo ""
echo "Setting up backend..."
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo -e "${GREEN}✓ Backend setup complete${NC}"

cd ..

# Setup frontend
echo ""
echo "Setting up frontend..."
cd frontend

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

echo -e "${GREEN}✓ Frontend setup complete${NC}"

cd ..

# Create necessary directories
echo ""
echo "Creating directories..."
mkdir -p backend/data
mkdir -p backend/model

echo -e "${GREEN}✓ Directories created${NC}"

# Final instructions
echo ""
echo "======================================"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Start Qdrant (in a separate terminal):"
echo "   docker run -p 6333:6333 qdrant/qdrant"
echo ""
echo "2. Start Redis (optional, in a separate terminal):"
echo "   docker run -p 6379:6379 redis:7-alpine"
echo ""
echo "3. Start backend (in a separate terminal):"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   uvicorn app.main:app --reload"
echo ""
echo "4. Start frontend (in a separate terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "5. Open http://localhost:3000 in your browser"
echo ""
echo "Or use Docker Compose for easier setup:"
echo "   docker-compose up"
echo ""
echo "======================================"
