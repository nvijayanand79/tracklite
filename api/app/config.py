from pydantic import BaseModel
import os

class Settings(BaseModel):
    APP_ENV: str = os.getenv("APP_ENV", "dev")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))

    # CORS configuration - more flexible for public URLs
    CORS_ORIGINS_STR: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174,https://*.github.dev,https://*.github.com,https://*.vscode.dev")

    @property
    def CORS_ORIGINS(self) -> list[str]:
        """Parse CORS origins, allowing wildcards for GitHub Codespaces"""
        origins = []
        for origin in self.CORS_ORIGINS_STR.split(","):
            origin = origin.strip()
            if "*" in origin:
                # For wildcard patterns, we'll handle them in the CORS middleware
                origins.append(origin)
            else:
                origins.append(origin)
        return origins

settings = Settings()