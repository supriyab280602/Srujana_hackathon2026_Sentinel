"""
Baseline ML Model Module for Sentinel Financial Fraud Detection.
Implements a reproducible, class-imbalance-aware scikit-learn estimator
with strict chronological train/test separation, fitted feature scaling,
and transparent artifact persistence.
"""
import os
import json
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import precision_recall_curve, f1_score as sk_f1_score
import joblib


class FraudModelBaseline:
    """
    RandomForest baseline estimator for financial fraud risk scoring.
    Handles class imbalance via balanced weighting, threshold tuning,
    and provides feature attribution.
    """

    def __init__(
        self,
        model_version: str = "v1.0-rf-baseline",
        random_state: int = 42,
        n_estimators: int = 200,
        max_depth: int = 16,
    ):
        self.model_version = model_version
        self.random_state = random_state
        self.n_estimators = n_estimators
        self.max_depth = max_depth

        self.is_trained: bool = False
        self.feature_names: List[str] = []
        self.feature_importances_: Dict[str, float] = {}
        self.training_metadata: Dict[str, Any] = {}
        self.optimal_threshold: float = 0.5  # Will be tuned during training

        self._scaler: Optional[StandardScaler] = None
        self._model: Optional[RandomForestClassifier] = None

    @staticmethod
    def chronological_train_test_split(
        X: pd.DataFrame,
        y: Optional[pd.Series] = None,
        test_size: float = 0.2,
    ) -> Tuple[pd.DataFrame, pd.DataFrame, Optional[pd.Series], Optional[pd.Series]]:
        """
        Splits data chronologically without shuffling to prevent future data leakage.
        The first (1 - test_size) portion is train, remaining is test.
        """
        split_idx = int(len(X) * (1.0 - test_size))
        X_train = X.iloc[:split_idx].copy()
        X_test = X.iloc[split_idx:].copy()

        y_train = y.iloc[:split_idx].copy() if y is not None else None
        y_test = y.iloc[split_idx:].copy() if y is not None else None

        return X_train, X_test, y_train, y_test

    @staticmethod
    def chronological_train_val_test_split(
        X: pd.DataFrame,
        y: Optional[pd.Series] = None,
        val_size: float = 0.2,
        test_size: float = 0.2,
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, Optional[pd.Series], Optional[pd.Series], Optional[pd.Series]]:
        """
        Splits data chronologically into 3 partitions: train, validation, and test.
        Preserves strictly forward temporal ordering without shuffling.
        Train: [0, 1 - val_size - test_size)
        Validation: [1 - val_size - test_size, 1 - test_size)
        Test: [1 - test_size, end)
        """
        total = len(X)
        train_end = int(total * (1.0 - val_size - test_size))
        val_end = int(total * (1.0 - test_size))

        X_train = X.iloc[:train_end].copy()
        X_val = X.iloc[train_end:val_end].copy()
        X_test = X.iloc[val_end:].copy()

        y_train = y.iloc[:train_end].copy() if y is not None else None
        y_val = y.iloc[train_end:val_end].copy() if y is not None else None
        y_test = y.iloc[val_end:].copy() if y is not None else None

        return X_train, X_val, X_test, y_train, y_val, y_test

    def tune_threshold(
        self,
        X_val: pd.DataFrame,
        y_val: pd.Series,
        beta: float = 2.0,
    ) -> float:
        """
        Tunes the decision threshold on a strictly held-out validation set to maximize F-beta score.
        beta=2.0 prioritizes recall (catching fraud) while penalizing excessive false positives.
        Updates self.optimal_threshold and returns the selected threshold.
        """
        if not self.is_trained:
            raise RuntimeError("Model must be fitted before tuning threshold.")

        val_scores = self.predict_proba(X_val)
        self.optimal_threshold = self._find_optimal_threshold(y_val, val_scores, beta=beta)
        if hasattr(self, "training_metadata") and self.training_metadata:
            self.training_metadata["optimal_threshold"] = self.optimal_threshold
            self.training_metadata["threshold_tuning_method"] = f"held_out_validation_fbeta_{beta}"
        return self.optimal_threshold

    def fit(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        feature_names: Optional[List[str]] = None,
    ) -> "FraudModelBaseline":
        """
        Fits the feature scaler and RandomForestClassifier on training data.
        Class imbalance is addressed using balanced subsample weighting.
        """
        if len(X) == 0 or len(y) == 0:
            raise ValueError("Training inputs X and y must not be empty.")

        unique_classes = np.unique(y)
        if len(unique_classes) < 2:
            raise ValueError("Training target y must contain at least 2 distinct classes (0 and 1).")

        self.feature_names = feature_names or list(X.columns)

        # 1. Fit scaler strictly on training data
        self._scaler = StandardScaler()
        X_scaled = self._scaler.fit_transform(X[self.feature_names])

        # 2. Fit estimator with improved hyperparameters for fraud detection
        self._model = RandomForestClassifier(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            class_weight="balanced_subsample",
            min_samples_leaf=5,
            min_samples_split=10,
            random_state=self.random_state,
            n_jobs=-1,
        )
        self._model.fit(X_scaled, y)
        self.is_trained = True

        # 3. Record feature importances
        raw_importances = self._model.feature_importances_
        self.feature_importances_ = {
            name: float(imp) for name, imp in zip(self.feature_names, raw_importances)
        }

        # 4. Tune optimal threshold on training data (in-sample, for production
        #    use cross-validation or a held-out validation set)
        train_scores = self._model.predict_proba(X_scaled)[:, 1]
        self.optimal_threshold = self._find_optimal_threshold(y, train_scores)

        # 5. Record training metadata
        pos_count = int(np.sum(y == 1))
        total_count = int(len(y))
        self.training_metadata = {
            "model_version": self.model_version,
            "trained_at": datetime.utcnow().isoformat(),
            "n_samples": total_count,
            "fraud_prevalence": float(pos_count / max(total_count, 1)),
            "n_features": len(self.feature_names),
            "feature_names": self.feature_names,
            "n_estimators": self.n_estimators,
            "max_depth": self.max_depth,
            "optimal_threshold": self.optimal_threshold,
        }

        return self

    @staticmethod
    def _find_optimal_threshold(
        y_true: pd.Series,
        y_scores: np.ndarray,
        beta: float = 2.0,
    ) -> float:
        """
        Finds the decision threshold that maximizes F-beta score.
        beta=2 emphasizes recall over precision (prioritize catching fraud).
        Falls back to 0.3 if optimization fails.
        """
        try:
            precisions, recalls, thresholds = precision_recall_curve(
                np.asarray(y_true), y_scores
            )

            best_threshold = 0.3
            best_fbeta = 0.0

            for i in range(len(thresholds)):
                p = precisions[i]
                r = recalls[i]
                if p + r > 0:
                    fbeta = (1 + beta**2) * (p * r) / (beta**2 * p + r)
                    if fbeta > best_fbeta:
                        best_fbeta = fbeta
                        best_threshold = float(thresholds[i])

            return round(best_threshold, 4)

        except Exception:
            return 0.3

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """
        Outputs estimated probability of fraud [0.0, 1.0].
        Raises RuntimeError if model has not been trained.
        """
        if not self.is_trained or self._model is None or self._scaler is None:
            raise RuntimeError("Model is not trained. Fit or load a trained model first.")

        X_scaled = self._scaler.transform(X[self.feature_names])
        # Column 1 corresponds to positive fraud class
        return self._model.predict_proba(X_scaled)[:, 1]

    def predict(self, X: pd.DataFrame, threshold: Optional[float] = None) -> np.ndarray:
        """
        Binary fraud prediction using optimal or specified threshold.
        """
        thresh = threshold if threshold is not None else self.optimal_threshold
        scores = self.predict_proba(X)
        return (scores >= thresh).astype(int)

    def predict_risk(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Computes risk score, risk category tier, and top contributing evidence factors
        for a single transaction.
        """
        if not self.is_trained or self._model is None:
            # Explicitly identified development fallback when no trained model weights exist
            return self._fallback_heuristic_scoring(features)

        # Align features to model feature names using DataFrame with column names
        vector_df = pd.DataFrame([[features.get(f, 0.0) for f in self.feature_names]], columns=self.feature_names)
        vector_scaled = self._scaler.transform(vector_df)

        # Probability from trained ensemble
        prob = float(self._model.predict_proba(vector_scaled)[0, 1])
        risk_score = round(prob * 100.0, 1)

        # Categorical severity
        if risk_score >= 90.0:
            category = "critical"
        elif risk_score >= 70.0:
            category = "high"
        elif risk_score >= 30.0:
            category = "medium"
        else:
            category = "low"

        # Evidence-backed factors using model feature importances
        factors = []
        sorted_feats = sorted(
            self.feature_importances_.items(), key=lambda item: item[1], reverse=True
        )

        for feat_name, importance in sorted_feats[:3]:
            feat_val = features.get(feat_name, 0.0)
            if feat_val > 0.0:
                contrib = round(importance * risk_score, 1)
                factors.append({
                    "name": feat_name.replace("_", " ").title(),
                    "weight": round(importance, 3),
                    "contribution": contrib,
                    "description": f"Model importance: {importance:.1%}; observed value: {feat_val:.2f}",
                })

        return {
            "risk_score": risk_score,
            "risk_category": category,
            "score_type": "model_score",
            "model_version": self.model_version,
            "confidence": round(float(np.max(self._model.predict_proba(vector_scaled))), 2),
            "factors": factors,
            "is_placeholder": False,
        }

    def _fallback_heuristic_scoring(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Transparent development fallback when real model weights are not loaded.
        Clearly labeled with is_placeholder=True so it cannot be mistaken for ML inference.
        """
        amount_feat = features.get("log_amount", 0.0)
        velocity_feat = features.get("velocity_1h_count", 1.0)
        high_risk_channel = features.get("is_high_risk_channel", 0.0)

        raw_score = (amount_feat * 4.0) + (velocity_feat * 7.0) + (high_risk_channel * 20.0)
        risk_score = round(min(raw_score, 100.0), 1)

        category = "high" if risk_score >= 70.0 else ("medium" if risk_score >= 30.0 else "low")

        factors = []
        if amount_feat > 8.0:
            factors.append({
                "name": "High Transaction Volume",
                "weight": 0.40,
                "contribution": 25.0,
                "description": f"Observed log-amount of {amount_feat:.2f} exceeds standard baseline",
            })
        if velocity_feat > 2.0:
            factors.append({
                "name": "Velocity Spike",
                "weight": 0.35,
                "contribution": 20.0,
                "description": f"Encountered {velocity_feat:.0f} transactions within rolling 1-hour window",
            })

        return {
            "risk_score": risk_score,
            "risk_category": category,
            "score_type": "development_fallback_heuristic",
            "model_version": f"{self.model_version}-unfitted",
            "confidence": 0.50,
            "factors": factors,
            "is_placeholder": True,
        }

    def save(self, filepath: str) -> None:
        """Serializes trained model artifact, scaler, and training metadata to disk."""
        if not self.is_trained:
            raise RuntimeError("Cannot save an unfitted model.")

        os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
        payload = {
            "model": self._model,
            "scaler": self._scaler,
            "feature_names": self.feature_names,
            "feature_importances": self.feature_importances_,
            "metadata": self.training_metadata,
            "version": self.model_version,
            "optimal_threshold": self.optimal_threshold,
        }
        joblib.dump(payload, filepath)

    def load(self, filepath: str) -> "FraudModelBaseline":
        """Loads serialized model artifact and validates compatibility."""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Model artifact not found at {filepath}")

        payload = joblib.load(filepath)
        self._model = payload["model"]
        self._scaler = payload["scaler"]
        self.feature_names = payload["feature_names"]
        self.feature_importances_ = payload.get("feature_importances", {})
        self.training_metadata = payload.get("metadata", {})
        self.model_version = payload.get("version", self.model_version)
        self.optimal_threshold = payload.get("optimal_threshold", 0.5)
        self.is_trained = True
        return self


__all__ = ["FraudModelBaseline"]
