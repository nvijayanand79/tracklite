@echo off
echo 🚀 TrackLite Demo Launcher
echo ========================

echo 🔧 Checking dependencies...

REM Check Python venv
if not exist "api\.venv\Scripts\activate.bat" (
    echo Installing Python dependencies...
    call setup.bat
) else (
    echo ✅ Python dependencies already installed
)

REM Check Node modules
if not exist "web\node_modules" (
    echo 📦 Installing web dependencies...
    cd web
    npm install
    cd ..
) else (
    echo ✅ Web dependencies already installed
)

echo 🌱 Seeding demo data...
cd api
call .venv\Scripts\activate
python ..\scripts\seed_demo.py
cd ..

echo ✅ Setup complete! Starting services...

REM Start Python API
start "TrackLite API" cmd /k "cd /d %~dp0\api && call .venv\Scripts\activate && .venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload"

REM Start Webapp
start "TrackLite Web" cmd /k "cd /d %~dp0\web && npm run dev -- --host"

echo 🎉 TrackLite is starting up!
echo.
echo 📄 See DEMO_GUIDE.md for functionalities and test instructions
echo.
echo 🌐 Access URLs:
echo    Web App: http://localhost:5173
echo    API Docs: http://localhost:8000/docs
echo.
pause
exit /b
