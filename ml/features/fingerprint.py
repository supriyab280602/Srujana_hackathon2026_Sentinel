"""
Account-Level Behavioral Fingerprinting Module for Sentinel ML Pipeline.
Maintains incremental, zero-lookahead statistical profiles for accounts,
calculating historical amount distributions (mean, std, z-score via Welford's algorithm),
transaction type shares, counterparty relationships, and explainable anomaly indicators.

Enforces strict temporal validity:
- For events sharing a PaySim 'step', features are computed from history strictly before that step,
  and profile state is updated after the time-step batch completes.
- Excludes current transaction from its own profile.
- Handles cold-start accounts with explicit insufficiency indicators.
"""
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Set, Tuple
import math
import numpy as np
import pandas as pd


@dataclass
class AccountProfile:
    """
    Maintains running historical statistics for an individual account.
    Uses Welford's algorithm for numerically stable incremental mean and variance.
    """
    account_id: str
    tx_count: int = 0
    total_volume: float = 0.0
    amount_mean: float = 0.0
    amount_m2: float = 0.0  # Sum of squared differences from the running mean
    min_amount: float = float("inf")
    max_amount: float = float("-inf")
    channel_counts: Dict[str, int] = field(default_factory=dict)
    recipient_counts: Dict[str, int] = field(default_factory=dict)
    inflow_count: int = 0
    inflow_volume: float = 0.0
    last_seen_step: Optional[int] = None
    last_seen_ts: Optional[pd.Timestamp] = None

    def sample_variance(self) -> float:
        """Computes unbiased sample variance (N - 1 denominator)."""
        if self.tx_count < 2:
            return 0.0
        return max(0.0, self.amount_m2 / (self.tx_count - 1))

    def sample_std(self) -> float:
        """Computes sample standard deviation."""
        return math.sqrt(self.sample_variance())

    def update_outbound(
        self,
        amount: float,
        channel: str,
        receiver_id: str,
        step: Optional[int] = None,
        timestamp: Optional[pd.Timestamp] = None,
    ) -> None:
        """
        Updates profile state AFTER outbound transaction feature computation.
        Applies Welford's one-pass incremental mean and M2 update.
        """
        valid_amount = max(0.0, float(amount)) if np.isfinite(amount) else 0.0

        # Welford's update
        self.tx_count += 1
        delta = valid_amount - self.amount_mean
        self.amount_mean += delta / self.tx_count
        delta2 = valid_amount - self.amount_mean
        self.amount_m2 += delta * delta2

        self.total_volume += valid_amount
        if valid_amount < self.min_amount:
            self.min_amount = valid_amount
        if valid_amount > self.max_amount:
            self.max_amount = valid_amount

        # Channel frequency
        ch = str(channel).lower()
        self.channel_counts[ch] = self.channel_counts.get(ch, 0) + 1

        # Counterparty frequency
        rec = str(receiver_id)
        if rec and rec != "unknown":
            self.recipient_counts[rec] = self.recipient_counts.get(rec, 0) + 1

        if step is not None:
            self.last_seen_step = step
        if timestamp is not None:
            self.last_seen_ts = timestamp

    def update_inbound(
        self,
        amount: float,
        step: Optional[int] = None,
        timestamp: Optional[pd.Timestamp] = None,
    ) -> None:
        """Updates inbound transfer history when this account acts as recipient."""
        valid_amount = max(0.0, float(amount)) if np.isfinite(amount) else 0.0
        self.inflow_count += 1
        self.inflow_volume += valid_amount
        if step is not None:
            self.last_seen_step = step
        if timestamp is not None:
            self.last_seen_ts = timestamp


