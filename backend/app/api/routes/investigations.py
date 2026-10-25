from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
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
    if investigation_id != payload.alert_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Mismatched investigation path ID '{investigation_id}' and payload "
                f"alert_id '{payload.alert_id}'"
            ),
        )

    review = alert_service.submit_review(payload, reviewer_id=user.sub)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target alert '{payload.alert_id}' for investigation '{investigation_id}' not found",
        )
    return review

