"""
Data Validation and Loading Module for Sentinel ML Pipeline.
Responsible for loading raw financial transaction logs and validating schema integrity.
"""
from typing import Optional, List, Dict, Any
import pandas as pd


REQUIRED_COLUMNS = [
    "transaction_id",
    "sender_account_id",
    "receiver_account_id",
    "amount",
    "currency",
    "timestamp",
    "channel",
]


class DataLoader:
    """Loads and validates tabular transaction data."""

    def __init__(self, raw_data_path: Optional[str] = None):
        self.raw_data_path = raw_data_path

    def load_transactions(self, file_path: Optional[str] = None) -> pd.DataFrame:
        """
        Loads transaction data from CSV or Parquet into a pandas DataFrame.
        Note: Large dataset files are git-ignored in ml/data/raw/.
        """
        target = file_path or self.raw_data_path
        if not target:
            raise ValueError("No transaction data path specified.")

        if target.endswith(".parquet"):
            df = pd.read_parquet(target)
        else:
            df = pd.read_csv(target)

        self.validate_schema(df)
        return df

    def validate_schema(self, df: pd.DataFrame) -> bool:
        """
        Ensures all mandatory transaction columns exist and basic types align.
        Raises ValueError if required attributes are missing.
        """
        missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
        if missing:
            raise ValueError(f"Transaction dataset missing required columns: {missing}")

        if (df["amount"] < 0).any():
            raise ValueError("Found invalid negative amounts in transaction dataset.")

        return True


__all__ = ["DataLoader", "REQUIRED_COLUMNS"]
