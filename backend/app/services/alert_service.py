from typing import List, Optional
from app.schemas.alert import AlertRead
from app.schemas.investigation import InvestigationReviewRequest, InvestigationReviewResponse
from app.repositories.base import repo


class AlertService:
    def list_alerts(self, severity: Optional[str] = None) -> List[AlertRead]:
        alerts = repo.get_all_alerts()
        if severity:
            alerts = [a for a in alerts if a.severity.lower() == severity.lower()]
        return alerts

    def get_alert(self, alert_id: str) -> Optional[AlertRead]:
        return repo.get_alert_by_id(alert_id)

    def submit_review(self, review: InvestigationReviewRequest) -> InvestigationReviewResponse:
        return repo.add_review(review)


alert_service = AlertService()
