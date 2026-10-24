from fastapi import APIRouter
from app.schemas.scoring import ScoreRequest, ScoreResponse
from app.services.scoring_service import scoring_service

router = APIRouter(prefix="/transactions", tags=["Transaction Risk Scoring"])


@router.post("/score", response_model=ScoreResponse)
def score_transaction(payload: ScoreRequest):
    """
    Score an incoming transaction against behavioral and topological risk indicators.
    Returns composite risk index and explainable factor attributions.
    """
    result = scoring_service.score_transaction(payload)
    return result
