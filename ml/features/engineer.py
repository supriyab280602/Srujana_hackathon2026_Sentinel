"""
Zero-Lookahead Feature Engineering Module for Sentinel ML Pipeline.
Computes interpretable, behavioral, velocity, and topological features.
Enforces strict temporal causality: features at time T are calculated solely from
data available at or before time T, with zero leakage from future events or target labels.
"""
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd


class FeatureEngineer:
    """
    Transforms raw transaction streams into ML feature vectors.
    Supports both online single-event inference and batch chronological dataset transformation.
    """

    FEATURE_NAMES = [
        "log_amount",
        "is_high_risk_channel",
        "is_transfer_or_wire",
        "is_cash_out",
        "hour_of_day",
        "is_night",
        "is_weekend",
        "sender_tx_count_prior",
        "sender_volume_prior",
        "amount_to_prior_avg_ratio",
        "recipient_inflow_count_prior",
        "is_new_recipient",
        "velocity_1h_count",
        "velocity_1h_volume",
        "fanout_ratio",
        # Balance-delta features (PaySim): use only pre-transaction balances + amount
        "amount_to_balance_ratio",
        "is_balance_drain",
        "receiver_zero_balance",
    ]

    # Genuinely new account-level behavioral features (Phase 3)
    CANDIDATE_BEHAVIORAL_FEATURE_NAMES = [
        "sender_history_count",
        "sender_has_sufficient_history",
        "sender_amount_mean_prior",
        "sender_amount_std_prior",
        "sender_amount_deviation_prior",
        "sender_amount_zscore_prior",
        "sender_amount_ratio_to_mean_prior",
        "sender_type_share_prior",
        "sender_type_unseen_prior",
        "recipient_inflow_volume_prior",
    ]

    ALL_CANDIDATE_FEATURE_NAMES = FEATURE_NAMES + CANDIDATE_BEHAVIORAL_FEATURE_NAMES

    def __init__(self, include_behavioral: bool = False):
        self.include_behavioral = include_behavioral
        self.engineered_feature_names = (
            list(self.ALL_CANDIDATE_FEATURE_NAMES) if include_behavioral else list(self.FEATURE_NAMES)
        )

    def extract_single_transaction_features(
        self,
        transaction_data: Dict[str, Any],
        historical_context: Optional[Dict[str, Any]] = None,
        include_behavioral: Optional[bool] = None,
    ) -> Dict[str, float]:
        """
        Extracts feature vector for an individual transaction at inference time.
        Consumes only the current transaction attributes and historical context at or before event time.
        """
        context = historical_context or {}

        # 1. Amount features
        amount = float(transaction_data.get("amount", 0.0))
        log_amount = float(np.log1p(max(amount, 0.0)))

        # 2. Channel encoding
        channel = str(transaction_data.get("channel", "wire")).lower()
        is_transfer_or_wire = 1.0 if channel in ("transfer", "wire") else 0.0
        is_cash_out = 1.0 if channel in ("cash_out", "crypto") else 0.0
        is_high_risk_channel = 1.0 if channel in ("transfer", "cash_out", "wire", "crypto") else 0.0

        # 3. Temporal features
        hour = float(context.get("hour_of_day", 12.0))
        if "timestamp" in transaction_data and transaction_data["timestamp"]:
            try:
                ts = pd.to_datetime(transaction_data["timestamp"])
                hour = float(ts.hour)
                is_weekend = 1.0 if ts.dayofweek in (5, 6) else 0.0
            except Exception:
                is_weekend = float(context.get("is_weekend", 0.0))
        else:
            is_weekend = float(context.get("is_weekend", 0.0))

        is_night = 1.0 if hour < 6.0 or hour >= 23.0 else 0.0

        # 4. Sender & Recipient Historical Context
        sender_tx_count_prior = float(context.get("sender_tx_count_prior", 0.0))
        sender_volume_prior = float(context.get("sender_volume_prior", 0.0))

        if sender_tx_count_prior > 0 and sender_volume_prior > 0:
            avg_prior = sender_volume_prior / sender_tx_count_prior
            amount_to_prior_avg_ratio = float(amount / (avg_prior + 1e-5))
        else:
            amount_to_prior_avg_ratio = 1.0

        recipient_inflow_count_prior = float(context.get("recipient_inflow_count_prior", 0.0))
        is_new_recipient = float(context.get("is_new_recipient", 1.0))

        # 5. Short-window velocity
        velocity_count = float(context.get("velocity_1h_count", 1.0))
        velocity_volume = float(context.get("velocity_1h_volume", amount))
        unique_destinations = float(context.get("unique_destinations_1h", 1.0))
        fanout_ratio = float(unique_destinations / max(velocity_count, 1.0))

        # 6. Balance-delta features (pre-transaction only — NOT leakage)
        sender_balance = float(transaction_data.get("sender_balance_before",
                              context.get("sender_balance_before", 0.0)))
        amount_to_balance_ratio = float(amount / (sender_balance + 1.0))
        is_balance_drain = 1.0 if sender_balance > 0 and amount >= sender_balance * 0.9 else 0.0

        receiver_balance = float(transaction_data.get("receiver_balance_before",
                                context.get("receiver_balance_before", 0.0)))
        receiver_zero_balance = 1.0 if receiver_balance == 0.0 else 0.0

        base_dict = {
            "log_amount": log_amount,
            "is_high_risk_channel": is_high_risk_channel,
            "is_transfer_or_wire": is_transfer_or_wire,
            "is_cash_out": is_cash_out,
            "hour_of_day": hour,
            "is_night": is_night,
            "is_weekend": is_weekend,
            "sender_tx_count_prior": sender_tx_count_prior,
            "sender_volume_prior": sender_volume_prior,
            "amount_to_prior_avg_ratio": amount_to_prior_avg_ratio,
            "recipient_inflow_count_prior": recipient_inflow_count_prior,
            "is_new_recipient": is_new_recipient,
            "velocity_1h_count": velocity_count,
            "velocity_1h_volume": velocity_volume,
            "fanout_ratio": fanout_ratio,
            "amount_to_balance_ratio": amount_to_balance_ratio,
            "is_balance_drain": is_balance_drain,
            "receiver_zero_balance": receiver_zero_balance,
        }

        use_behavioral = self.include_behavioral if include_behavioral is None else include_behavioral
        if use_behavioral:
            from ml.features.fingerprint import BehavioralFingerprintEngine
            engine = BehavioralFingerprintEngine()
            bf_feats = engine.compute_transaction_features(transaction_data, historical_context)
            for k in self.CANDIDATE_BEHAVIORAL_FEATURE_NAMES:
                if k in bf_feats:
                    base_dict[k] = bf_feats[k]

        return base_dict

    def transform_chronological(
        self,
        df: pd.DataFrame,
        include_behavioral: Optional[bool] = None,
    ) -> pd.DataFrame:
        """
        Transforms a transaction DataFrame row-by-row in strict chronological order.
        Guarantees that row i only has access to transactions from rows 0 to i-1.
        Future transactions never affect earlier events.
        """
        df = df.copy()

        # Ensure temporal sorting
        if "timestamp" in df.columns:
            df["sentinel_ts"] = pd.to_datetime(df["timestamp"])
            df = df.sort_values(by="sentinel_ts").reset_index(drop=True)
            has_timestamp = True
        elif "step" in df.columns:
            df = df.sort_values(by="step").reset_index(drop=True)
            has_timestamp = False
        else:
            has_timestamp = False

        n = len(df)
        feature_rows: List[Dict[str, float]] = []

        # Running state accumulators (populated strictly as we iterate forward in time)
        sender_counts: Dict[str, int] = {}
        sender_volumes: Dict[str, float] = {}
        recipient_inflows: Dict[str, int] = {}
        sender_recipient_pairs: set = set()
        recent_sender_events: Dict[str, List[Tuple[pd.Timestamp, str, float]]] = {}

        base_ts = pd.Timestamp("2026-01-01 00:00:00")

        for row in df.itertuples():
            amount = float(getattr(row, "amount", 0.0))
            channel = str(getattr(row, "channel", getattr(row, "type", "wire"))).lower()
            sender = str(getattr(row, "sender_account_id", getattr(row, "nameOrig", "unknown")))
            receiver = str(getattr(row, "receiver_account_id", getattr(row, "nameDest", "unknown")))

            current_ts = row.sentinel_ts if has_timestamp else base_ts + pd.to_timedelta(getattr(row, "step", 0), unit="h")

            # 1. State BEFORE this transaction (Strict Zero-Lookahead)
            prior_count = sender_counts.get(sender, 0)
            prior_volume = sender_volumes.get(sender, 0.0)
            prior_inflows = recipient_inflows.get(receiver, 0)
            is_new_pair = 1.0 if (sender, receiver) not in sender_recipient_pairs else 0.0

            # 1-hour window velocity calculations
            one_hour_ago = current_ts - pd.Timedelta(hours=1)
            sender_history = recent_sender_events.get(sender, [])
            valid_window = [e for e in sender_history if e[0] >= one_hour_ago]

            # Current transaction is added to window count/volume
            window_count = len(valid_window) + 1
            window_vol = sum(e[2] for e in valid_window) + amount
            unique_dests = len(set(e[1] for e in valid_window) | {receiver})
            fanout = unique_dests / max(window_count, 1)

            # Balance-delta features (pre-transaction balances, NOT post-transaction)
            sender_balance = float(getattr(row, "sender_balance_before", getattr(row, "oldbalanceOrg", 0.0)))
            receiver_balance = float(getattr(row, "receiver_balance_before", getattr(row, "oldbalanceDest", 0.0)))

            # Build single event feature dict using prior state
            context = {
                "sender_tx_count_prior": float(prior_count),
                "sender_volume_prior": float(prior_volume),
                "recipient_inflow_count_prior": float(prior_inflows),
                "is_new_recipient": is_new_pair,
                "velocity_1h_count": float(window_count),
                "velocity_1h_volume": float(window_vol),
                "unique_destinations_1h": float(unique_dests),
                "hour_of_day": float(current_ts.hour),
                "is_weekend": 1.0 if current_ts.dayofweek in (5, 6) else 0.0,
                "sender_balance_before": sender_balance,
                "receiver_balance_before": receiver_balance,
            }

            single_features = self.extract_single_transaction_features(
                transaction_data={
                    "amount": amount,
                    "channel": channel,
                    "timestamp": current_ts,
                    "sender_balance_before": sender_balance,
                    "receiver_balance_before": receiver_balance,
                },
                historical_context=context,
            )
            feature_rows.append(single_features)

            # 2. Update state AFTER this transaction has completed
            sender_counts[sender] = prior_count + 1
            sender_volumes[sender] = prior_volume + amount
            recipient_inflows[receiver] = prior_inflows + 1
            sender_recipient_pairs.add((sender, receiver))

            valid_window.append((current_ts, receiver, amount))
            recent_sender_events[sender] = valid_window

        features_df = pd.DataFrame(feature_rows)

        use_behavioral = self.include_behavioral if include_behavioral is None else include_behavioral
        if use_behavioral:
            from ml.features.fingerprint import BehavioralFingerprintEngine
            engine = BehavioralFingerprintEngine()
            bf_df = engine.transform_chronological(df, use_step_batching=True)
            new_cols = [c for c in bf_df.columns if c not in features_df.columns]
            features_df = pd.concat([features_df, bf_df[new_cols]], axis=1)

        return features_df

    def transform_batch(self, df: pd.DataFrame, include_behavioral: Optional[bool] = None) -> pd.DataFrame:
        """Alias for transform_chronological to maintain backwards compatibility."""
        return self.transform_chronological(df, include_behavioral=include_behavioral)


__all__ = ["FeatureEngineer"]
