from pydantic import BaseModel
import os

class Settings(BaseModel):
    APP_ENV: str = os.getenv("APP_ENV", "dev")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174")

settings = Settings()