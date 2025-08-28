@echo off
echo 🧪 Testing TraceLite Docker Setup...

echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak > nul

echo Testing API Health Check...
curl -f http://localhost:8000/health
if %errorlevel% equ 0 (
    echo ✓ API Health Check PASSED
) else (
    echo ✗ API Health Check FAILED
)

echo Testing Frontend...
curl -f http://localhost > nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Frontend PASSED
) else (
    echo ✗ Frontend FAILED
)

echo.
echo 🎯 Demo Access Information:
echo    Frontend: http://localhost
echo    API Docs: http://localhost:8000/docs
echo.
echo 📧 Demo Login Emails:
echo    - contact@acme.com
echo    - lab@techstart.com
echo    - samples@greenenergy.com
echo    OTP: 123456 (for all accounts)
echo.
echo 🔍 Demo Tracking IDs:
echo    - RCP-001 / LAB-2024-001
echo    - RCP-002 / LAB-2024-002
echo    - RCP-003 / LAB-2024-003
echo.
echo ✅ Testing completed!
pause
