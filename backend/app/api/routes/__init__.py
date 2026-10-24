from fastapi import APIRouter
from app.api.routes import health, alerts, accounts, investigations, transactions

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(alerts.router)
api_router.include_router(accounts.router)
api_router.include_router(investigations.router)
api_router.include_router(transactions.router)

__all__ = ["api_router"]
