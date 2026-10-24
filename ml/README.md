# Sentinel Machine Learning & Risk Intelligence

This module houses the ML pipelines for **Sentinel**, supporting behavioral fingerprinting, explainable risk scoring, and incremental risk assessment.

## Module Structure

- `data/`: Validation, schema enforcement, and loaders for tabular datasets.
  - `raw/`: Directory for raw datasets (ignored by Git; keep out of version control).
  - `processed/`: Intermediate feature tables.
- `features/`: Feature engineering logic.
  - `engineer.py`: Implements log transformations, velocity calculations, and graph feature extraction with strict zero-lookahead rules.
- `models/`: Model training wrappers and estimators.
  - `baseline.py`: Baseline model contract for scikit-learn / LightGBM / XGBoost estimators.
- `scoring/`: Inference-time scoring interface.
  - `interface.py`: Public `SentinelScorer` imported by backend API services.
- `evaluation/`: Objective evaluation metrics (ROC-AUC, PR-AUC, confusion matrices).
- `tests/`: Automated unit tests for data loading, feature transforms, scoring contracts, and metrics.

## Zero-Lookahead Rule

During inference and sequential replay, features must **only** consume data available at or before the timestamp of the transaction being evaluated. Future transactions and ground-truth fraud labels must never leak into inference-time feature generation.

## Usage Example

```python
from ml.scoring.interface import sentinel_scorer

transaction = {
    "amount": 45000.0,
    "channel": "wire",
    "sender_account_id": "ACC-7749",
    "receiver_account_id": "ACC-4410",
    "timestamp": "2026-10-24T14:10:02Z",
}

historical_context = {
    "velocity_1h_count": 8,
    "velocity_1h_volume": 280000.0,
    "unique_destinations_1h": 6,
}

result = sentinel_scorer.score_transaction(transaction, historical_context)
print("Risk Score:", result["risk_score"])
print("Top Factors:", result["factors"])
```
