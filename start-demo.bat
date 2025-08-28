@echo off
echo 🚀 Starting TraceLite Docker Demo...

echo Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not in PATH
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✅ Docker found!

echo.
echo 🛠️ Building and starting services...

REM Try Docker Compose V2 first
docker compose up --build -d >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Services started with Docker Compose V2
    goto :success
)

REM Fallback to V1
echo Trying Docker Compose V1...
docker-compose up --build -d >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Services started with Docker Compose V1
    goto :success
) else (
    echo ❌ Failed to start services
    echo Please check Docker installation and try again
    pause
    exit /b 1
)

:success
echo.
echo 🎉 TraceLite is starting up!
echo ⏳ Please wait 30-60 seconds for initialization...
echo.
echo 🌐 Access URLs:
echo    Frontend: http://localhost
echo    API Docs: http://localhost:8000/docs
echo.
echo 📧 Demo Login (OTP: 123456):
echo    - contact@acme.com
echo    - lab@techstart.com
echo    - samples@greenenergy.com
echo.
echo 🔍 Demo Tracking IDs:
echo    - RCP-001 / LAB-2024-001
echo    - RCP-002 / LAB-2024-002
echo    - RCP-003 / LAB-2024-003
echo.
echo Press any key to run connectivity tests...
pause >nul

call test-docker.bat
