# 🚀 Production Deployment Guide

## Quick Fix for Current Issue

Your production server at `65.20.74.233:5173` stopped working because it was running in development mode. Here's how to fix it properly:

### Option 1: Quick Restart (Temporary)
```bash
# SSH to your production server
ssh user@65.20.74.233

# Navigate to your project
cd /path/to/tracelite-starter

# Start in development mode (quick fix)
cd web
npm run dev -- --host 0.0.0.0
```

### Option 2: Proper Production Setup (Recommended)

#### Step 1: Install PM2 (Process Manager)
```bash
npm install -g pm2
```

#### Step 2: Deploy Production Build
```bash
# On production server
cd /path/to/tracelite-starter

# Run the deployment script
chmod +x deploy-production.sh
./deploy-production.sh
```

#### Step 3: Use PM2 for Process Management
```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.json

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Production URLs
- **Frontend**: http://65.20.74.233:5173
- **Backend**: http://65.20.74.233:3001/api

## PM2 Management Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs tracelite-web
pm2 logs tracelite-api

# Restart services
pm2 restart tracelite-web
pm2 restart tracelite-api

# Stop services
pm2 stop all

# Delete services
pm2 delete all
```

## Benefits of This Setup

1. **Auto-restart**: If the server crashes, PM2 automatically restarts it
2. **Production optimized**: Uses built assets, not development server
3. **Process monitoring**: Built-in logging and monitoring
4. **Boot persistence**: Starts automatically after server reboot
5. **Memory management**: Automatic restart on memory limits

## Current vs New Architecture

### Before (Problematic):
```
npm run dev → Vite dev server → Port 5173 (Development)
```

### After (Production Ready):
```
npm run build → Production assets → npm run start → Port 5173 (Production)
```

## Troubleshooting

### If the server is still down:
1. SSH to the production server
2. Run: `pm2 logs` to see what's happening
3. Check if ports are free: `netstat -tulpn | grep 5173`
4. Restart services: `pm2 restart all`

### Emergency Quick Start:
```bash
cd /path/to/tracelite-starter/web
npm run build
npm run start
```

This will get your application back online with proper production configuration!
