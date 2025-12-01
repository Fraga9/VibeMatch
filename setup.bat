@echo off
echo ======================================
echo  VibeMatch Setup Script (Windows)
echo ======================================
echo.

:: Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python not found. Please install Python 3.11+
    pause
    exit /b 1
)
echo [OK] Python found

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found. Please install Node.js 20+
    pause
    exit /b 1
)
echo [OK] Node.js found

:: Check .env
if not exist ".env" (
    echo [WARNING] .env file not found. Creating from template...
    copy .env.example .env
    echo [WARNING] Please edit .env and add your Last.fm API credentials
    echo [WARNING] Get them from: https://www.last.fm/api/account/create
    pause
)

:: Setup backend
echo.
echo Setting up backend...
cd backend

:: Create virtual environment
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

:: Activate and install
call venv\Scripts\activate.bat
echo Installing Python dependencies...
pip install --upgrade pip
pip install -r requirements.txt

echo [OK] Backend setup complete

cd ..

:: Setup frontend
echo.
echo Setting up frontend...
cd frontend

echo Installing Node.js dependencies...
call npm install

echo [OK] Frontend setup complete

cd ..

:: Create directories
echo.
echo Creating directories...
if not exist "backend\data" mkdir backend\data
if not exist "backend\model" mkdir backend\model

echo [OK] Directories created

:: Final instructions
echo.
echo ======================================
echo  Setup Complete!
echo ======================================
echo.
echo Next steps:
echo.
echo 1. Start Qdrant (in a separate terminal):
echo    docker run -p 6333:6333 qdrant/qdrant
echo.
echo 2. Start Redis (optional, in a separate terminal):
echo    docker run -p 6379:6379 redis:7-alpine
echo.
echo 3. Start backend (in a separate terminal):
echo    cd backend
echo    venv\Scripts\activate.bat
echo    uvicorn app.main:app --reload
echo.
echo 4. Start frontend (in a separate terminal):
echo    cd frontend
echo    npm run dev
echo.
echo 5. Open http://localhost:3000 in your browser
echo.
echo Or use Docker Compose for easier setup:
echo    docker-compose up
echo.
echo ======================================
pause
