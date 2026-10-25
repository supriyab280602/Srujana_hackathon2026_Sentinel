from typing import List, Optional, Literal
from datetime import datetime, timezone
import uuid
from app.schemas.alert import AlertRead, RiskFactor
from app.schemas.investigation import InvestigationReviewRequest, InvestigationReviewResponse
from app.repositories.base import repo


class AlertService:
    """
    Coordinates fraud alert lifecycle, investigator retrieval, and adjudication feedback.
    """

    def list_alerts(self, severity: Optional[str] = None) -> List[AlertRead]:
        return repo.get_all_alerts(severity=severity)

    def get_alert(self, alert_id: str) -> Optional[AlertRead]:
        return repo.get_alert_by_id(alert_id)

    def add_alert(self, alert: AlertRead) -> AlertRead:
        return repo.add_alert(alert)

    def create_alert(
        self,
        transaction_id: str,
        account_id: str,
        severity: Literal["low", "medium", "high", "critical"],
        risk_score: float,
        detection_rule: str,
        title: str,
        summary: str,
        factors: Optional[List[RiskFactor]] = None,
        created_at: Optional[datetime] = None,
    ) -> AlertRead:
        alert_id = f"ALT-{uuid.uuid4().hex[:6].upper()}"
        alert = AlertRead(
            id=alert_id,
            transaction_id=transaction_id,
            account_id=account_id,
            severity=severity,
            risk_score=risk_score,
            status="open",
            detection_rule=detection_rule,
            title=title,
            summary=summary,
            created_at=created_at or datetime.now(timezone.utc),
            factors=factors or [],
        )
        return repo.add_alert(alert)

    def submit_review(
        self,
        review: InvestigationReviewRequest,
        reviewer_id: Optional[str] = None,
    ) -> Optional[InvestigationReviewResponse]:
        return repo.add_review(review, reviewer_id=reviewer_id)


alert_service = AlertService()
