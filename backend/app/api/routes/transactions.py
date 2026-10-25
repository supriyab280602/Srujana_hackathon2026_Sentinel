from fastapi import APIRouter
from app.schemas.scoring import ScoreRequest, ScoreResponse
from app.services.scoring_service import scoring_service

router = APIRouter(prefix="/transactions", tags=["Transaction Risk Scoring"])


@router.get("/")
def list_transactions():
    """
    Retrieve global transaction feed for surveillance explorer.
    """
    return [
        {
            "id": "TXN-99410",
            "sender_account_id": "ACC-7749",
            "receiver_account_id": "ACC-4410",
            "amount": 125000.0,
            "currency": "USD",
            "timestamp": "2026-10-24 14:10:02",
            "channel": "wire",
            "risk_score": 94,
            "risk_severity": "critical",
            "status": "flagged",
            "flagged_rule": "CROSS_ACCOUNT_FANOUT_BURST"
        },
        {
            "id": "TXN-99388",
            "sender_account_id": "ACC-7749",
            "receiver_account_id": "ACC-5128",
            "amount": 95000.0,
            "currency": "USD",
            "timestamp": "2026-10-24 14:11:15",
            "channel": "wire",
            "risk_score": 89,
            "risk_severity": "critical",
            "status": "flagged",
            "flagged_rule": "RAPID_DISBURSEMENT_BURST"
        },
        {
            "id": "TXN-99044",
            "sender_account_id": "ACC-7749",
            "receiver_account_id": "ACC-1102",
            "amount": 1500.0,
            "currency": "USD",
            "timestamp": "2026-10-24 14:05:00",
            "channel": "ach",
            "risk_score": 18,
            "risk_severity": "low",
            "status": "cleared"
        }
    ]


@router.post("/score", response_model=ScoreResponse)
def score_transaction(payload: ScoreRequest):
    """
    Score an incoming transaction against behavioral and topological risk indicators.
    Returns composite risk index and explainable factor attributions.
    """
    result = scoring_service.score_transaction(payload)
    return result

