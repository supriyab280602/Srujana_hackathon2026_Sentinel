"""
Documented Risk Scoring Interface for Sentinel.
This is the primary public ML contract consumed by the FastAPI backend and batch pipelines.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from ml.features.engineer import FeatureEngineer
from ml.models.baseline import FraudModelBaseline


class SentinelScorer:
    """
    Standard interface for transaction scoring and explanation generation.
    Can be directly imported by backend services or batch CLI tools:
        from ml.scoring.interface import sentinel_scorer
        result = sentinel_scorer.score_transaction(txn_data, history)
    """

    def __init__(self):
        self.feature_engineer = FeatureEngineer()
        self.model = FraudModelBaseline()

    def score_transaction(
        self,
        transaction_data: Dict[str, Any],
        historical_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Calculates transaction fraud score with explainable factor contributions.

        Parameters:
            transaction_data (dict): Dictionary with keys:
                - amount (float)
                - channel (str)
                - sender_account_id (str)
                - receiver_account_id (str)
                - timestamp (str / datetime)
            historical_context (dict, optional): Historical velocity and baseline metrics:
                - velocity_1h_count (float)
                - velocity_1h_volume (float)
                - unique_destinations_1h (float)

        Returns:
            dict containing:
                - risk_score (float): Composite risk index [0.0 - 100.0]
                - score_type (str): Explicit identifier of model / heuristic used
                - confidence (float): Certainty score [0.0 - 1.0]
                - factors (list of dicts): Explainable factor breakdown with attribution weights
                - is_placeholder (bool): Flag indicating if model weights are pending training
                - scored_at (str): ISO timestamp
        """
        # 1. Feature extraction with strict zero-lookahead
        features = self.feature_engineer.extract_single_transaction_features(
            transaction_data=transaction_data,
            historical_context=historical_context,
        )

        # 2. Risk inference via model baseline
        prediction = self.model.predict_risk(features)
        raw_score = prediction["risk_score"]

        # 3. Explainable evidence attribution
        factors = []
        amount = float(transaction_data.get("amount", 0.0))
        if amount > 10000.0:
            factors.append({
                "name": "High Single-Transaction Volume",
                "weight": 0.40,
                "contribution": 25.0,
                "description": f"Volume of ${amount:,.2f} deviates from standard tier baseline",
            })

        velocity = float((historical_context or {}).get("velocity_1h_count", 1.0))
        if velocity > 3.0:
            factors.append({
                "name": "High Transaction Velocity",
                "weight": 0.35,
                "contribution": 20.0,
                "description": f"Encountered {velocity:.0f} transactions within short window",
            })

        channel = str(transaction_data.get("channel", "")).lower()
        if channel == "crypto":
            factors.append({
                "name": "High-Risk Channel Rail",
                "weight": 0.25,
                "contribution": 15.0,
                "description": "Cross-border cryptocurrency routing observed",
            })

        return {
            "risk_score": float(raw_score),
            "score_type": prediction["score_type"],
            "model_version": prediction["model_version"],
            "is_placeholder": prediction["is_placeholder"],
            "confidence": 0.80 if not prediction["is_placeholder"] else 0.50,
            "factors": factors,
            "scored_at": datetime.utcnow().isoformat(),
        }


# Global singleton instance for backend import
sentinel_scorer = SentinelScorer()

__all__ = ["SentinelScorer", "sentinel_scorer"]
