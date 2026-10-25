import logging
from datetime import datetime, timezone
from typing import Dict, Any, List
from app.schemas.scoring import ScoreRequest, ScoreResponse
from app.schemas.alert import RiskFactor
from app.services.transaction_service import transaction_service
from app.services.alert_service import alert_service

logger = logging.getLogger(__name__)

# Safe import of Member 1's ML inference interface
try:
    from ml.scoring.interface import sentinel_scorer
    ML_AVAILABLE = True
except ImportError:
    sentinel_scorer = None
    ML_AVAILABLE = False


class ScoringService:
    """
    Coordinates transaction risk scoring.
    Acts as the bridge between FastAPI endpoints, account historical context,
    and Member 1's ML scoring module (SentinelScorer).
    Maintains clean boundaries and graceful fallback.
    """

    def score_transaction(self, request: ScoreRequest) -> ScoreResponse:
        txn = request.transaction
        txn_data = txn.model_dump()
        if isinstance(txn_data.get("timestamp"), datetime):
            txn_data["timestamp"] = txn_data["timestamp"].isoformat()

        # Query account historical context for zero-lookahead feature extraction
        historical_context = transaction_service.get_account_activity_context(
            account_id=txn.sender_account_id,
            as_of_timestamp=txn.timestamp,
            lookback_days=request.account_history_lookback_days,
        )

        ml_result = None
        if ML_AVAILABLE and sentinel_scorer is not None:
            try:
                ml_result = sentinel_scorer.score_transaction(
                    transaction_data=txn_data,
                    historical_context=historical_context,
                )
            except Exception as e:
                logger.warning(f"ML scoring inference failed, falling back to heuristic: {e}")

        if ml_result:
            risk_score = float(ml_result.get("risk_score", 0.0))
            score_type = str(ml_result.get("score_type", "ml_sentinel_scorer"))
            model_version = ml_result.get("model_version")
            is_placeholder = ml_result.get("is_placeholder", False)
            confidence = float(ml_result.get("confidence", 0.8))

            raw_factors = ml_result.get("factors", [])
            factors = [
                RiskFactor(
                    name=f["name"],
                    weight=float(f.get("weight", 0.1)),
                    contribution=float(f.get("contribution", 0.0)),
                    description=f.get("description", ""),
                )
                for f in raw_factors
            ]
        else:
            # Deterministic heuristic fallback
            risk_score, factors = self._calculate_heuristic_baseline(txn, historical_context)
            score_type = "rule_baseline_v0_fallback"
            model_version = "v0.1-heuristic"
            is_placeholder = True
            confidence = 0.65

        is_alert = risk_score >= 50.0
        if risk_score >= 85.0:
            severity = "critical"
        elif risk_score >= 70.0:
            severity = "high"
        elif is_alert:
            severity = "medium"
        else:
            severity = "low"

        # Persist transaction exactly once
        persisted_txn = transaction_service.record_transaction(txn)

        # If alert threshold triggered, create and persist corresponding alert exactly once
        if is_alert:
            if factors:
                rule_slug = factors[0].name.upper().replace(" ", "_").replace("-", "_")
                detection_rule = f"{score_type.upper()}:{rule_slug}"
                title = f"High-Risk Transaction: {factors[0].name}"
                summary = (
                    f"Transaction of ${txn.amount:,.2f} via {txn.channel} rail flagged with risk score "
                    f"{risk_score:.1f} ({severity.upper()}). {factors[0].description}"
                )
            else:
                detection_rule = f"{score_type.upper()}:THRESHOLD_EXCEEDED"
                title = f"Elevated Transaction Risk ({severity.upper()})"
                summary = (
                    f"Transaction of ${txn.amount:,.2f} via {txn.channel} rail triggered alert threshold "
                    f"with risk score {risk_score:.1f}."
                )

            alert_service.create_alert(
                transaction_id=persisted_txn.id,
                account_id=txn.sender_account_id,
                severity=severity,
                risk_score=min(round(risk_score, 2), 100.0),
                detection_rule=detection_rule,
                title=title,
                summary=summary,
                factors=factors,
                created_at=datetime.now(timezone.utc),
            )

        return ScoreResponse(
            transaction_id=persisted_txn.id,
            risk_score=min(round(risk_score, 2), 100.0),
            score_type=score_type,
            model_version=model_version,
            is_placeholder=is_placeholder,
            is_alert_triggered=is_alert,
            suggested_severity=severity,
            factors=factors,
            confidence=confidence,
            scored_at=datetime.now(timezone.utc).isoformat(),
        )

    def _calculate_heuristic_baseline(self, txn, history: Dict[str, Any]) -> tuple[float, List[RiskFactor]]:
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

        if history.get("velocity_1h_count", 0) > 3:
            factors.append(
                RiskFactor(
                    name="Recent Velocity Spike",
                    weight=0.30,
                    contribution=15.0,
                    description=f"Account initiated {history.get('velocity_1h_count')} outflows recently",
                )
            )
            base_score += 15.0

        return base_score, factors


scoring_service = ScoringService()
