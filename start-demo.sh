#!/bin/bash

# TraceLite Demo Launcher for Linux/macOS
# Quick start script for the Node.js-based TraceLite application

echo "========================================"
echo "🚀 TraceLite Laboratory Management Demo"
echo "========================================"
echo

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR"

# Check if dependencies are installed
echo "🔧 Checking dependencies..."

# Check if root node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install root dependencies"
        echo "Please run ./setup.sh first"
        exit 1
    fi
fi

# Check if web node_modules exists
if [ ! -d "web/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd web
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install frontend dependencies"
        echo "Please run ./setup.sh first"
        exit 1
    fi
    cd ..
fi

# Check if server node_modules exists
if [ ! -d "web/server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd web/server
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install server dependencies"
        echo "Please run ./setup.sh first"
        exit 1
    fi
    cd ../..
fi

echo "✅ All dependencies are ready!"
echo

# Check for database file
if [ -f "tracelite.db" ]; then
    echo "✅ Database found: tracelite.db"
else
    echo "ℹ️  Database will be created automatically with demo data"
fi
echo

echo "========================================"
echo "🎯 Starting TraceLite Demo Environment"
echo "========================================"
echo
echo "This will start:"
echo "  🌐 Frontend (React + Vite): http://localhost:5173"
echo "  🔌 Backend API (Express):   http://localhost:3001"
echo
echo "Default Login Credentials:"
echo "  📧 Email:    admin@example.com"
echo "  🔑 Password: admin123"
echo
echo "Owner Portal:"
echo "  🔗 URL: http://localhost:5173/owner/track"
echo "  📱 OTP (dev): 123456"
echo
echo "Press Ctrl+C to stop the servers"
echo "========================================"
echo

# Start both frontend and backend concurrently
npm run dev

echo
echo "========================================"
echo "👋 TraceLite Demo has been stopped"
echo "========================================"
