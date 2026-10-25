from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import VerifiedUser, verified_user
from app.schemas.investigation import InvestigationReviewRequest, InvestigationReviewResponse
from app.services.alert_service import alert_service

router = APIRouter(prefix="/investigations", tags=["Human-in-the-Loop Investigation"])


@router.post("/{investigation_id}/review", response_model=InvestigationReviewResponse)
def submit_investigation_review(
    investigation_id: str,
    payload: InvestigationReviewRequest,
    user: Annotated[VerifiedUser, Depends(verified_user)],
):
    """
    Submit an investigator adjudication decision and structured feedback for an alert/case.
    Updates alert workflow status and closes the human-in-the-loop validation loop.
    Requires a valid Supabase bearer token. Investigator identity is derived from token subject.
    """
    review = alert_service.submit_review(payload, reviewer_id=user.sub)
    if not review:
        raise HTTPException(
            status_code=404,
            detail=f"Target alert '{payload.alert_id}' for investigation '{investigation_id}' not found"
        )
    return review
