"""
Feature Engineering Module for Sentinel ML Pipeline.
Transforms raw transaction events and historical window data into ML model feature matrices.
"""
from typing import Dict, Any, List
import numpy as np
import pandas as pd


class FeatureEngineer:
    """
    Computes behavioral, velocity, and topological features.
    Maintains clean boundaries between inference-time single transaction features
    and training batch tabular features.
    """

    def __init__(self):
        self.engineered_feature_names = [
            "log_amount",
            "is_wire_or_crypto",
            "hour_of_day",
            "is_weekend",
            "velocity_1h_count",
            "velocity_1h_volume",
            "fanout_ratio",
        ]

    def extract_single_transaction_features(
        self,
        transaction_data: Dict[str, Any],
        historical_context: Dict[str, Any] | None = None,
    ) -> Dict[str, float]:
        """
        Extracts feature vector for a single inference-time transaction.
        Strict zero-lookahead: Uses only context available at transaction time.
        """
        amount = float(transaction_data.get("amount", 0.0))
        channel = str(transaction_data.get("channel", "wire")).lower()

        context = historical_context or {}
        velocity_count = float(context.get("velocity_1h_count", 1.0))
        velocity_volume = float(context.get("velocity_1h_volume", amount))
        unique_destinations = float(context.get("unique_destinations_1h", 1.0))

        features = {
            "log_amount": float(np.log1p(max(amount, 0.0))),
            "is_wire_or_crypto": 1.0 if channel in ("wire", "crypto") else 0.0,
            "hour_of_day": float(context.get("hour_of_day", 12.0)),
            "is_weekend": float(context.get("is_weekend", 0.0)),
            "velocity_1h_count": velocity_count,
            "velocity_1h_volume": velocity_volume,
            "fanout_ratio": unique_destinations / max(velocity_count, 1.0),
        }
        return features

    def transform_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Batch transformation for historical datasets during training.
        """
        features_df = pd.DataFrame(index=df.index)
        features_df["log_amount"] = np.log1p(df["amount"].clip(lower=0))
        features_df["is_wire_or_crypto"] = df["channel"].isin(["wire", "crypto"]).astype(float)

        if "timestamp" in df.columns:
            ts = pd.to_datetime(df["timestamp"])
            features_df["hour_of_day"] = ts.dt.hour.astype(float)
            features_df["is_weekend"] = ts.dt.dayofweek.isin([5, 6]).astype(float)
        else:
            features_df["hour_of_day"] = 12.0
            features_df["is_weekend"] = 0.0

        features_df["velocity_1h_count"] = 1.0
        features_df["velocity_1h_volume"] = df["amount"].values
        features_df["fanout_ratio"] = 1.0

        return features_df


__all__ = ["FeatureEngineer"]
