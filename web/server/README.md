This is a lightweight Node.js Express server that serves as a local API proxy to the existing SQLite database used by the project.

Purpose:
- Avoid CORS by co-hosting API under the same origin as the frontend during development
- Provide a small, maintainable JS API for teams more comfortable with Node.js

Quick start (from web/server):

1. Install dependencies

```powershell
npm install
```

2. Start server

```powershell
npm run start
```

The server listens by default on port 5173 and exposes endpoints prefixed with `/api` (for example, `/api/reports`, `/api/labtests`, `/api/receipts`, `/api/invoices`, `/api/owner/track/:query`).

Notes:
- The server reads the SQLite database from `data/tracelite.db` at the repository root. Ensure this file exists and is not locked by other processes.
- This is intentionally read-only and minimal. If you need write endpoints, we can add them with proper transaction handling and backups.
