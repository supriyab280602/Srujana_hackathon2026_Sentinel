from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timezone, timedelta
from app.schemas.transaction import TransactionRead, TransactionCreate
from app.repositories.base import repo


def normalize_to_utc(ts: Union[datetime, str]) -> datetime:
    """
    Validates that a timestamp is timezone-aware and normalizes it to UTC.
    Rejects naive timestamps with ValueError to prevent temporal comparison ambiguity.
    """
    if isinstance(ts, str):
        ts_clean = ts.replace("Z", "+00:00") if ts.endswith("Z") else ts
        try:
            ts = datetime.fromisoformat(ts_clean)
        except ValueError as exc:
            raise ValueError(f"Invalid timestamp format: '{ts}'. Expected ISO-8601.") from exc

    if not isinstance(ts, datetime):
        raise TypeError(f"Timestamp must be a datetime or ISO-8601 string, got {type(ts).__name__}")

    if ts.tzinfo is None or ts.tzinfo.utcoffset(ts) is None:
        raise ValueError(
            "Timestamp must be timezone-aware (e.g., UTC with 'Z' or offset). "
            "Naive timestamps are rejected to prevent temporal comparison ambiguity."
        )

    return ts.astimezone(timezone.utc)


class TransactionService:
    """
    Manages transaction lifecycle, ledger retrieval, and account activity context.
    Provides clear service boundaries between HTTP endpoints, persistence, and feature extraction.
    """

    def get_account_transactions(self, account_id: str) -> List[TransactionRead]:
        return repo.get_transactions_by_account(account_id)

    def get_all_transactions(self) -> List[TransactionRead]:
        return repo.get_all_transactions()

    def get_transaction(self, transaction_id: str) -> Optional[TransactionRead]:
        return repo.get_transaction_by_id(transaction_id)

    def record_transaction(self, transaction: TransactionCreate) -> TransactionRead:
        return repo.add_transaction(transaction)

    def get_account_activity_context(
        self,
        account_id: str,
        as_of_timestamp: Union[datetime, str],
        lookback_days: int = 30,
    ) -> Dict[str, Any]:
        """
        Derives historical baseline activity without zero-lookahead temporal leakage.
        Used by ScoringService to enrich ML inference features during live scoring and historical replay.

        Windows:
        - 1-hour outgoing velocity: (as_of_timestamp - 1 hour, as_of_timestamp)
        - Longer-term historical context: (as_of_timestamp - lookback_days, as_of_timestamp)

        Boundary rules:
        - The exact cutoffs (as_of_timestamp - 1h, as_of_timestamp - lookback_days) are strictly excluded (>).
        - Transactions at or after as_of_timestamp (>=) are strictly excluded.
        - The transaction being scored is never included in its own historical context.
        - Incoming transfers are excluded; only outgoing transfers (sender_account_id == account_id) count.
        """
        if lookback_days <= 0:
            raise ValueError("lookback_days must be a positive integer")

        as_of_utc = normalize_to_utc(as_of_timestamp)
        cutoff_1h = as_of_utc - timedelta(hours=1)
        cutoff_lookback = as_of_utc - timedelta(days=lookback_days)

        txns = repo.get_transactions_by_account(account_id)

        outflows_1h: List[TransactionRead] = []
        outflows_lookback: List[TransactionRead] = []

        for t in txns:
            # Exclude incoming transfers: only outgoing transfers represent outbound velocity
            if t.sender_account_id != account_id:
                continue

            t_utc = normalize_to_utc(t.timestamp)

            # Strict zero-lookahead: exclude transactions at or after the reference timestamp
            if t_utc >= as_of_utc:
                continue

            # 1-hour outgoing window: (as_of_timestamp - 1 hour, as_of_timestamp)
            if t_utc > cutoff_1h:
                outflows_1h.append(t)

            # Longer-term lookback window: (as_of_timestamp - lookback_days, as_of_timestamp)
            if t_utc > cutoff_lookback:
                outflows_lookback.append(t)

        vol_1h = sum(t.amount for t in outflows_1h)
        unique_dest_1h = len(set(t.receiver_account_id for t in outflows_1h))
        vol_lookback = sum(t.amount for t in outflows_lookback)

        return {
            "velocity_1h_count": float(len(outflows_1h)),
            "velocity_1h_volume": float(vol_1h),
            "unique_destinations_1h": float(unique_dest_1h),
            "historical_tx_count": len(outflows_lookback),
            "historical_total_volume": float(vol_lookback),
            "total_volume": float(vol_lookback),
            "lookback_days": int(lookback_days),
            "hour_of_day": float(as_of_utc.hour),
            "is_weekend": 1.0 if as_of_utc.weekday() in (5, 6) else 0.0,
        }


transaction_service = TransactionService()
