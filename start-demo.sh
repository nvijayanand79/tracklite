#!/bin/bash
echo "🚀 Starting TraceLite Docker Demo..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker found!"

echo ""
echo "🛠️ Building and starting services..."

# Try Docker Compose V2 first
if docker compose up --build -d &> /dev/null; then
    echo "✅ Services started with Docker Compose V2"
elif docker-compose up --build -d &> /dev/null; then
    echo "✅ Services started with Docker Compose V1"
else
    echo "❌ Failed to start services"
    echo "Please check Docker installation and try again"
    exit 1
fi

echo ""
echo "🎉 TraceLite is starting up!"
echo "⏳ Please wait 30-60 seconds for initialization..."
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://localhost"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "📧 Demo Login (OTP: 123456):"
echo "   - contact@acme.com"
echo "   - lab@techstart.com"
echo "   - samples@greenenergy.com"
echo ""
echo "🔍 Demo Tracking IDs:"
echo "   - RCP-001 / LAB-2024-001"
echo "   - RCP-002 / LAB-2024-002"
echo "   - RCP-003 / LAB-2024-003"
echo ""
echo "Press Enter to run connectivity tests..."
read

./test-docker.sh
