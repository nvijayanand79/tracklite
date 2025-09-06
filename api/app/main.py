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
    """Initialize database and demo data on startup"""
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    # Import models to ensure they're registered with SQLAlchemy
    from .models import receipt, labtest, report, invoice  # noqa
    await init_db()
    
    # Initialize demo data if needed
    try:
        logger.info("🚀 Initializing demo data...")
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.dirname(__file__)))
        
        # Import and run startup initialization
        from startup_init import check_and_initialize
        await check_and_initialize()
        logger.info("✅ Demo data initialization completed")
    except Exception as e:
        logger.error(f"⚠️  Demo data initialization failed: {e}")
        # Continue startup even if demo data fails
        pass

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connections on shutdown"""
    await close_db()