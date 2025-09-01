from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from .config import settings
from .routers import health, owner, receipts, auth, labtests, reports, invoices
from .db import init_db, close_db

app = FastAPI(title="TraceLite API", version="0.1.0")

# Custom CORS middleware to handle wildcard origins
class FlexibleCORSMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, allowed_origins):
        super().__init__(app)
        self.allowed_origins = allowed_origins

    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin", "")

        # Check if origin matches any allowed pattern
        allowed = self._is_origin_allowed(origin)

        response = await call_next(request)

        if allowed:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "*"

        return response

    def _is_origin_allowed(self, origin: str) -> bool:
        """Check if origin matches any allowed pattern"""
        if not origin:
            return True  # Allow requests without origin (like mobile apps)

        for allowed_origin in self.allowed_origins:
            if "*" in allowed_origin:
                # Handle wildcard patterns
                pattern = allowed_origin.replace("*", ".*")
                import re
                if re.match(pattern, origin):
                    return True
            elif allowed_origin == origin:
                return True
        return False

# Use flexible CORS middleware
app.add_middleware(FlexibleCORSMiddleware, allowed_origins=settings.CORS_ORIGINS)

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