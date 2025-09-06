# Tracelite Unified Server

This is a unified Node.js Express server that serves both the React frontend and API endpoints from a single process.

## Features
- Serves React frontend as static files
- Provides REST API endpoints under `/api`
- Single process for easy deployment
- No CORS issues since frontend and API share the same origin

## Quick Start

### Development (from web/server):

1. Install server dependencies:
```powershell
npm install
```

2. Build and serve the application:
```powershell
npm run serve
```

This will:
- Build the React frontend
- Copy built files to `server/public/`
- Start the unified server on http://localhost:5173

### Manual steps:

1. Install server dependencies:
```powershell
npm install
```

2. Build frontend (from web/ directory):
```powershell
cd ..
npm run build
```

3. Copy built files to server (Windows):
```powershell
xcopy /E /I /Y dist server\public
```

4. Start server:
```powershell
cd server
npm start
```

## API Endpoints

All API endpoints are prefixed with `/api`:
- `GET /api/health` - Health check
- `GET /api/receipts` - List receipts
- `GET /api/receipts/:id` - Get receipt details
- `GET /api/labtests` - List lab tests
- `GET /api/labtests/:id` - Get lab test details
- `GET /api/reports` - List reports
- `GET /api/reports/:id` - Get report details
- `GET /api/invoices` - List invoices
- `GET /api/invoices/:id` - Get invoice details
- `GET /api/owner/track/:query` - Track samples by ID or AWB

## Notes
- The server reads from SQLite database at `../../data/tracelite.db`
- Frontend routes are handled by React Router (SPA mode)
- Server is currently read-only for safety
