@echo off
REM TraceLite Demo Launcher
REM Quick start script for the Node.js-based TraceLite application

echo ========================================
echo 🚀 TraceLite Laboratory Management Demo
echo ========================================
echo.

cd /d %~dp0

REM Check if dependencies are installed
echo 🔧 Checking dependencies...

REM Check if root node_modules exists
if not exist "node_modules" (
    echo 📦 Installing root dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install root dependencies
        echo Please run setup.bat first
        pause
        exit /b 1
    )
)

REM Check if web node_modules exists
if not exist "web\node_modules" (
    echo 📦 Installing frontend dependencies...
    cd web
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install frontend dependencies
        echo Please run setup.bat first
        pause
        exit /b 1
    )
    cd ..
)

REM Check if server node_modules exists
if not exist "web\server\node_modules" (
    echo 📦 Installing server dependencies...
    cd web\server
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install server dependencies
        echo Please run setup.bat first
        pause
        exit /b 1
    )
    cd ..\..
)

echo ✅ All dependencies are ready!
echo.

REM Check for database file
if exist "tracelite.db" (
    echo ✅ Database found: tracelite.db
) else (
    echo ℹ Database will be created automatically with demo data
)
echo.

echo ========================================
echo 🎯 Starting TraceLite Demo Environment
echo ========================================
echo.
echo This will start:
echo   🌐 Frontend (React + Vite): http://localhost:5173
echo   🔌 Backend API (Express):   http://localhost:3001
echo.
echo Default Login Credentials:
echo   📧 Email:    admin@example.com
echo   🔑 Password: admin123
echo.
echo Owner Portal:
echo   🔗 URL: http://localhost:5173/owner/track
echo   📱 OTP (dev): 123456
echo.
echo Press Ctrl+C to stop the servers
echo ========================================
echo.

REM Start both frontend and backend concurrently
npm run dev

echo.
echo ========================================
echo 👋 TraceLite Demo has been stopped
echo ========================================
pause
