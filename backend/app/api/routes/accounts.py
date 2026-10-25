from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, Query
from app.core.auth import VerifiedUser, verified_user
from app.schemas.transaction import TransactionRead
from app.schemas.network import AccountNetworkResponse
from app.services.transaction_service import transaction_service
from app.services.graph_service import graph_service

router = APIRouter(prefix="/accounts", tags=["Account Intelligence & Topology"])


@router.get("/{account_id}/transactions", response_model=List[TransactionRead])
def get_account_transactions(
    account_id: str,
    _user: Annotated[VerifiedUser, Depends(verified_user)],
):
    """
    Retrieve historical and recent transactions for an account.
    Queries the transaction repository ledger.
    Requires a valid Supabase bearer token.
    """
    return transaction_service.get_account_transactions(account_id)


@router.get("/{account_id}/network", response_model=AccountNetworkResponse)
def get_account_network(
    account_id: str,
    _user: Annotated[VerifiedUser, Depends(verified_user)],
    max_hops: int = Query(3, ge=1, le=5, description="Graph traversal hop limit"),
    as_of_step: Optional[int] = Query(
        None, ge=1, description="Optional step filter for zero-lookahead chronological graph replay"
    ),
):
    """
    Retrieve multi-hop transaction relationship graph for an account.
    Integrates NetworkX cycle detection and embedded chronological replay support.
    Requires a valid Supabase bearer token.
    """
    return graph_service.get_account_network(account_id, max_hops=max_hops, as_of_step=as_of_step)

