from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.transaction import TransactionCreate
from app.schemas.alert import RiskFactor


class ScoreRequest(BaseModel):
    transaction: TransactionCreate = Field(..., description="Incoming transaction payload to score")
    account_history_lookback_days: int = Field(
        default=30, ge=1, le=365, description="Historical days used for baseline calculation"
    )
    include_graph_context: bool = Field(
        default=True, description="Whether to include multi-hop graph topology features"
    )


class ScoreResponse(BaseModel):
    transaction_id: Optional[str] = Field(None, description="Transaction ID if persisted")
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Evaluated composite risk score")
    score_type: str = Field(
        default="heuristic_baseline_v0",
        description="Version/identifier of scoring pipeline (e.g., heuristic, ensemble, gnn)"
    )
    is_alert_triggered: bool = Field(..., description="Whether score exceeds alert trigger threshold")
    suggested_severity: str = Field(..., description="Recommended alert severity tier")
    factors: List[RiskFactor] = Field(default_factory=list, description="Top contributing explainable factors")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model certainty score")
    scored_at: str = Field(..., description="ISO timestamp of scoring event")