class BehavioralFingerprintEngine:
    """
    Coordinates account-level behavioral feature extraction, Welford statistical profiling,
    step-batch chronological replay, and explainable anomaly indicator synthesis.
    """

    MIN_HISTORY_FOR_PROFILE: int = 3  # Minimum transactions to establish reliable baseline
    MAX_ZSCORE_CLIP: float = 10.0      # Bound extreme outliers to avoid numerical volatility

    BEHAVIORAL_FEATURE_NAMES = [
        "sender_history_count",
        "sender_has_sufficient_history",
        "sender_amount_mean_prior",
        "sender_amount_std_prior",
        "sender_amount_deviation_prior",
        "sender_amount_zscore_prior",
        "sender_amount_ratio_to_mean_prior",
        "sender_type_share_prior",
        "sender_type_unseen_prior",
        "recipient_inflow_count_prior",
        "recipient_inflow_volume_prior",
        "is_new_recipient",
    ]

    def __init__(self, min_history_threshold: int = 3):
        self.min_history_threshold = min_history_threshold
        self.profiles: Dict[str, AccountProfile] = {}
        # Buffer for step-batch processing (updates applied at step boundary)
        self._pending_updates: List[Tuple[str, str, float, str, Optional[int], Optional[pd.Timestamp]]] = []
        self._current_step: Optional[int] = None

    def get_or_create_profile(self, account_id: str) -> AccountProfile:
        """Retrieves existing profile or initializes empty cold-start profile."""
        aid = str(account_id or "unknown")
        if aid not in self.profiles:
            self.profiles[aid] = AccountProfile(account_id=aid)
        return self.profiles[aid]

    def compute_transaction_features(
        self,
        transaction: Dict[str, Any],
        historical_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, float]:
        """
        Extracts zero-lookahead behavioral features for a single transaction.
        Consumes ONLY the account profile state available strictly before this event.
        Does NOT update the profile.
        """
        context = historical_context or {}
        sender_id = str(transaction.get("sender_account_id", transaction.get("nameOrig", "unknown")))
        receiver_id = str(transaction.get("receiver_account_id", transaction.get("nameDest", "unknown")))
        channel = str(transaction.get("channel", transaction.get("type", "unknown"))).lower()

        raw_amount = transaction.get("amount", 0.0)
        try:
            amount = float(raw_amount)
            if not np.isfinite(amount) or amount < 0.0:
                amount = 0.0
        except (ValueError, TypeError):
            amount = 0.0

        sender_profile = self.profiles.get(sender_id)
        receiver_profile = self.profiles.get(receiver_id)

        # 1. Sender Outbound History & Cold Start
        if sender_profile is None or sender_profile.tx_count == 0:
            # Complete Cold Start: No prior transaction history
            history_count = 0.0
            has_sufficient = 0.0
            prior_mean = 0.0
            prior_std = 0.0
            deviation = 0.0
            zscore = 0.0
            ratio_to_mean = 1.0  # Neutral default
            type_share = 0.0
            type_unseen = 1.0
            is_new_recip = 1.0
        else:
            n_prior = sender_profile.tx_count
            history_count = float(n_prior)
            prior_mean = sender_profile.amount_mean
            prior_std = sender_profile.sample_std()
            deviation = amount - prior_mean
            ratio_to_mean = float(amount / (prior_mean + 1e-5))

            # Channel / Type familiarity
            channel_hits = sender_profile.channel_counts.get(channel, 0)
            type_share = float(channel_hits / n_prior)
            type_unseen = 1.0 if channel_hits == 0 else 0.0

            # Counterparty familiarity
            is_new_recip = 1.0 if sender_profile.recipient_counts.get(receiver_id, 0) == 0 else 0.0

            # Sufficient history assessment
            if n_prior >= self.min_history_threshold:
                has_sufficient = 1.0
                if prior_std > 1e-5:
                    raw_z = (amount - prior_mean) / prior_std
                    # Clip extreme z-scores to prevent outlier distortion
                    zscore = float(np.clip(raw_z, -self.MAX_ZSCORE_CLIP, self.MAX_ZSCORE_CLIP))
                else:
                    # Zero variance in history (e.g. all previous amounts identical)
                    if math.isclose(amount, prior_mean, abs_tol=1e-3):
                        zscore = 0.0
                    elif amount > prior_mean:
                        zscore = 3.0  # Definite shift above uniform amount
                    else:
                        zscore = -3.0
            else:
                # Insufficient history for stable standard deviation/z-score
                has_sufficient = 0.0
                zscore = 0.0

        # 2. Recipient Inflow History
        if receiver_profile is None or receiver_profile.inflow_count == 0:
            recip_inflow_count = 0.0
            recip_inflow_vol = 0.0
        else:
            recip_inflow_count = float(receiver_profile.inflow_count)
            recip_inflow_vol = float(receiver_profile.inflow_volume)

        # Allow historical context overrides if supplied from external upstream store
        if "sender_amount_mean_prior" in context:
            prior_mean = float(context["sender_amount_mean_prior"])
        if "sender_amount_std_prior" in context:
            prior_std = float(context["sender_amount_std_prior"])
        if "sender_amount_zscore_prior" in context:
            zscore = float(context["sender_amount_zscore_prior"])

        return {
            "sender_history_count": history_count,
            "sender_has_sufficient_history": has_sufficient,
            "sender_amount_mean_prior": prior_mean,
            "sender_amount_std_prior": prior_std,
            "sender_amount_deviation_prior": deviation,
            "sender_amount_zscore_prior": zscore,
            "sender_amount_ratio_to_mean_prior": ratio_to_mean,
            "sender_type_share_prior": type_share,
            "sender_type_unseen_prior": type_unseen,
            "recipient_inflow_count_prior": recip_inflow_count,
            "recipient_inflow_volume_prior": recip_inflow_vol,
            "is_new_recipient": is_new_recip,
        }

    def update_profile(
        self,
        transaction: Dict[str, Any],
        step: Optional[int] = None,
        timestamp: Optional[pd.Timestamp] = None,
    ) -> None:
        """
        Immediately updates sender outbound and recipient inbound profiles for a single transaction.
        Use this for sequential online inference or when exact microsecond ordering is available.
        """
        sender_id = str(transaction.get("sender_account_id", transaction.get("nameOrig", "unknown")))
        receiver_id = str(transaction.get("receiver_account_id", transaction.get("nameDest", "unknown")))
        channel = str(transaction.get("channel", transaction.get("type", "unknown"))).lower()
        amount = float(transaction.get("amount", 0.0))

        if sender_id and sender_id != "unknown":
            sender_prof = self.get_or_create_profile(sender_id)
            sender_prof.update_outbound(amount, channel, receiver_id, step=step, timestamp=timestamp)

        if receiver_id and receiver_id != "unknown":
            receiver_prof = self.get_or_create_profile(receiver_id)
            receiver_prof.update_inbound(amount, step=step, timestamp=timestamp)

    def process_step_batch(
        self,
        transactions: List[Dict[str, Any]],
        step: Optional[int] = None,
    ) -> List[Dict[str, float]]:
        """
        Processes a batch of transactions belonging to the same PaySim time-step.
        Guarantees that:
        1. All transactions in the batch are evaluated against state BEFORE this step.
        2. No transaction in the step influences any other transaction in the same step.
        3. All profiles are updated only after the entire step batch has completed.
        """
        batch_features: List[Dict[str, float]] = []

        # 1. Compute features for all transactions in step strictly before applying updates
        for txn in transactions:
            feats = self.compute_transaction_features(txn)
            batch_features.append(feats)

        # 2. Update profiles after all features in this step have been calculated
        for txn in transactions:
            ts = txn.get("timestamp")
            if ts is not None and not isinstance(ts, pd.Timestamp):
                try:
                    ts = pd.to_datetime(ts)
                except Exception:
                    ts = None
            txn_step = txn.get("step", step)
            self.update_profile(txn, step=txn_step, timestamp=ts)

        return batch_features

    def transform_chronological(
        self,
        df: pd.DataFrame,
        use_step_batching: bool = True,
    ) -> pd.DataFrame:
        """
        Transforms a transaction DataFrame into behavioral feature vectors in strict chronological order.
        When `use_step_batching` is True and `step` column exists:
        Transactions sharing the same `step` are processed in batch (zero within-step lookahead).
        Otherwise, transactions are processed sequentially by timestamp.
        """
        df = df.copy()

        has_step = "step" in df.columns
        has_timestamp = "timestamp" in df.columns

        if has_step:
            df["_sort_key"] = df["step"]
            df = df.sort_values(by="_sort_key").reset_index(drop=True)
        elif has_timestamp:
            df["_sort_key"] = pd.to_datetime(df["timestamp"])
            df = df.sort_values(by="_sort_key").reset_index(drop=True)

        feature_records: List[Dict[str, float]] = []

        if use_step_batching and has_step:
            # Group by step to enforce zero within-step leakage
            step_groups = df.groupby("step", sort=False)
            for step_val, group in step_groups:
                # Extract records for step
                txns = group.to_dict(orient="records")
                # Compute features against pre-step state, then flush updates
                step_feats = self.process_step_batch(txns, step=int(step_val))
                feature_records.extend(step_feats)
        else:
            # Sequential processing (one-by-one forward in time)
            for row in df.itertuples():
                txn_dict = {
                    "sender_account_id": getattr(row, "sender_account_id", getattr(row, "nameOrig", "unknown")),
                    "receiver_account_id": getattr(row, "receiver_account_id", getattr(row, "nameDest", "unknown")),
                    "amount": getattr(row, "amount", 0.0),
                    "channel": getattr(row, "channel", getattr(row, "type", "unknown")),
                    "step": getattr(row, "step", None),
                    "timestamp": getattr(row, "timestamp", None),
                }
                feats = self.compute_transaction_features(txn_dict)
                feature_records.append(feats)
                self.update_profile(txn_dict, step=txn_dict["step"], timestamp=txn_dict["timestamp"])

        return pd.DataFrame(feature_records)

    def get_behavioral_indicators(
        self,
        transaction: Dict[str, Any],
        features: Optional[Dict[str, float]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Synthesizes explainable behavioral indicators grounded in calculated statistical features.
        Distinguishes:
        - Consistent behavior vs anomaly
        - Insufficient history (cold-start)
        - Extreme amount deviation (z-score / ratio)
        - Unseen transaction rails
        - New recipient counterparty activity
        """
        feats = features or self.compute_transaction_features(transaction)
        indicators: List[Dict[str, Any]] = []

        amount = float(transaction.get("amount", 0.0))
        channel = str(transaction.get("channel", transaction.get("type", "unknown"))).upper()
        receiver = str(transaction.get("receiver_account_id", transaction.get("nameDest", "unknown")))

        has_sufficient = bool(feats.get("sender_has_sufficient_history", 0.0) == 1.0)
        history_count = int(feats.get("sender_history_count", 0))
        prior_mean = float(feats.get("sender_amount_mean_prior", 0.0))
        prior_std = float(feats.get("sender_amount_std_prior", 0.0))
        zscore = float(feats.get("sender_amount_zscore_prior", 0.0))
        ratio_to_mean = float(feats.get("sender_amount_ratio_to_mean_prior", 1.0))
        is_unseen_type = bool(feats.get("sender_type_unseen_prior", 0.0) == 1.0)
        is_new_recip = bool(feats.get("is_new_recipient", 0.0) == 1.0)

        # 1. Cold Start / Insufficient History Indicator
        if not has_sufficient:
            indicators.append({
                "code": "INSUFFICIENT_HISTORY",
                "name": "Insufficient Account History",
                "severity": "info",
                "description": f"Account has only {history_count} recorded transaction(s); historical baseline is not yet statistically reliable.",
                "metric_value": history_count,
                "baseline_value": self.min_history_threshold,
            })

        # 2. Extreme / Significant Amount Deviation
        if has_sufficient:
            if zscore >= 3.0 or ratio_to_mean >= 5.0:
                indicators.append({
                    "code": "AMOUNT_ZSCORE_CRITICAL",
                    "name": "Severe Amount Deviation",
                    "severity": "high",
                    "description": f"Transaction amount (${amount:,.2f}) is {zscore:.1f} standard deviations above historical mean (${prior_mean:,.2f}, ratio: {ratio_to_mean:.1f}x).",
                    "metric_value": round(zscore, 2),
                    "baseline_value": round(prior_mean, 2),
                })
            elif zscore >= 2.0 or ratio_to_mean >= 2.5:
                indicators.append({
                    "code": "AMOUNT_ZSCORE_ELEVATED",
                    "name": "Elevated Amount Anomaly",
                    "severity": "medium",
                    "description": f"Transaction amount (${amount:,.2f}) is {zscore:.1f} standard deviations above historical mean (${prior_mean:,.2f}).",
                    "metric_value": round(zscore, 2),
                    "baseline_value": round(prior_mean, 2),
                })

        # 3. Unseen Transaction Type / Rail
        if history_count >= 1 and is_unseen_type:
            indicators.append({
                "code": "UNSEEN_TRANSACTION_RAIL",
                "name": "Unseen Payment Rail",
                "severity": "medium",
                "description": f"Transaction rail '{channel}' has never been used across {history_count} prior outbound transactions.",
                "metric_value": 1.0,
                "baseline_value": 0.0,
            })

        # 4. New Recipient / Counterparty
        if history_count >= 2 and is_new_recip and receiver != "unknown":
            indicators.append({
                "code": "NEW_RECIPIENT_TRANSFER",
                "name": "First-Time Counterparty",
                "severity": "low",
                "description": f"Sender has never previously transferred funds to recipient {receiver}.",
                "metric_value": 1.0,
                "baseline_value": 0.0,
            })

        # 5. Behaviorally Consistent (Normal baseline confirmation)
        if has_sufficient and abs(zscore) < 1.5 and not is_unseen_type and not indicators:
            indicators.append({
                "code": "BEHAVIOR_CONSISTENT",
                "name": "Consistent With Profile Baseline",
                "severity": "low",
                "description": f"Transaction amount (${amount:,.2f}) and rail ({channel}) match the account's historical spending profile.",
                "metric_value": round(zscore, 2),
                "baseline_value": round(prior_mean, 2),
            })

        return indicators

    def reset(self) -> None:
        """Clears all stored account profiles and pending updates."""
        self.profiles.clear()
        self._pending_updates.clear()
        self._current_step = None


__all__ = ["BehavioralFingerprintEngine", "AccountProfile"]
