from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class InvestigationReviewRequest(BaseModel):
    alert_id: str = Field(..., description="Target alert ID being reviewed")
    decision: Literal["confirm_fraud", "false_positive", "needs_escalation"] = Field(
        ..., description="Human investigator verdict"
    )
    notes: str = Field(..., min_length=1, description="Adjudication rationale and comments")
    investigator_id: str = Field(..., description="Investigator username or badge identifier")
    tags: List[str] = Field(default_factory=list, description="Categorical tags for pattern tracking")


class InvestigationReviewResponse(BaseModel):
    review_id: str = Field(..., description="Unique investigation log ID")
    alert_id: str = Field(..., description="Target alert ID")
    decision: str = Field(..., description="Recorded verdict")
    status: str = Field(default="recorded", description="Status of adjudication entry")
    notes: str = Field(...)
    investigator_id: str = Field(...)
    created_at: datetime = Field(default_factory=datetime.utcnow)
