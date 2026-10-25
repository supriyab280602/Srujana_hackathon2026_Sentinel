from typing import List
from datetime import datetime
from fastapi import APIRouter
from app.schemas.transaction import TransactionRead
from app.schemas.network import AccountNetworkResponse
from app.services.graph_service import graph_service

router = APIRouter(prefix="/accounts", tags=["Account Intelligence & Topology"])


@router.get("/{account_id}/transactions", response_model=List[TransactionRead])
def get_account_transactions(account_id: str):
    """
    Retrieve historical and recent transactions for an account.
    """
    # Baseline transactions scaffold
    return [
        TransactionRead(
            id="TXN-99410",
            sender_account_id=account_id,
            receiver_account_id="ACC-4410",
            amount=125000.0,
            currency="USD",
            channel="wire",
            timestamp=datetime.utcnow(),
            location_country="US",
        ),
        TransactionRead(
            id="TXN-99388",
            sender_account_id=account_id,
            receiver_account_id="ACC-5128",
            amount=95000.0,
            currency="USD",
            channel="wire",
            timestamp=datetime.utcnow(),
            location_country="US",
        ),
    ]


@router.get("/{account_id}")
def get_account_profile(account_id: str):
    """
    Retrieve entity identity profile, KYC tier, and behavioral fingerprint for an account.
    """
    return {
        "id": account_id,
        "account_holder": f"Entity {account_id}",
        "account_type": "business",
        "status": "under_investigation" if account_id == "ACC-7749" else "active",
        "risk_tier": "critical" if account_id == "ACC-7749" else "medium",
        "risk_score": 94 if account_id == "ACC-7749" else 42,
        "balance": 24500.0 if account_id == "ACC-7749" else 75000.0,
        "currency": "USD",
        "created_at": "2025-08-14",
        "kyc_status": "verified",
        "location": "Wilmington, DE, USA",
        "ip_reputation": "datacenter_proxy" if account_id == "ACC-7749" else "clean",
        "device_count": 4 if account_id == "ACC-7749" else 2,
    }


@router.get("/{account_id}/network", response_model=AccountNetworkResponse)
def get_account_network(account_id: str):
    """
    Retrieve multi-hop transaction relationship graph for an account.
    Integrates with NetworkX backend graph analysis.
    """
    return graph_service.get_account_network(account_id)

