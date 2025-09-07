@echo off
REM TraceLite Setup Script for Windows
REM This script sets up the complete Node.js-based TraceLite application

echo ========================================
echo TraceLite Laboratory Management System
echo Setup Script for Windows
echo ========================================
echo.

cd /d %~dp0

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please download and install Node.js from https://nodejs.org/
    echo Minimum version required: v16.0.0
    pause
    exit /b 1
)

echo ✓ Node.js detected: 
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)

echo ✓ npm detected: 
npm --version
echo.

REM Install root dependencies (for concurrent development)
echo [1/3] Installing root dependencies (concurrently)...
if exist "package.json" (
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install root dependencies
        pause
        exit /b 1
    )
    echo ✓ Root dependencies installed successfully
) else (
    echo WARNING: No package.json found in root directory
)
echo.

REM Install frontend dependencies
echo [2/3] Installing frontend dependencies...
if exist "web\package.json" (
    cd web
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
    echo ✓ Frontend dependencies installed successfully
    cd ..
) else (
    echo ERROR: No package.json found in web directory
    pause
    exit /b 1
)
echo.

REM Install backend server dependencies
echo [3/3] Installing backend server dependencies...
if exist "web\server\package.json" (
    cd web\server
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install server dependencies
        pause
        exit /b 1
    )
    echo ✓ Server dependencies installed successfully
    cd ..\..
) else (
    echo ERROR: No package.json found in web\server directory
    pause
    exit /b 1
)
echo.

REM Check if database exists, if not it will be created automatically
if exist "tracelite.db" (
    echo ✓ Database file found: tracelite.db
) else (
    echo ℹ Database will be created automatically on first startup
)
echo.

echo ========================================
echo Setup completed successfully! 🎉
echo ========================================
echo.
echo To start the development environment:
echo   npm run dev
echo.
echo This will start:
echo   - Frontend (React): http://localhost:5173
echo   - Backend API: http://localhost:3001
echo.
echo Default admin credentials:
echo   Email: admin@example.com
echo   Password: admin123
echo.
echo Owner portal OTP (development): 123456
echo.
echo For more information, see README.md
echo ========================================
pause
