from fastapi import APIRouter, HTTPException
from app.schemas.investigation import InvestigationReviewRequest, InvestigationReviewResponse
from app.services.alert_service import alert_service

router = APIRouter(prefix="/investigations", tags=["Human-in-the-Loop Investigation"])


@router.post("/{investigation_id}/review", response_model=InvestigationReviewResponse)
def submit_investigation_review(
    investigation_id: str,
    payload: InvestigationReviewRequest,
):
    """
    Submit an investigator adjudication decision and structured feedback for an alert/case.
    Closes the human-in-the-loop validation loop.
    """
    review = alert_service.submit_review(payload)
    return review
