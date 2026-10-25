import os
import json
from typing import List
from pydantic import BaseModel, Field


class Settings(BaseModel):
    PROJECT_NAME: str = Field(default_factory=lambda: os.getenv("PROJECT_NAME", "Sentinel Fraud Intelligence Platform"))
    ENVIRONMENT: str = Field(default_factory=lambda: os.getenv("ENVIRONMENT", "development"))
    DEBUG: bool = Field(default_factory=lambda: os.getenv("DEBUG", "true").lower() in ("true", "1", "yes"))
    PORT: int = Field(default_factory=lambda: int(os.getenv("PORT", "8000")))
    HOST: str = Field(default_factory=lambda: os.getenv("HOST", "0.0.0.0"))

    # CORS settings
    CORS_ORIGINS: List[str] = Field(default_factory=lambda: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ])

    # Supabase settings (Auth & future persistence)
    DATABASE_URL: str | None = Field(default_factory=lambda: os.getenv("DATABASE_URL"))
    SUPABASE_URL: str | None = Field(default_factory=lambda: os.getenv("SUPABASE_URL"))
    SUPABASE_KEY: str | None = Field(default_factory=lambda: os.getenv("SUPABASE_KEY"))

    @property
    def normalized_supabase_url(self) -> str | None:
        """Return SUPABASE_URL with trailing slashes stripped, or None if unconfigured."""
        if not self.SUPABASE_URL:
            return None
        stripped = self.SUPABASE_URL.strip().rstrip("/")
        return stripped if stripped else None


settings = Settings()
