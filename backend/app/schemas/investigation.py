from datetime import datetime, timezone
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class InvestigationReviewRequest(BaseModel):
    alert_id: str = Field(..., min_length=1, description="Target alert ID being reviewed")
    decision: Literal["confirm_fraud", "false_positive", "needs_escalation"] = Field(
        ..., description="Human investigator verdict"
    )
    notes: str = Field(..., min_length=1, description="Adjudication rationale and comments")
    investigator_id: Optional[str] = Field(
        None, description="Client-provided investigator identifier (overridden by authenticated token subject)"
    )
    tags: List[str] = Field(default_factory=list, description="Categorical tags for pattern tracking")


class InvestigationReviewResponse(BaseModel):
    review_id: str = Field(..., description="Unique investigation log ID")
    alert_id: str = Field(..., description="Target alert ID")
    decision: Literal["confirm_fraud", "false_positive", "needs_escalation"] = Field(..., description="Recorded verdict")
    status: str = Field(default="recorded", description="Status of adjudication entry")
    notes: str = Field(..., description="Investigator notes")
    investigator_id: str = Field(..., description="Investigator identifier")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), description="Adjudication timestamp"
    )
