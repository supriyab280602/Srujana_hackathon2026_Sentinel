import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.schemas.transaction import TransactionRead, TransactionCreate
from app.schemas.alert import AlertRead, RiskFactor
from app.schemas.network import AccountNetworkResponse, NetworkNode, NetworkEdge
from app.schemas.investigation import InvestigationReviewRequest, InvestigationReviewResponse


class BaseRepository:
    """
    Persistence abstraction for Sentinel.
    Allows local development using in-memory / fixture storage
    and seamlessly swapping in PostgreSQL/Supabase clients later.
    """

    def __init__(self):
        # Initial memory store for local development
        self._transactions: Dict[str, TransactionRead] = {
            "TXN-99410": TransactionRead(
                id="TXN-99410",
                sender_account_id="ACC-7749",
                receiver_account_id="ACC-4410",
                amount=125000.0,
                currency="USD",
                channel="wire",
                timestamp=datetime.utcnow(),
                location_country="US",
            ),
            "TXN-99388": TransactionRead(
                id="TXN-99388",
                sender_account_id="ACC-7749",
                receiver_account_id="ACC-5128",
                amount=95000.0,
                currency="USD",
                channel="wire",
                timestamp=datetime.utcnow(),
                location_country="US",
            ),
        }
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
                created_at=datetime.utcnow(),
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
                created_at=datetime.utcnow(),
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

        self._reviews: List[InvestigationReviewResponse] = []

    def get_all_alerts(self) -> List[AlertRead]:
        return list(self._alerts.values())

    def get_alert_by_id(self, alert_id: str) -> Optional[AlertRead]:
        return self._alerts.get(alert_id)

    def get_account_network(self, account_id: str) -> AccountNetworkResponse:
        # Returns graph topology with clear node and edge boundaries
        return AccountNetworkResponse(
            account_id=account_id,
            max_hops=3,
            total_volume=485000.0,
            nodes=[
                NetworkNode(id=account_id, label=f"{account_id} (Target)", type="account", riskScore=94.0, balance=24500.0),
                NetworkNode(id="ACC-4410", label="ACC-4410 (Mule 1)", type="flagged_mule", riskScore=82.0, balance=1200.0),
                NetworkNode(id="ACC-5128", label="ACC-5128 (Mule 2)", type="flagged_mule", riskScore=79.0, balance=400.0),
                NetworkNode(id="ACC-9901", label="ACC-9901 (Offshore Shell)", type="external_entity", riskScore=88.0, balance=98000.0),
                NetworkNode(id="ACC-1102", label="ACC-1102 (Vendor)", type="account", riskScore=12.0, balance=154000.0),
            ],
            edges=[
                NetworkEdge(id="e1", source=account_id, target="ACC-4410", amount=125000.0, timestamp="14:10:02", suspicious=True, hopIndex=1),
                NetworkEdge(id="e2", source=account_id, target="ACC-5128", amount=95000.0, timestamp="14:11:15", suspicious=True, hopIndex=1),
                NetworkEdge(id="e3", source="ACC-4410", target="ACC-9901", amount=124200.0, timestamp="14:12:40", suspicious=True, hopIndex=2),
                NetworkEdge(id="e4", source="ACC-5128", target="ACC-9901", amount=94100.0, timestamp="14:13:02", suspicious=True, hopIndex=2),
                NetworkEdge(id="e5", source=account_id, target="ACC-1102", amount=1500.0, timestamp="14:05:00", suspicious=False, hopIndex=1),
            ]
        )

    def add_review(self, review: InvestigationReviewRequest) -> InvestigationReviewResponse:
        record = InvestigationReviewResponse(
            review_id=f"REV-{len(self._reviews) + 1:04d}",
            alert_id=review.alert_id,
            decision=review.decision,
            notes=review.notes,
            investigator_id=review.investigator_id,
            status="recorded",
            created_at=datetime.utcnow()
        )
        self._reviews.append(record)
        if review.alert_id in self._alerts:
            self._alerts[review.alert_id].status = "resolved" if review.decision == "false_positive" else "under_review"
        return record

    def add_transaction(self, txn: TransactionCreate, txn_id: Optional[str] = None) -> TransactionRead:
        """
        Persists a transaction into the repository.
        Enforces unique transaction ID constraints for durable idempotency.
        """
        tid = txn_id or f"TXN-{uuid.uuid4().hex[:8].upper()}"
        if tid in self._transactions:
            raise ValueError(f"Transaction with ID '{tid}' already exists in persistence store.")

        record = TransactionRead(
            id=tid,
            sender_account_id=txn.sender_account_id,
            receiver_account_id=txn.receiver_account_id,
            amount=txn.amount,
            currency=txn.currency,
            channel=txn.channel,
            timestamp=txn.timestamp,
            location_country=txn.location_country,
            ip_address=txn.ip_address,
            device_id=txn.device_id,
        )
        self._transactions[tid] = record
        return record

    def get_transaction_by_id(self, txn_id: str) -> Optional[TransactionRead]:
        return self._transactions.get(txn_id)

    def get_account_transactions(self, account_id: str) -> List[TransactionRead]:
        return [
            t for t in self._transactions.values()
            if t.sender_account_id == account_id or t.receiver_account_id == account_id
        ]

    def add_alert(self, alert: AlertRead) -> AlertRead:
        self._alerts[alert.id] = alert
        return alert


# Global singleton instance
repo = BaseRepository()
