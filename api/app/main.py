from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import health, owner, receipts, auth, labtests, reports, invoices
from .db import init_db, close_db

app = FastAPI(title="TraceLite API", version="0.1.0")

# Use FastAPI's built-in CORS middleware - allow all for now
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Simplified for demo
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(owner.router, prefix="/owner")
app.include_router(receipts.router)
app.include_router(labtests.router)
app.include_router(reports.router)
app.include_router(invoices.router)

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    # Import models to ensure they're registered with SQLAlchemy
    from .models import receipt, labtest, report, invoice  # noqa
    await init_db()

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connections on shutdown"""
    await close_db()