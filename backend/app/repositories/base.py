from typing import List, Optional, Dict
from datetime import datetime, timezone, timedelta
import uuid
from app.schemas.alert import AlertRead, RiskFactor
from app.schemas.transaction import TransactionRead, TransactionCreate
from app.schemas.network import AccountNetworkResponse, NetworkNode, NetworkEdge
from app.schemas.investigation import InvestigationReviewRequest, InvestigationReviewResponse


class BaseRepository:
    """
    Persistence abstraction for Sentinel.
    Allows local development using in-memory fixture storage
    and seamlessly swapping in PostgreSQL/Supabase clients later.
    """

    def __init__(self):
        now = datetime.now(timezone.utc)

        # In-memory alert store
        self._alerts: Dict[str, AlertRead] = {
            "ALT-8902": AlertRead(
                id="ALT-8902",
                transaction_id="TXN-99410",
                account_id="ACC-7749",
                severity="critical",
                risk_score=94.0,
                status="open",
                detection_rule="CROSS_ACCOUNT_FANOUT_BURST",
                title="Rapid High-Velocity Outflows to Unverified Accounts",
                summary="Account executed consecutive wire transfers exceeding typical volume by 1,420%.",
                created_at=now,
                factors=[
                    RiskFactor(
                        name="Velocity Delta",
                        weight=0.45,
                        contribution=42.3,
                        description="12 standard deviations above historical hourly norm",
                    ),
                    RiskFactor(
                        name="Geographic Mismatch",
                        weight=0.25,
                        contribution=23.5,
                        description="IP originates from high-risk jurisdiction proxy",
                    ),
                    RiskFactor(
                        name="Multi-Hop Fanout",
                        weight=0.30,
                        contribution=28.2,
                        description="Funds disbursed to newly registered mule accounts",
                    ),
                ],
            ),
            "ALT-8899": AlertRead(
                id="ALT-8899",
                transaction_id="TXN-99388",
                account_id="ACC-3120",
                severity="high",
                risk_score=78.0,
                status="under_review",
                detection_rule="CIRCULAR_ROUTING_SUSPECT",
                title="Potential Layering Loop Detected",
                summary="Funds cycled through 3 intermediary accounts before returning to origin entity.",
                created_at=now,
                factors=[
                    RiskFactor(
                        name="Graph Cycle Ratio",
                        weight=0.50,
                        contribution=39.0,
                        description="Closed loop transaction path detected in 2-hop radius",
                    ),
                    RiskFactor(
                        name="Rapid Turnover",
                        weight=0.30,
                        contribution=23.4,
                        description="Holding period less than 45 seconds per hop",
                    ),
                ],
            ),
        }
        self._initial_alerts = dict(self._alerts)

        # In-memory transaction store (seeded with realistic past timestamps within 1 hour)
        self._transactions: Dict[str, TransactionRead] = {
            "TXN-99320": TransactionRead(
                id="TXN-99320",
                sender_account_id="ACC-3120",
                receiver_account_id="ACC-4410",
                amount=88000.0,
                currency="USD",
                channel="crypto",
                timestamp=now - timedelta(minutes=25),
            ),
            "TXN-99388": TransactionRead(
                id="TXN-99388",
                sender_account_id="ACC-7749",
                receiver_account_id="ACC-5128",
                amount=95000.0,
                currency="USD",
                channel="wire",
                timestamp=now - timedelta(minutes=20),
                location_country="US",
                ip_address="192.168.1.50",
            ),
            "TXN-99410": TransactionRead(
                id="TXN-99410",
                sender_account_id="ACC-7749",
                receiver_account_id="ACC-4410",
                amount=125000.0,
                currency="USD",
                channel="wire",
                timestamp=now - timedelta(minutes=15),
                location_country="US",
                ip_address="192.168.1.50",
            ),
            "TXN-99350": TransactionRead(
                id="TXN-99350",
                sender_account_id="ACC-4410",
                receiver_account_id="ACC-9901",
                amount=124200.0,
                currency="USD",
                channel="wire",
                timestamp=now - timedelta(minutes=10),
                location_country="KY",
            ),
        }
        self._initial_transactions = dict(self._transactions)
        self._reviews: List[InvestigationReviewResponse] = []

    # ---------------- Alert Operations ---------------- #

    def get_all_alerts(self, severity: Optional[str] = None) -> List[AlertRead]:
        alerts = list(self._alerts.values())
        if severity:
            alerts = [a for a in alerts if a.severity.lower() == severity.lower()]
        return alerts

    def get_alert_by_id(self, alert_id: str) -> Optional[AlertRead]:
        return self._alerts.get(alert_id)

    def add_alert(self, alert: AlertRead) -> AlertRead:
        self._alerts[alert.id] = alert
        return alert

    def reset_alerts(self, alerts: Optional[Dict[str, AlertRead]] = None) -> None:
        """Reset or override alert repository state for deterministic testing."""
        if alerts is not None:
            self._alerts = dict(alerts)
        else:
            self._alerts = dict(getattr(self, "_initial_alerts", {}))

    # ---------------- Transaction Operations ---------------- #

    def get_transactions_by_account(self, account_id: str) -> List[TransactionRead]:
        return [
            t for t in self._transactions.values()
            if t.sender_account_id == account_id or t.receiver_account_id == account_id
        ]

    def get_transaction_by_id(self, transaction_id: str) -> Optional[TransactionRead]:
        return self._transactions.get(transaction_id)

    def add_transaction(self, transaction: TransactionCreate) -> TransactionRead:
        txn_id = f"TXN-{uuid.uuid4().hex[:8].upper()}"
        record = TransactionRead(
            id=txn_id,
            **transaction.model_dump()
        )
        self._transactions[txn_id] = record
        return record

    def reset_transactions(self, transactions: Optional[Dict[str, TransactionRead]] = None) -> None:
        """Reset or override transaction repository state for deterministic testing."""
        if transactions is not None:
            self._transactions = dict(transactions)
        else:
            self._transactions = dict(getattr(self, "_initial_transactions", {}))

    def get_all_transactions(self) -> List[TransactionRead]:
        return list(self._transactions.values())

    # ---------------- Graph Network Operations ---------------- #

    def get_account_network(
        self, account_id: str, max_hops: int = 3, as_of_step: Optional[int] = None
    ) -> AccountNetworkResponse:
        """
        Returns graph topology with nodes and edges derived from real transactions.
        Delegates to GraphService to maintain clean boundaries between persistence and graph intelligence.
        """
        from app.services.graph_service import graph_service
        return graph_service.get_account_network(account_id, max_hops=max_hops, as_of_step=as_of_step)

    # ---------------- Investigation Review Operations ---------------- #

    def add_review(
        self,
        review: InvestigationReviewRequest,
        reviewer_id: Optional[str] = None,
    ) -> Optional[InvestigationReviewResponse]:
        if review.alert_id not in self._alerts:
            return None

        # Prioritize verified authenticated identity (JWT sub) over client input
        effective_investigator = reviewer_id if reviewer_id is not None else (review.investigator_id or "unassigned")

        record = InvestigationReviewResponse(
            review_id=f"REV-{len(self._reviews) + 1:04d}",
            alert_id=review.alert_id,
            decision=review.decision,
            notes=review.notes,
            investigator_id=effective_investigator,
            status="recorded",
            created_at=datetime.now(timezone.utc)
        )
        self._reviews.append(record)

        target_alert = self._alerts[review.alert_id]
        if review.decision == "confirm_fraud":
            target_alert.status = "escalated"
        elif review.decision == "false_positive":
            target_alert.status = "dismissed"
        elif review.decision == "needs_escalation":
            target_alert.status = "under_review"

        return record


# Global singleton instance
repo = BaseRepository()
