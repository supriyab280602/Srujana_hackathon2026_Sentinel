from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Backend project root directory
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_ENV_PATH = BACKEND_DIR / ".env"


def load_backend_env(
    dotenv_path: Path | str | None = None,
    override: bool = False,
) -> bool:
    """
    Load environment variables from backend project directory .env if present.
    By default (override=False), explicitly set environment variables take precedence
    over values defined in .env. Returns True if a file was loaded, False otherwise.
    """
    target = Path(dotenv_path).resolve() if dotenv_path is not None else DEFAULT_ENV_PATH
    if target.is_file():
        loaded = load_dotenv(dotenv_path=target, override=override)
        if loaded:
            logger.debug("Loaded backend environment configuration from %s", target)
        return loaded
    return False


# Auto-load backend/.env without overriding existing environment variables
load_backend_env()


def _parse_cors_origins() -> List[str]:
    val = os.getenv("CORS_ORIGINS")
    if not val:
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    try:
        parsed = json.loads(val)
        if isinstance(parsed, list):
            return parsed
    except Exception:
        pass
    return [orig.strip() for orig in val.split(",") if orig.strip()]


class Settings(BaseModel):
    PROJECT_NAME: str = Field(default_factory=lambda: os.getenv("PROJECT_NAME", "Sentinel Fraud Intelligence Platform"))
    ENVIRONMENT: str = Field(default_factory=lambda: os.getenv("ENVIRONMENT", "development"))
    DEBUG: bool = Field(default_factory=lambda: os.getenv("DEBUG", "true").lower() in ("true", "1", "yes"))
    PORT: int = Field(default_factory=lambda: int(os.getenv("PORT", "8000")))
    HOST: str = Field(default_factory=lambda: os.getenv("HOST", "0.0.0.0"))

    # CORS settings
    CORS_ORIGINS: List[str] = Field(default_factory=_parse_cors_origins)

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

