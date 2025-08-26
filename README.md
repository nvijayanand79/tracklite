# TraceLite Starter (Local Dev)

**What you have:** Minimal React (Vite + TS + Tailwind) + FastAPI skeleton wired for the Owner Track page.
This is intentionally tiny so you can run and verify locally in minutes, then let Copilot fill in features.

## Prereqs
- Node.js 20+, npm 10+
- Python 3.12+
- (Optional) Docker Desktop

## Run locally
### API
```
cd api
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Check http://localhost:8000/healthz

### Web
```
cd web
npm i
npm run dev
```
Open http://localhost:5173 and click **Owner Track**

## Next steps (use Copilot)
Open this folder in VSCode and paste the prompts from the canvas to generate:
- Full routers (receipts, labtests, reports, invoices)
- Models & schemas
- Auth (JWT + Owner OTP)
- DB (SQLite now, Postgres later)
- PWA and more pages