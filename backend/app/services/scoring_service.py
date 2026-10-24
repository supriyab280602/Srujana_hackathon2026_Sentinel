import sys
import os
from typing import List
from app.schemas.scoring import ScoreRequest, ScoreResponse
from app.schemas.alert import RiskFactor

# Ensure repository root is on sys.path for importing ml modules
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.scoring.interface import sentinel_scorer

# Attempt to load trained model artifact if present on disk
default_model_path = os.path.join(REPO_ROOT, "ml", "models", "saved", "baseline_rf.joblib")
if os.path.exists(default_model_path) and not sentinel_scorer.model.is_trained:
    try:
        sentinel_scorer.load_model(default_model_path)
    except Exception:
        pass


class ScoringService:
    """
    Coordinates transaction risk scoring for the Sentinel backend.
    Delegates to the ML scoring interface (sentinel_scorer) to obtain
    reproducible scores, confidence, and explainable feature factor breakdowns.
    """

    def score_transaction(self, request: ScoreRequest) -> ScoreResponse:
        txn = request.transaction

        # Prepare payload for ML scoring interface
        txn_dict = {
            "amount": txn.amount,
            "channel": txn.channel,
            "sender_account_id": txn.sender_account_id,
            "receiver_account_id": txn.receiver_account_id,
            "currency": txn.currency,
            "timestamp": txn.timestamp.isoformat() if txn.timestamp else None,
        }

        context = {
            "lookback_days": request.account_history_lookback_days,
            "include_graph": request.include_graph_context,
        }

        # Invoke ML scoring pipeline
        ml_result = sentinel_scorer.score_transaction(
            transaction_data=txn_dict,
            historical_context=context,
        )

        factors = [
            RiskFactor(
                name=f["name"],
                weight=float(f["weight"]),
                contribution=float(f["contribution"]),
                description=str(f["description"]),
            )
            for f in ml_result.get("factors", [])
        ]

        return ScoreResponse(
            transaction_id=ml_result.get("transaction_id"),
            risk_score=ml_result["risk_score"],
            score_type=ml_result["score_type"],
            is_alert_triggered=ml_result["is_alert_triggered"],
            suggested_severity=ml_result["suggested_severity"],
            factors=factors,
            confidence=ml_result["confidence"],
            scored_at=ml_result["scored_at"],
        )


scoring_service = ScoringService()

__all__ = ["ScoringService", "scoring_service"]
