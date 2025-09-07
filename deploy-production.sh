#!/bin/bash
# Production deployment script for TraceLite
# Run this on your production server (65.20.74.233)

echo "🚀 Starting TraceLite Production Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Stop any existing processes
echo -e "${YELLOW}📦 Stopping existing processes...${NC}"
pkill -f "vite" || true
pkill -f "npm run dev" || true
pkill -f "node.*5173" || true

# Update code (if using git)
if [ -d ".git" ]; then
    echo -e "${YELLOW}📦 Updating code from git...${NC}"
    git pull origin main
fi

# Install/update dependencies
echo -e "${YELLOW}📦 Installing/updating dependencies...${NC}"
cd web
npm install

# Build for production
echo -e "${YELLOW}🏗️ Building production assets...${NC}"
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed! dist directory not found.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully!${NC}"

# Start production server
echo -e "${YELLOW}🚀 Starting production server...${NC}"
echo -e "${GREEN}📱 TraceLite will be available at: http://65.20.74.233:5173${NC}"
echo -e "${GREEN}🔗 API should be running at: http://65.20.74.233:8000${NC}"

# Run in production mode
npm run start

echo -e "${GREEN}🎉 TraceLite production deployment complete!${NC}"
