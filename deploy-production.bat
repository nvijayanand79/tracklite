@echo off
REM Production deployment script for TraceLite on Windows
REM Run this on your production server

echo 🚀 Starting TraceLite Production Deployment...

REM Stop any existing processes
echo 📦 Stopping existing processes...
taskkill /F /IM node.exe 2>nul || echo No existing Node processes found

REM Update code (if using git)
if exist ".git" (
    echo 📦 Updating code from git...
    git pull origin main
)

REM Install/update dependencies
echo 📦 Installing/updating dependencies...
cd web
call npm install

REM Build for production
echo 🏗️ Building production assets...
call npm run build

REM Check if build was successful
if not exist "dist" (
    echo ❌ Build failed! dist directory not found.
    pause
    exit /b 1
)

echo ✅ Build completed successfully!

REM Start production server
echo 🚀 Starting production server...
echo 📱 TraceLite will be available at: http://65.20.74.233:5173
echo 🔗 API should be running at: http://65.20.74.233:8000

REM Run in production mode
call npm run start

echo 🎉 TraceLite production deployment complete!
