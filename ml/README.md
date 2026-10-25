# Sentinel Machine Learning & Risk Intelligence Pipeline (Phase 3)

This module provides the reproducible transaction risk modeling and account-level behavioral fingerprinting pipeline for **Sentinel**, supporting behavioral anomaly detection, zero-lookahead feature extraction, Welford statistical profiling, baseline & candidate model training, performance evaluation under severe class imbalance, and integration with the FastAPI backend.

---

## 1. Behavioral Fingerprinting Design

Implemented in [`ml/features/fingerprint.py`](file:///c:/Users/athar/OneDrive/Desktop/Srujana_hackathon2026_Sentinel/ml/features/fingerprint.py).

The **Behavioral Fingerprint Engine** (`BehavioralFingerprintEngine`) maintains stateful statistical profiles for accounts, quantifying how unusual an incoming transaction is relative to that specific account's historical baseline.

### Key Capabilities:
1. **Incremental Welford Profiling**: Maintains running count, sum, mean, and sum of squared deviations ($M_2$) with $O(1)$ memory and compute per transaction without numerical instability.
2. **Cold-Start Distinction**: Accounts with fewer than 3 historical transactions are explicitly flagged with `sender_has_sufficient_history = 0.0`. Their z-scores are suppressed to $0.0$ to prevent false confidence on small sample sizes.
3. **Step-Batching for Temporal Integrity**: When transactions share a PaySim `step`, all transactions in that step compute features strictly using the profile state prior to that step. Profiles are updated only after the entire step batch has completed, guaranteeing zero within-step lookahead.
4. **Explainable Behavioral Indicators**: Rule-grounded anomaly indicators (`INSUFFICIENT_HISTORY`, `AMOUNT_ZSCORE_CRITICAL`, `UNSEEN_TRANSACTION_RAIL`, `NEW_RECIPIENT_TRANSFER`) grounded strictly in calculated statistics.

---

## 2. Feature Schema & Definitions

Sentinel features are split into baseline transaction/rail/velocity features (18) and account-level behavioral features (10), totaling 28 candidate features:

### A. Validated Baseline Features (18)
| Feature Name | Definition | Leakage Prevention |
| :--- | :--- | :--- |
| `log_amount` | $\ln(1 + \text{amount})$ | Pre-transaction observable |
| `is_high_risk_channel` | 1 if rail is `wire`, `crypto`, `transfer`, `cash_out`, else 0 | Current transaction attribute |
| `is_transfer_or_wire` | 1 if rail is `transfer` or `wire`, else 0 | Current transaction attribute |
| `is_cash_out` | 1 if rail is `cash_out` or `crypto`, else 0 | Current transaction attribute |
| `hour_of_day` | Circadian hour (0–23) from simulation step or timestamp | Temporal sorting |
| `is_night` | 1 if hour < 6 or hour >= 23, else 0 | Temporal sorting |
| `is_weekend` | 1 if day of week is Saturday/Sunday, else 0 | Temporal sorting |
| `sender_tx_count_prior` | Cumulative transactions sent by sender strictly before $T$ | Strict zero-lookahead |
| `sender_volume_prior` | Cumulative monetary volume sent by sender strictly before $T$ | Strict zero-lookahead |
| `amount_to_prior_avg_ratio` | Current amount / sender's historical average amount | Strict zero-lookahead |
| `recipient_inflow_count_prior` | Cumulative transactions received by recipient before $T$ | Strict zero-lookahead |
| `is_new_recipient` | 1 if sender has never transferred to recipient before, else 0 | Counterparty memory |
| `velocity_1h_count` | Number of transfers by sender in rolling 1-hour window | Sliding window $T - 1\text{h}$ |
| `velocity_1h_volume` | Total volume sent by sender in rolling 1-hour window | Sliding window $T - 1\text{h}$ |
| `fanout_ratio` | Unique recipients / `velocity_1h_count` | Sliding window $T - 1\text{h}$ |
| `amount_to_balance_ratio` | `amount / (sender_balance_before + 1.0)` | Pre-transaction balance |
| `is_balance_drain` | 1 if `amount >= sender_balance_before * 0.9`, else 0 | Pre-transaction balance |
| `receiver_zero_balance` | 1 if `receiver_balance_before == 0.0`, else 0 | Pre-transaction balance |

### B. Account-Level Behavioral Features (10 Genuinely New Features)
| Feature Name | Definition & Formula | Cold-Start Behavior ($N < 3$) |
| :--- | :--- | :--- |
| `sender_history_count` | Exact count $N$ of prior eligible transactions sent by account | $N = 0, 1, 2$ |
| `sender_has_sufficient_history` | Binary flag: $1.0$ if $N \ge 3$, else $0.0$ | $0.0$ |
| `sender_amount_mean_prior` | Welford running historical mean $\bar{x} = \frac{1}{N}\sum x_i$ | $0.0$ if $N=0$, else observed mean |
| `sender_amount_std_prior` | Welford sample standard deviation $s = \sqrt{\frac{M_2}{N - 1}}$ | $0.0$ if $N < 2$, else observed std |
| `sender_amount_deviation_prior` | Difference: $\text{amount} - \bar{x}$ | $0.0$ if $N=0$ |
| `sender_amount_zscore_prior` | Standardized score $z = \frac{\text{amount} - \bar{x}}{s}$, clipped to $[-10, 10]$ | $0.0$ (suppressed until $N \ge 3$) |
| `sender_amount_ratio_to_mean_prior` | Ratio: $\frac{\text{amount}}{\bar{x} + 10^{-5}}$ | $1.0$ (neutral default) |
| `sender_type_share_prior` | Fraction of prior transactions matching current rail: $\frac{N_{\text{rail}}}{N}$ | $0.0$ |
| `sender_type_unseen_prior` | 1 if sender has never used this payment rail before, else 0 | $1.0$ |
| `recipient_inflow_volume_prior` | Cumulative monetary volume received by recipient before $T$ | $0.0$ |

---

## 3. Temporal Integrity & Step-Batching

In financial transaction streams, temporal causality is paramount:
1. **Zero Future Leakage**: For each event at step $S$ and time $T$, only events strictly occurring before $S$ (or $T$) may contribute to the account profile.
2. **Same-Step Batch Handling**: In simulated datasets like PaySim, multiple events share the exact same hourly `step` integer with no sub-second ordering. The engine groups events by `step`:
   ```python
   # 1. Compute features for all events in step S against state from step < S
   step_features = [engine.compute_transaction_features(txn) for txn in step_txns]
   # 2. Update account profiles after all events in step S are processed
   for txn in step_txns:
       engine.update_profile(txn)
   ```
3. **Diurnal Time Assumptions**: PaySim `step` counts elapsed hours from simulation start ($1 \dots 743$). While step modulo 24 creates a circadian cycle, PaySim does not represent real-world UTC timestamps or localized business calendars. Stride-based sampling across all 743 steps ensures that training, validation, and test partitions all span multiple 24-hour cycles.

---

## 4. Models: Validated Baseline vs Candidate Behavioral

Both models are trained on the natural chronological 3-way split of PaySim (277,053 candidate TRANSFER/CASH_OUT rows, stride 10 across 31 simulation days):

| Metric | Validated Baseline (`baseline_rf.joblib`) | Candidate Behavioral (`candidate_behavioral_rf.joblib`) | Delta |
| :--- | :--- | :--- | :--- |
| **Model Version** | `v2.1-rf-chronological-validated` | `v3.0-rf-behavioral-candidate` | — |
| **Number of Features** | 18 features | 28 features (+10 behavioral) | +10 |
| **Test Set Size** | 55,411 rows | 55,411 rows | Identical holdout |
| **Test Fraud Prevalence** | 0.75% (416 fraud cases) | 0.75% (416 fraud cases) | Natural stream |
| **ROC-AUC** | 0.8382 | **0.8434** | **+0.0052** |
| **PR-AUC** | 0.4426 | **0.4430** | **+0.0004** |
| **Optimal Threshold ($\tau$)** | 0.9265 | 0.9026 | — |
| **Precision (at $\tau$)** | 81.75% | **82.71%** | **+0.96%** |
| **Recall (at $\tau$)** | 24.76% | **26.44%** | **+1.68%** |
| **F1-Score (at $\tau$)** | 0.3801 | **0.4007** | **+0.0206** |
| **False Positives (at $\tau$)** | 23 | 23 | 0.04% FPR |
| **True Positives (at $\tau$)** | 103 | **110** | **+7 caught** |

The candidate model demonstrates measurable improvement in ROC-AUC, Precision, Recall, and F1-score on the strictly held-out test partition. Both artifacts are preserved on disk.

---

## 5. Usage & Integration Guide

### A. Online Inference via `SentinelScorer`
```python
from ml.scoring.interface import sentinel_scorer

result = sentinel_scorer.score_transaction(
    transaction_data={
        "sender_account_id": "ACC-7749",
        "receiver_account_id": "ACC-4410",
        "amount": 250000.0,
        "currency": "USD",
        "channel": "wire",
    }
)

# Output includes risk score, factors, and behavioral indicators:
print("Risk Score:", result["risk_score"])
print("Behavioral Indicators:", result["behavioral_indicators"])
```

### B. Updating Profile State (Replay Mode or Stream Execution)
```python
# Update state after transaction executes
sentinel_scorer.update_profile({
    "sender_account_id": "ACC-7749",
    "receiver_account_id": "ACC-4410",
    "amount": 250000.0,
    "channel": "wire",
})

# Inspect account profile
profile = sentinel_scorer.get_account_profile("ACC-7749")
print(f"Count: {profile['tx_count']}, Mean: ${profile['amount_mean']:,.2f}, Std: ${profile['amount_std']:,.2f}")
```

### C. Training the Models
```bash
# Train validated baseline (18 features)
python ml/train.py --stride 10 --output ml/models/saved/baseline_rf.joblib

# Train candidate behavioral model (28 features)
python ml/train.py --stride 10 --include-behavioral --output ml/models/saved/candidate_behavioral_rf.joblib
```

---

## 6. Phase 4A Behavioral Intelligence Integration

The behavioral profiling engine is integrated into the online scoring pipeline:
1. **Zero Within-Transaction Lookahead**: Profiles are retrieved prior to scoring. The transaction being scored does not alter its own baseline.
2. **Idempotency & Deduplication**: `update_profile()` tracks processed `transaction_id`s in an internal LRU cache, preventing double-counting if a transaction is replayed or retried.
3. **Thread Safety**: Profile mutations are guarded by a re-entrant lock (`threading.RLock`).
4. **Snapshot Persistence**: Profiles can be persisted and restored via `sentinel_scorer.save_profiles(filepath)` and `sentinel_scorer.load_profiles(filepath)`.
5. **Batch Scoring**: `score_batch()` scores all transactions against the pre-batch snapshot before flushing updates.

---

## 7. Running the Test Suite

```bash
python -m pytest ml/tests backend/tests -v
```
All **51 tests** across the pipeline validate statistical correctness, step-batching, zero-lookahead, schema consistency, idempotency, thread-safety, and API compatibility.

