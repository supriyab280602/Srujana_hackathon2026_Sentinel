"""
Data Validation, Loading, and Ingestion Module for Sentinel ML Pipeline.
Responsible for loading tabular transaction logs (native Sentinel schema or PaySim format),
validating schema integrity, handling missing values and duplicates, and strictly separating
features, identifiers, and ground-truth labels.
"""
import os
import logging
from typing import Optional, List, Dict, Any, Tuple
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

# Native Sentinel canonical schema
REQUIRED_CANONICAL_COLUMNS = [
    "transaction_id",
    "sender_account_id",
    "receiver_account_id",
    "amount",
    "currency",
    "timestamp",
    "channel",
]

# PaySim standard columns
PAYSIM_COLUMNS = [
    "step",
    "type",
    "amount",
    "nameOrig",
    "oldbalanceOrg",
    "newbalanceOrig",
    "nameDest",
    "oldbalanceDest",
    "newbalanceDest",
    "isFraud",
    "isFlaggedFraud",
]

# Post-transaction fields that must NEVER be used for pre-transaction risk inference
PROHIBITED_LEAKAGE_COLUMNS = [
    "newbalanceOrig",
    "newbalanceDest",
    "isFlaggedFraud",
]

# PaySim transaction types that actually contain fraud labels
FRAUD_ELIGIBLE_TYPES = ["TRANSFER", "CASH_OUT"]


