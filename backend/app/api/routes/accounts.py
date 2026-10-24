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


@router.get("/{account_id}/network", response_model=AccountNetworkResponse)
def get_account_network(account_id: str):
    """
    Retrieve multi-hop transaction relationship graph for an account.
    Integrates with NetworkX backend graph analysis.
    """
    return graph_service.get_account_network(account_id)
