"""
Public Risk Scoring Interface for Sentinel.
Primary ML contract consumed by the FastAPI backend, CLI evaluation scripts,
and chronological replay streams.
"""
import os
import math
from typing import Dict, Any, List, Optional
from datetime import datetime
from ml.features.engineer import FeatureEngineer
from ml.features.fingerprint import BehavioralFingerprintEngine
from ml.models.baseline import FraudModelBaseline


class SentinelScorer:
    """
    Unified inference service for evaluating transaction risk.
    Bridges feature engineering, account-level behavioral fingerprinting,
    trained model inference, and explainable factor attribution.
    """

    DEFAULT_MODEL_PATH = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "models", "saved", "baseline_rf.joblib")
    )

    def __init__(
        self,
        model_path: Optional[str] = None,
        auto_load: bool = False,
        alert_threshold: float = 50.0,
    ):
        self.feature_engineer = FeatureEngineer()
        self.fingerprint_engine = BehavioralFingerprintEngine()
        self.model = FraudModelBaseline()
        self.alert_threshold = float(alert_threshold)

        target = model_path or (self.DEFAULT_MODEL_PATH if auto_load else None)
        if target and os.path.exists(target):
            self.load_model(target)

    def load_model(self, model_path: str) -> None:
        """Loads a serialized model artifact into the scoring pipeline."""
        self.model.load(model_path)

    def set_alert_threshold(self, threshold: float) -> None:
        """Dynamically configures alert sensitivity threshold for adaptive risk monitoring."""
        self.alert_threshold = max(0.0, min(100.0, float(threshold)))

    def score_transaction(
        self,
        transaction_data: Dict[str, Any],
        historical_context: Optional[Dict[str, Any]] = None,
        auto_update_profile: bool = False,
        alert_threshold: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Calculates transaction fraud score with explainable factor contributions.

        Parameters:
            transaction_data (dict): Transaction fields:
                - amount (float)
                - channel (str)
                - sender_account_id (str)
                - receiver_account_id (str)
                - transaction_id (str, optional)
                - timestamp (str / datetime, optional)
            historical_context (dict, optional): Historical velocity and baseline metrics at time T:
                - velocity_1h_count (float)
                - velocity_1h_volume (float)
                - unique_destinations_1h (float)
                - sender_tx_count_prior (float)
                - sender_volume_prior (float)
            auto_update_profile (bool, optional): If True, updates internal behavioral
                profiles strictly AFTER successful feature extraction and scoring. Default is False.

        Returns:
            dict matching the Sentinel scoring contract:
                - transaction_id (str or None)
                - risk_score (float): Composite risk index [0.0 - 100.0]
                - risk_category (str): 'low', 'medium', 'high', or 'critical'
                - score_type (str): 'model_score' or 'development_fallback_heuristic'
                - is_alert_triggered (bool): True if score exceeds alert threshold (50.0)
                - suggested_severity (str): Alert severity tier
                - confidence (float): Model prediction certainty [0.0 - 1.0]
                - factors (list): Top contributing feature factors and observed evidence
                - behavioral_indicators (list): Structured behavioral baseline anomalies
                - is_placeholder (bool): True if model weights are unfitted
                - model_version (str): Model version identifier
                - scored_at (str): ISO timestamp
        """
        # 1. Feature extraction with strict zero-lookahead (pre-transaction state)
        features = self.feature_engineer.extract_single_transaction_features(
            transaction_data=transaction_data,
            historical_context=historical_context,
        )

        # 2. Extract behavioral features from fingerprint engine
        behavioral_feats = self.fingerprint_engine.compute_transaction_features(
            transaction=transaction_data,
            historical_context=historical_context,
        )
        features.update(behavioral_feats)

        # 3. Risk inference (trained model or explicit development fallback)
        prediction = self.model.predict_risk(features)
        risk_score = float(prediction["risk_score"])
        risk_category = prediction.get("risk_category", "low")

        # 4. Determine alert thresholding (adaptive sensitivity)
        active_thresh = float(alert_threshold) if alert_threshold is not None else self.alert_threshold
        is_alert = risk_score >= active_thresh
        if risk_score >= 90.0:
            suggested_severity = "critical"
        elif risk_score >= 70.0:
            suggested_severity = "high"
        elif is_alert:
            suggested_severity = "medium"
        else:
            suggested_severity = "low"

        # 5. Assemble observed indicators alongside model factors
        factors = list(prediction.get("factors", []))

        # 6. Synthesize explainable behavioral anomaly indicators
        behavioral_indicators = self.fingerprint_engine.get_behavioral_indicators(
            transaction=transaction_data,
            features=features,
        )
        for ind in behavioral_indicators:
            if ind.get("severity") in ("high", "medium"):
                factors.append({
                    "name": ind["name"],
                    "weight": 0.35 if ind["severity"] == "high" else 0.20,
                    "contribution": 25.0 if ind["severity"] == "high" else 15.0,
                    "description": ind["description"],
                })

        # Add domain rule observations if not already captured
        raw_amt = transaction_data.get("amount")
        try:
            amount = float(raw_amt) if raw_amt is not None else 0.0
            if not math.isfinite(amount) or amount < 0.0:
                amount = 0.0
        except (ValueError, TypeError):
            amount = 0.0

        channel = str(transaction_data.get("channel", "") or "").lower()

        if amount > 10000.0 and not any("Volume" in f["name"] for f in factors):
            factors.append({
                "name": "High Single-Transaction Volume",
                "weight": 0.40,
                "contribution": 25.0,
                "description": f"Observed volume ${amount:,.2f} exceeds standard tier baseline",
            })

        if channel in ("crypto", "wire") and not any("Channel" in f["name"] for f in factors):
            factors.append({
                "name": "Heightened Channel Rail",
                "weight": 0.25,
                "contribution": 15.0,
                "description": f"Transaction rail '{channel.upper()}' flagged for surveillance",
            })

        # 7. Post-scoring profile update (if requested) - strictly after successful scoring
        if auto_update_profile:
            self.update_profile(transaction_data)

        return {
            "transaction_id": transaction_data.get("id", transaction_data.get("transaction_id")),
            "risk_score": risk_score,
            "risk_category": risk_category,
            "score_type": prediction["score_type"],
            "is_alert_triggered": is_alert,
            "suggested_severity": suggested_severity,
            "confidence": float(prediction.get("confidence", 0.5)),
            "factors": factors,
            "behavioral_indicators": behavioral_indicators,
            "is_placeholder": prediction.get("is_placeholder", True),
            "model_version": prediction.get("model_version", self.model.model_version),
            "scored_at": datetime.utcnow().isoformat(),
        }

    def score_batch(
        self,
        transactions: List[Dict[str, Any]],
        auto_update_profiles: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Scores a batch of transactions against a shared pre-batch profile snapshot.
        Guarantees zero within-batch lookahead: every transaction is evaluated
        before any transaction in the batch updates profile state.
        """
        results: List[Dict[str, Any]] = []

        # Step 1: Score every transaction strictly without mutating profile state
        for txn in transactions:
            res = self.score_transaction(txn, auto_update_profile=False)
            results.append(res)

        # Step 2: Apply updates after all scores are computed
        if auto_update_profiles:
            for txn in transactions:
                self.update_profile(txn)

        return results

    def update_profile(
        self,
        transaction_data: Dict[str, Any],
        step: Optional[int] = None,
        timestamp: Optional[Any] = None,
    ) -> bool:
        """
        Updates internal behavioral fingerprint profiles after a transaction executes.
        Returns True if updated, False if duplicate transaction ID was skipped.
        """
        txn_id = transaction_data.get("id", transaction_data.get("transaction_id"))
        return self.fingerprint_engine.update_profile(
            transaction_data,
            step=step,
            timestamp=timestamp,
            transaction_id=str(txn_id) if txn_id else None,
        )

    def get_behavioral_indicators(self, transaction_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Direct access to behavioral profile anomaly indicators."""
        return self.fingerprint_engine.get_behavioral_indicators(transaction_data)

    def get_account_profile(self, account_id: str) -> Optional[Dict[str, Any]]:
        """Returns structured account profile statistics dictionary if tracked."""
        prof = self.fingerprint_engine.profiles.get(str(account_id))
        if not prof:
            return None

        has_sufficient = prof.tx_count >= self.fingerprint_engine.min_history_threshold
        # Confidence score reflects profile statistical maturity
        confidence_score = 0.90 if has_sufficient else round(min(prof.tx_count / 3.0 * 0.6, 0.60), 2)

        return {
            "account_id": prof.account_id,
            "status": "active" if has_sufficient else "cold_start",
            "tx_count": prof.tx_count,
            "total_volume": round(prof.total_volume, 2),
            "amount_mean": round(prof.amount_mean, 2),
            "amount_std": round(prof.sample_std(), 2),
            "has_sufficient_history": has_sufficient,
            "confidence_score": confidence_score,
            "channel_counts": dict(prof.channel_counts),
            "inflow_count": prof.inflow_count,
            "inflow_volume": round(prof.inflow_volume, 2),
            "frequent_counterparties": sorted(
                prof.recipient_counts.keys(),
                key=lambda k: prof.recipient_counts[k],
                reverse=True,
            )[:5],
            "last_seen_step": prof.last_seen_step,
        }

    def save_profiles(self, filepath: str) -> None:
        """Atomically saves in-memory behavioral profiles to disk."""
        self.fingerprint_engine.save_profiles(filepath)

    def load_profiles(self, filepath: str, merge: bool = False) -> int:
        """Loads behavioral profiles from a disk snapshot."""
        return self.fingerprint_engine.load_profiles(filepath, merge=merge)


# Global singleton instance for backend import
sentinel_scorer = SentinelScorer()

__all__ = ["SentinelScorer", "sentinel_scorer"]
