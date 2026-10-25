from datetime import datetime, timezone
from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
def get_health():
    """
    Health check endpoint for Sentinel backend service.
    Returns operational status and timestamp.
    """
    return {
        "status": "ok",
        "service": "sentinel-core",
        "version": "0.1.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
