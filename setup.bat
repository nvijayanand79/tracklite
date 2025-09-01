@echo off
REM Setup script for Windows: API venv and dependencies

cd /d %~dp0

REM Create venv if missing
if not exist "api\.venv\Scripts\activate.bat" (
    echo Creating Python venv in api\.venv ...
    python -m venv api\.venv
)

REM Activate venv
call api\.venv\Scripts\activate.bat

REM Upgrade pip and wheel
python -m pip install --upgrade pip wheel

REM Install requirements
if exist "api\requirements.txt" (
    pip install -r api\requirements.txt
) else (
    echo No api\requirements.txt found!
)

REM Done
@echo on
