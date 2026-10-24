from datetime import datetime
from app.schemas.scoring import ScoreRequest, ScoreResponse
from app.schemas.alert import RiskFactor


class ScoringService:
    """
    Coordinates transaction risk scoring.
    Acts as the bridge between FastAPI endpoints and the ML scoring module.
    Clearly marks heuristic vs trained model state.
    """

    def score_transaction(self, request: ScoreRequest) -> ScoreResponse:
        txn = request.transaction

        # Deterministic rule-based baseline logic for Phase 1 scaffold
        factors = []
        base_score = 15.0

        if txn.amount > 10000.0:
            factors.append(
                RiskFactor(
                    name="High Single-Transaction Volume",
                    weight=0.40,
                    contribution=25.0,
                    description=f"Transaction volume ${txn.amount:,.2f} exceeds standard baseline",
                )
            )
            base_score += 25.0

        if txn.channel == "crypto":
            factors.append(
                RiskFactor(
                    name="High-Risk Channel",
                    weight=0.30,
                    contribution=20.0,
                    description="Crypto transfer rail flagged for heightened monitoring",
                )
            )
            base_score += 20.0

        is_alert = base_score >= 50.0
        severity = "high" if base_score >= 70.0 else ("medium" if is_alert else "low")

        return ScoreResponse(
            transaction_id=None,
            risk_score=min(base_score, 100.0),
            score_type="rule_baseline_v0_scaffold",
            is_alert_triggered=is_alert,
            suggested_severity=severity,
            factors=factors,
            confidence=0.75,
            scored_at=datetime.utcnow().isoformat(),
        )


scoring_service = ScoringService()
