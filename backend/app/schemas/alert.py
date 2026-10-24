from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, ConfigDict


class RiskFactor(BaseModel):
    name: str = Field(..., description="Feature or risk rule identifier")
    weight: float = Field(..., ge=0.0, le=1.0, description="Relative feature contribution weight")
    contribution: float = Field(..., description="Absolute points added to composite risk score")
    description: str = Field(..., description="Human-readable explanation of risk attribution")


class AlertRead(BaseModel):
    id: str = Field(..., description="Unique alert identifier")
    transaction_id: str = Field(..., description="Associated triggering transaction ID")
    account_id: str = Field(..., description="Target account under surveillance")
    severity: Literal["low", "medium", "high", "critical"] = Field(..., description="Categorical severity")
    risk_score: float = Field(..., ge=0, le=100, description="Composite risk index score [0-100]")
    status: Literal["open", "under_review", "escalated", "dismissed", "resolved"] = Field(
        default="open", description="Workflow adjudication state"
    )
    detection_rule: str = Field(..., description="Primary rule or model detector that triggered the alert")
    title: str = Field(..., description="Brief alert headline")
    summary: str = Field(..., description="Detailed contextual narrative of the suspicious pattern")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Alert generation timestamp")
    factors: List[RiskFactor] = Field(default_factory=list, description="Explainable feature breakdown")
    model_config = ConfigDict(from_attributes=True)


class AlertFilter(BaseModel):
    severity: Optional[str] = None
    account_id: Optional[str] = None
    status: Optional[str] = None
    min_score: Optional[float] = None
