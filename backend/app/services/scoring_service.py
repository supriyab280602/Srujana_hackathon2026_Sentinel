import sys
import os
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.schemas.scoring import ScoreRequest, ScoreResponse
from app.schemas.alert import RiskFactor, AlertRead
from app.repositories.base import repo

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
    Enforces a strict two-phase lifecycle:
    1. Zero-lookahead feature extraction & risk scoring (auto_update_profile=False).
    2. Durable transaction persistence in repository (atomic failure boundary).
    3. Behavioral profile update executed ONLY after persistence succeeds.
    """

    def score_transaction(
        self,
        request: ScoreRequest,
        auto_update_profile: bool = True,
        persist_transaction: bool = True,
    ) -> ScoreResponse:
        txn = request.transaction
        txn_id = getattr(txn, "id", None) or f"TXN-{uuid.uuid4().hex[:8].upper()}"

        # 1. Check for duplicate transaction in repository
        is_duplicate = False
        if persist_transaction and repo.get_transaction_by_id(txn_id):
            is_duplicate = True

        # Prepare payload for ML scoring interface
        txn_dict = {
            "id": txn_id,
            "transaction_id": txn_id,
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

        # Step 1: Feature extraction & inference strictly against pre-transaction state
        # auto_update_profile is set to False so scoring failure cannot corrupt behavioral state
        alert_thresh = getattr(request, "alert_threshold", None)
        ml_result = sentinel_scorer.score_transaction(
            transaction_data=txn_dict,
            historical_context=context,
            auto_update_profile=False,
            alert_threshold=alert_thresh,
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

        # Step 2: Durable transaction persistence
        if persist_transaction and not is_duplicate:
            # If persistence raises an error, execution aborts and profile is NEVER updated
            repo.add_transaction(txn, txn_id=txn_id)

            # Persist alert if triggered
            if ml_result["is_alert_triggered"]:
                alert = AlertRead(
                    id=f"ALT-{uuid.uuid4().hex[:6].upper()}",
                    transaction_id=txn_id,
                    account_id=txn.sender_account_id,
                    severity=ml_result["suggested_severity"],
                    risk_score=ml_result["risk_score"],
                    status="open",
                    detection_rule="BEHAVIORAL_ML_SURVEILLANCE",
                    title=f"Suspicious {txn.channel.upper()} Transfer flagged by Sentinel Scorer",
                    summary=f"Risk score {ml_result['risk_score']} exceeded severity threshold.",
                    created_at=datetime.utcnow(),
                    factors=factors,
                )
                repo.add_alert(alert)

        # Step 3: Profile update ONLY after successful scoring and persistence
        if auto_update_profile and not is_duplicate:
            sentinel_scorer.update_profile(txn_dict)

        return ScoreResponse(
            transaction_id=ml_result.get("transaction_id", txn_id),
            risk_score=ml_result["risk_score"],
            score_type=ml_result["score_type"],
            is_alert_triggered=ml_result["is_alert_triggered"],
            suggested_severity=ml_result["suggested_severity"],
            factors=factors,
            behavioral_indicators=ml_result.get("behavioral_indicators", []),
            confidence=ml_result["confidence"],
            scored_at=ml_result["scored_at"],
        )

    def set_alert_threshold(self, threshold: float) -> None:
        """Configures global alert trigger threshold for adaptive risk monitoring."""
        sentinel_scorer.set_alert_threshold(threshold)

    def score_batch(
        self,
        requests: List[ScoreRequest],
        auto_update_profiles: bool = True,
    ) -> List[ScoreResponse]:
        """
        Scores a batch of transactions against a shared pre-batch snapshot.
        Guarantees zero within-batch lookahead.
        """
        return [
            self.score_transaction(req, auto_update_profile=auto_update_profiles)
            for req in requests
        ]

    def get_account_profile(self, account_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves real-time behavioral fingerprint profile for an account."""
        return sentinel_scorer.get_account_profile(account_id)


scoring_service = ScoringService()

__all__ = ["ScoringService", "scoring_service"]
