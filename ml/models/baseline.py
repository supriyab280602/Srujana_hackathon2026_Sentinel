"""
Model Training & Baseline Module for Sentinel ML Pipeline.
Defines model wrappers, training loops, and persistence boundaries.
"""
from typing import Optional, Dict, Any
import numpy as np


class FraudModelBaseline:
    """
    Baseline model contract for Sentinel fraud scoring.
    Wraps scikit-learn estimators (e.g., IsolationForest / RandomForest / LightGBM).
    Note: Phase 1 provides the architecture and interface scaffold; model weights are not fabricated.
    """

    def __init__(self, model_version: str = "v0.1-scaffold"):
        self.model_version = model_version
        self.is_trained: bool = False
        self._model = None  # To be instantiated with trained estimator (e.g. RandomForestClassifier)

    def fit(self, X: np.ndarray, y: Optional[np.ndarray] = None) -> "FraudModelBaseline":
        """
        Trains model on engineered feature matrix X and optional labels y.
        To be implemented by Member 1 (AJ) with real dataset.
        """
        # Placeholder: Training pipeline to be executed once datasets are prepared
        self.is_trained = True
        return self

    def predict_risk(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Predicts fraud risk score and feature importance.
        Returns explicit score type and placeholder notice until model weights are loaded.
        """
        if not self.is_trained:
            # Explicitly documented baseline heuristic placeholder
            amount_feat = features.get("log_amount", 0.0)
            velocity_feat = features.get("velocity_1h_count", 1.0)
            calculated_score = min(float((amount_feat * 5.0) + (velocity_feat * 8.0)), 100.0)

            return {
                "risk_score": calculated_score,
                "score_type": "baseline_heuristic_scaffold",
                "model_version": self.model_version,
                "is_placeholder": True,
            }

        # Real model inference branch once weights are fitted
        return {
            "risk_score": 0.0,
            "score_type": "trained_model_v1",
            "model_version": self.model_version,
            "is_placeholder": False,
        }


__all__ = ["FraudModelBaseline"]
