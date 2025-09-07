#!/bin/bash

# TraceLite Setup Script for Linux/macOS
# This script sets up the complete Node.js-based TraceLite application

echo "========================================"
echo "TraceLite Laboratory Management System"
echo "Setup Script for Linux/macOS"
echo "========================================"
echo

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed or not in PATH"
    echo "Please download and install Node.js from https://nodejs.org/"
    echo "Minimum version required: v16.0.0"
    echo
    echo "Installation options:"
    echo "  - macOS: brew install node"
    echo "  - Ubuntu/Debian: sudo apt update && sudo apt install nodejs npm"
    echo "  - CentOS/RHEL: sudo yum install nodejs npm"
    exit 1
fi

echo "✓ Node.js detected: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ ERROR: npm is not installed or not in PATH"
    exit 1
fi

echo "✓ npm detected: $(npm --version)"
echo

# Install root dependencies (for concurrent development)
echo "[1/3] Installing root dependencies (concurrently)..."
if [ -f "package.json" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ ERROR: Failed to install root dependencies"
        exit 1
    fi
    echo "✓ Root dependencies installed successfully"
else
    echo "⚠️  WARNING: No package.json found in root directory"
fi
echo

# Install frontend dependencies
echo "[2/3] Installing frontend dependencies..."
if [ -f "web/package.json" ]; then
    cd web
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ ERROR: Failed to install frontend dependencies"
        exit 1
    fi
    echo "✓ Frontend dependencies installed successfully"
    cd ..
else
    echo "❌ ERROR: No package.json found in web directory"
    exit 1
fi
echo

# Install backend server dependencies
echo "[3/3] Installing backend server dependencies..."
if [ -f "web/server/package.json" ]; then
    cd web/server
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ ERROR: Failed to install server dependencies"
        exit 1
    fi
    echo "✓ Server dependencies installed successfully"
    cd ../..
else
    echo "❌ ERROR: No package.json found in web/server directory"
    exit 1
fi
echo

# Check if database exists
if [ -f "tracelite.db" ]; then
    echo "✓ Database file found: tracelite.db"
else
    echo "ℹ️  Database will be created automatically on first startup"
fi
echo

echo "========================================"
echo "Setup completed successfully! 🎉"
echo "========================================"
echo
echo "To start the development environment:"
echo "  npm run dev"
echo
echo "This will start:"
echo "  - Frontend (React): http://localhost:5173"
echo "  - Backend API: http://localhost:3001"
echo
echo "Default admin credentials:"
echo "  Email: admin@example.com"
echo "  Password: admin123"
echo
echo "Owner portal OTP (development): 123456"
echo
echo "For more information, see README.md"
echo "========================================"