class DataLoader:
    """Loads, validates, and prepares tabular transaction data for ML processing."""

    def __init__(self, raw_data_path: Optional[str] = None):
        self.raw_data_path = raw_data_path

    @staticmethod
    def check_dataset_availability(directory: str = "ml/data/raw") -> Optional[str]:
        """
        Inspects the directory for raw transaction dataset files (.csv or .parquet).
        Returns the path to the first valid dataset found, or None if unavailable.
        """
        if not os.path.exists(directory):
            return None

        candidates = [
            f for f in os.listdir(directory)
            if (f.endswith(".csv") or f.endswith(".parquet")) and not f.startswith(".")
        ]
        if candidates:
            return os.path.join(directory, candidates[0])
        return None

    def load_transactions(
        self,
        file_path: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> pd.DataFrame:
        """
        Loads raw transaction data from CSV or Parquet into a DataFrame.
        Supports configurable row limits for fast development and testing on large files.
        """
        target = file_path or self.raw_data_path
        if not target:
            raise FileNotFoundError(
                "No transaction dataset path specified. Ensure a dataset is provided or placed in ml/data/raw/."
            )

        if not os.path.exists(target):
            raise FileNotFoundError(f"Transaction dataset file not found at: {target}")

        if target.endswith(".parquet"):
            df = pd.read_parquet(target)
            if limit is not None:
                df = df.iloc[:limit].copy()
        else:
            df = pd.read_csv(target, nrows=limit)

        # Detect schema and normalize if PaySim
        if self.is_paysim_schema(df):
            df = self.normalize_paysim_dataset(df)
        else:
            self.validate_schema(df)

        # Handle missing values and duplicates deliberately
        df = self.clean_dataset(df)

        return df

    def load_fraud_enriched(
        self,
        file_path: Optional[str] = None,
        limit: Optional[int] = None,
        fraud_ratio: float = 0.05,
        min_fraud_samples: int = 500,
    ) -> pd.DataFrame:
        """
        Loads PaySim data with fraud-aware stratified sampling:
        1. Filters to only TRANSFER and CASH_OUT types (the only types with fraud in PaySim).
        2. Takes ALL fraud cases from those types.
        3. Samples legitimate transactions to achieve target fraud_ratio.
        4. If limit is set, caps total rows at limit while preserving fraud ratio.

        This guarantees the training set has enough fraud signal for a meaningful model.
        """
        target = file_path or self.raw_data_path
        if not target:
            raise FileNotFoundError(
                "No transaction dataset path specified. Ensure a dataset is provided or placed in ml/data/raw/."
            )

        if not os.path.exists(target):
            raise FileNotFoundError(f"Transaction dataset file not found at: {target}")

        # Load full file (or large chunk) to find all fraud cases
        logger.info(f"Loading dataset for fraud-enriched sampling: {target}")
        if target.endswith(".parquet"):
            df_raw = pd.read_parquet(target)
        else:
            df_raw = pd.read_csv(target)

        # Check if PaySim schema
        if not self.is_paysim_schema(df_raw):
            logger.info("Non-PaySim schema detected, falling back to standard load.")
            if limit:
                df_raw = df_raw.iloc[:limit].copy()
            return self.clean_dataset(df_raw)

        # Step 1: Filter to fraud-eligible transaction types only
        df_eligible = df_raw[df_raw["type"].isin(FRAUD_ELIGIBLE_TYPES)].copy()
        logger.info(
            f"Filtered to fraud-eligible types ({FRAUD_ELIGIBLE_TYPES}): "
            f"{len(df_eligible)} rows from {len(df_raw)} total."
        )

        # Step 2: Separate fraud and legitimate
        fraud_df = df_eligible[df_eligible["isFraud"] == 1].copy()
        legit_df = df_eligible[df_eligible["isFraud"] == 0].copy()

        n_fraud = len(fraud_df)
        logger.info(f"Found {n_fraud} fraud cases in eligible types.")

        if n_fraud == 0:
            logger.warning("No fraud cases found. Returning eligible subset only.")
            if limit:
                df_eligible = df_eligible.iloc[:limit]
            df_eligible = self.normalize_paysim_dataset(df_eligible)
            return self.clean_dataset(df_eligible)

        # Step 3: Calculate how many legitimate samples to take
        # Target: fraud_ratio = n_fraud / (n_fraud + n_legit_sample)
        # => n_legit_sample = n_fraud * (1 - fraud_ratio) / fraud_ratio
        target_legit = int(n_fraud * (1.0 - fraud_ratio) / fraud_ratio)

        # Apply limit constraint
        if limit is not None:
            max_legit = limit - n_fraud
            target_legit = min(target_legit, max(max_legit, 0))

        # Ensure we have enough legitimate samples
        if target_legit > len(legit_df):
            target_legit = len(legit_df)

        # Stratified sample of legitimate transactions (preserving temporal order)
        legit_sampled = legit_df.sample(
            n=target_legit, random_state=42
        ).sort_values("step")

        # Step 4: Combine and sort chronologically
        df_combined = pd.concat([fraud_df, legit_sampled], ignore_index=True)
        df_combined = df_combined.sort_values("step").reset_index(drop=True)

        actual_ratio = n_fraud / len(df_combined) if len(df_combined) > 0 else 0
        logger.info(
            f"Fraud-enriched dataset: {len(df_combined)} rows, "
            f"{n_fraud} fraud ({actual_ratio:.2%} prevalence)."
        )

        # Step 5: Normalize and clean
        df_combined = self.normalize_paysim_dataset(df_combined)
        df_combined = self.clean_dataset(df_combined)

        return df_combined

    def load_chronological_splits(
        self,
        file_path: Optional[str] = None,
        limit: Optional[int] = None,
        train_ratio: float = 0.6,
        val_ratio: float = 0.2,
        test_ratio: float = 0.2,
        target_train_fraud_ratio: Optional[float] = 0.05,
        filter_eligible_types: bool = True,
        stride: int = 1,
        random_state: int = 42,
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
        """
        Loads dataset in strict chronological order and splits into 3 partitions:
        Train (default 60%), Validation (default 20%), Test (default 20%).

        Methodological Integrity:
        - Downsampling of the majority class is applied EXCLUSIVELY to the training split.
        - Validation and Test splits are preserved at NATURAL prevalence without artificial enrichment.
        - Splits are strictly chronological: no future events leak into earlier splits.
        - Stride parameter enables uniform temporal sampling across the full multi-week timeline.
        """
        target = file_path or self.raw_data_path
        if not target:
            raise FileNotFoundError(
                "No transaction dataset path specified. Ensure a dataset is provided or placed in ml/data/raw/."
            )
        if not os.path.exists(target):
            raise FileNotFoundError(f"Transaction dataset file not found at: {target}")

        logger.info(f"Loading dataset for chronological 3-way split: {target} (stride={stride}, limit={limit})")

        is_parquet = target.endswith(".parquet")
        if not is_parquet and filter_eligible_types:
            chunks = []
            rows_loaded = 0
            for chunk in pd.read_csv(target, chunksize=250000):
                if self.is_paysim_schema(chunk):
                    tc = chunk[chunk["type"].isin(FRAUD_ELIGIBLE_TYPES)]
                else:
                    tc = chunk
                if stride > 1:
                    tc = tc.iloc[::stride]
                chunks.append(tc)
                rows_loaded += len(tc)
                if limit and rows_loaded >= limit:
                    break
            df_raw = pd.concat(chunks, ignore_index=True)
            if limit:
                df_raw = df_raw.iloc[:limit].copy()
        else:
            if is_parquet:
                df_raw = pd.read_parquet(target)
            else:
                df_raw = pd.read_csv(target, nrows=limit if limit else None)
            if self.is_paysim_schema(df_raw) and filter_eligible_types:
                df_raw = df_raw[df_raw["type"].isin(FRAUD_ELIGIBLE_TYPES)].copy()
            if stride > 1:
                df_raw = df_raw.iloc[::stride].copy()
            if limit:
                df_raw = df_raw.iloc[:limit].copy()

        # Normalize and clean
        if self.is_paysim_schema(df_raw):
            df_cleaned = self.normalize_paysim_dataset(df_raw)
        else:
            df_cleaned = df_raw.copy()
        df_cleaned = self.clean_dataset(df_cleaned)

        # Ensure strict chronological sorting
        if "timestamp" in df_cleaned.columns:
            df_cleaned = df_cleaned.sort_values(by="timestamp").reset_index(drop=True)
        elif "step" in df_cleaned.columns:
            df_cleaned = df_cleaned.sort_values(by="step").reset_index(drop=True)

        n_total = len(df_cleaned)
        train_end = int(n_total * train_ratio)
        val_end = int(n_total * (train_ratio + val_ratio))

        df_train_raw = df_cleaned.iloc[:train_end].copy().reset_index(drop=True)
        df_val = df_cleaned.iloc[train_end:val_end].copy().reset_index(drop=True)
        df_test = df_cleaned.iloc[val_end:].copy().reset_index(drop=True)

        # Downsample training negatives if target_train_fraud_ratio is specified
        if target_train_fraud_ratio is not None and "is_fraud" in df_train_raw.columns:
            fraud_train = df_train_raw[df_train_raw["is_fraud"] == 1]
            legit_train = df_train_raw[df_train_raw["is_fraud"] == 0]
            n_train_fraud = len(fraud_train)

            if n_train_fraud > 0 and len(legit_train) > 0:
                target_legit = int(n_train_fraud * (1.0 - target_train_fraud_ratio) / target_train_fraud_ratio)
                if target_legit < len(legit_train):
                    legit_sampled = legit_train.sample(n=target_legit, random_state=random_state)
                    df_train = pd.concat([fraud_train, legit_sampled], ignore_index=True)
                    if "timestamp" in df_train.columns:
                        df_train = df_train.sort_values("timestamp").reset_index(drop=True)
                    elif "step" in df_train.columns:
                        df_train = df_train.sort_values("step").reset_index(drop=True)
                else:
                    df_train = df_train_raw
            else:
                df_train = df_train_raw
        else:
            df_train = df_train_raw

        def _stats(d: pd.DataFrame, name: str) -> Dict[str, Any]:
            f_count = int(d["is_fraud"].sum()) if "is_fraud" in d.columns else 0
            prev = float(f_count / max(len(d), 1))
            step_min = int(d["step"].min()) if "step" in d.columns and len(d) > 0 else None
            step_max = int(d["step"].max()) if "step" in d.columns and len(d) > 0 else None
            return {
                "partition": name,
                "total_samples": len(d),
                "fraud_count": f_count,
                "fraud_prevalence": prev,
                "step_min": step_min,
                "step_max": step_max,
            }

        split_meta = {
            "total_pre_downsampling": n_total,
            "train": _stats(df_train, "train"),
            "train_unfiltered_size": len(df_train_raw),
            "validation": _stats(df_val, "validation"),
            "test": _stats(df_test, "test"),
        }

        logger.info(
            f"Chronological 3-way split created:\n"
            f"  Train: {split_meta['train']['total_samples']} rows ({split_meta['train']['fraud_count']} fraud, {split_meta['train']['fraud_prevalence']:.2%})\n"
            f"  Val:   {split_meta['validation']['total_samples']} rows ({split_meta['validation']['fraud_count']} fraud, {split_meta['validation']['fraud_prevalence']:.2%})\n"
            f"  Test:  {split_meta['test']['total_samples']} rows ({split_meta['test']['fraud_count']} fraud, {split_meta['test']['fraud_prevalence']:.2%})"
        )

        return df_train, df_val, df_test, split_meta

    def is_paysim_schema(self, df: pd.DataFrame) -> bool:
        """Checks if the dataframe matches the PaySim schema."""
        paysim_core = ["step", "type", "amount", "nameOrig", "nameDest", "isFraud"]
        return all(col in df.columns for col in paysim_core)

    def normalize_paysim_dataset(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Normalizes a PaySim dataset into the Sentinel structure:
        - Maps 'nameOrig' -> 'sender_account_id'
        - Maps 'nameDest' -> 'receiver_account_id'
        - Maps 'type' -> 'channel'
        - Maps 'isFraud' -> 'is_fraud' (ground-truth target)
        - Synthesizes synthetic timestamp from 'step' (hours elapsed)
        - Computes balance-delta features (pre-transaction only)
        - Excludes prohibited post-transaction leakage columns (newbalanceOrig, newbalanceDest, isFlaggedFraud)
        """
        df = df.copy()

        # Generate a unique transaction id if not present
        if "transaction_id" not in df.columns:
            df["transaction_id"] = [f"TXN-PS-{i:08d}" for i in range(len(df))]

        df["sender_account_id"] = df["nameOrig"].astype(str)
        df["receiver_account_id"] = df["nameDest"].astype(str)
        df["channel"] = df["type"].astype(str).str.lower()
        df["currency"] = "USD"

        # PaySim 'step' represents hours from simulation start (1 step = 1 hour)
        base_timestamp = pd.Timestamp("2026-01-01 00:00:00")
        df["timestamp"] = base_timestamp + pd.to_timedelta(df["step"], unit="h")

        if "isFraud" in df.columns:
            df["is_fraud"] = df["isFraud"].astype(int)

        # Retain pre-transaction sender/dest balances if present
        if "oldbalanceOrg" in df.columns:
            df["sender_balance_before"] = df["oldbalanceOrg"].astype(float)
        if "oldbalanceDest" in df.columns:
            df["receiver_balance_before"] = df["oldbalanceDest"].astype(float)

        # Compute balance-delta features (these use only pre-transaction balances + amount,
        # NOT post-transaction balances, so they are NOT leakage).
        # These are powerful signals: in PaySim fraud, the sender's account is often
        # drained completely and the receiver's old balance is often 0.
        if "oldbalanceOrg" in df.columns:
            # Ratio of transaction amount to sender's available balance
            df["amount_to_balance_ratio"] = df["amount"] / (df["oldbalanceOrg"] + 1.0)
            # Whether the sender is draining most of their balance
            df["is_balance_drain"] = (
                df["amount"] >= df["oldbalanceOrg"] * 0.9
            ).astype(float)

        if "oldbalanceDest" in df.columns:
            # Whether recipient has zero prior balance (common mule pattern)
            df["receiver_zero_balance"] = (df["oldbalanceDest"] == 0.0).astype(float)

        # Drop post-transaction leakage columns
        for col in PROHIBITED_LEAKAGE_COLUMNS:
            if col in df.columns:
                df = df.drop(columns=[col])

        return df

    def validate_schema(self, df: pd.DataFrame) -> bool:
        """
        Ensures all mandatory canonical transaction columns exist and basic constraints hold.
        Raises ValueError if required attributes are missing.
        """
        missing = [col for col in REQUIRED_CANONICAL_COLUMNS if col not in df.columns]
        if missing:
            raise ValueError(f"Transaction dataset missing required columns: {missing}")

        if (df["amount"] < 0).any():
            raise ValueError("Found invalid negative amounts in transaction dataset.")

        return True

    def clean_dataset(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Handles missing values and duplicate rows deliberately:
        - Drops exact duplicate rows (identical sender, receiver, amount, timestamp/step).
        - Validates that amounts are non-negative and finite.
        - Fills or drops null values in essential columns with documented reasoning.
        """
        initial_count = len(df)
        df = df.copy()

        # 1. Deduplication
        dedup_cols = ["sender_account_id", "receiver_account_id", "amount", "timestamp"]
        existing_dedup_cols = [c for c in dedup_cols if c in df.columns]
        if existing_dedup_cols:
            df = df.drop_duplicates(subset=existing_dedup_cols, keep="first")

        # 2. Missing value handling
        # Drop rows with null essential identifiers or amounts
        critical_cols = ["sender_account_id", "receiver_account_id", "amount"]
        df = df.dropna(subset=[c for c in critical_cols if c in df.columns])

        # Remove negative or non-finite amounts
        df = df[np.isfinite(df["amount"]) & (df["amount"] >= 0)]

        # Ensure channel has valid strings
        if "channel" in df.columns:
            df["channel"] = df["channel"].fillna("unknown").astype(str).str.lower()

        # Ensure timestamp is datetime
        if "timestamp" in df.columns and not pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
            df["timestamp"] = pd.to_datetime(df["timestamp"])

        # Sort chronologically to guarantee temporal order
        if "timestamp" in df.columns:
            df = df.sort_values(by="timestamp").reset_index(drop=True)
        elif "step" in df.columns:
            df = df.sort_values(by="step").reset_index(drop=True)

        return df

    def separate_features_and_labels(
        self, df: pd.DataFrame
    ) -> Tuple[pd.DataFrame, Optional[pd.Series], pd.DataFrame]:
        """
        Separates a dataset into:
        1. X: Input transaction fields for feature engineering.
        2. y: Ground-truth fraud label series (if 'is_fraud' column exists), or None.
        3. metadata: Identifiers and timestamps (transaction_id, timestamp, sender, receiver).
        """
        df = df.copy()

        # Extract target label
        y = None
        if "is_fraud" in df.columns:
            y = df["is_fraud"].astype(int)
            df = df.drop(columns=["is_fraud"])
        elif "isFraud" in df.columns:
            y = df["isFraud"].astype(int)
            df = df.drop(columns=["isFraud"])

        # Metadata columns
        meta_cols = [
            "transaction_id",
            "timestamp",
            "sender_account_id",
            "receiver_account_id",
            "currency",
        ]
        present_meta = [c for c in meta_cols if c in df.columns]
        metadata = df[present_meta].copy()

        # Exclude metadata and prohibited columns from X
        cols_to_drop = present_meta + [c for c in PROHIBITED_LEAKAGE_COLUMNS if c in df.columns]
        X = df.drop(columns=[c for c in cols_to_drop if c in df.columns])

        return X, y, metadata


__all__ = [
    "DataLoader",
    "REQUIRED_CANONICAL_COLUMNS",
    "PAYSIM_COLUMNS",
    "PROHIBITED_LEAKAGE_COLUMNS",
    "FRAUD_ELIGIBLE_TYPES",
]
