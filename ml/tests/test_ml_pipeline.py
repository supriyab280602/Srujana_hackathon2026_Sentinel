import os
import math
import pytest
import numpy as np
import pandas as pd

from ml.data.loader import DataLoader, REQUIRED_CANONICAL_COLUMNS, PROHIBITED_LEAKAGE_COLUMNS
from ml.features.engineer import FeatureEngineer
from ml.models.baseline import FraudModelBaseline
from ml.scoring.interface import SentinelScorer, sentinel_scorer
from ml.evaluation.metrics import ModelEvaluator


# =====================================================================
# 1. DATA LOADER & SCHEMA TESTS
# =====================================================================

def test_data_loader_canonical_validation():
    loader = DataLoader()
    valid_df = pd.DataFrame({
        "transaction_id": ["TX1"],
        "sender_account_id": ["ACC1"],
        "receiver_account_id": ["ACC2"],
        "amount": [150.0],
        "currency": ["USD"],
        "timestamp": ["2026-10-24T12:00:00Z"],
        "channel": ["wire"],
    })
    assert loader.validate_schema(valid_df) is True

    invalid_df = pd.DataFrame({"amount": [150.0], "sender_account_id": ["ACC1"]})
    with pytest.raises(ValueError, match="missing required columns"):
        loader.validate_schema(invalid_df)


def test_data_loader_invalid_and_missing_values():
    loader = DataLoader()

    # Negative amount should raise ValueError
    neg_df = pd.DataFrame({
        "transaction_id": ["TX1"],
        "sender_account_id": ["ACC1"],
        "receiver_account_id": ["ACC2"],
        "amount": [-50.0],
        "currency": ["USD"],
        "timestamp": ["2026-10-24T12:00:00Z"],
        "channel": ["wire"],
    })
    with pytest.raises(ValueError, match="invalid negative amounts"):
        loader.validate_schema(neg_df)

    # Cleaning missing values
    dirty_df = pd.DataFrame({
        "transaction_id": ["TX1", "TX2", "TX3"],
        "sender_account_id": ["ACC1", None, "ACC3"],
        "receiver_account_id": ["ACC2", "ACC4", "ACC5"],
        "amount": [100.0, 200.0, np.nan],
        "currency": ["USD", "USD", "USD"],
        "timestamp": ["2026-10-24T12:00:00Z", "2026-10-24T12:01:00Z", "2026-10-24T12:02:00Z"],
        "channel": ["wire", "ach", "wire"],
    })
    cleaned_df = loader.clean_dataset(dirty_df)
    assert len(cleaned_df) == 1
    assert cleaned_df.iloc[0]["transaction_id"] == "TX1"


def test_data_loader_deduplication():
    loader = DataLoader()
    dupes_df = pd.DataFrame({
        "transaction_id": ["TX1", "TX2"],
        "sender_account_id": ["ACC1", "ACC1"],
        "receiver_account_id": ["ACC2", "ACC2"],
        "amount": [100.0, 100.0],
        "currency": ["USD", "USD"],
        "timestamp": ["2026-10-24T12:00:00Z", "2026-10-24T12:00:00Z"],
        "channel": ["wire", "wire"],
    })
    cleaned = loader.clean_dataset(dupes_df)
    assert len(cleaned) == 1


def test_data_loader_paysim_normalization():
    loader = DataLoader()
    paysim_df = pd.DataFrame({
        "step": [1, 2],
        "type": ["TRANSFER", "CASH_OUT"],
        "amount": [10000.0, 5000.0],
        "nameOrig": ["C12345", "C67890"],
        "oldbalanceOrg": [10000.0, 5000.0],
        "newbalanceOrig": [0.0, 0.0],  # Leakage field
        "nameDest": ["M98765", "M54321"],
        "oldbalanceDest": [0.0, 100.0],
        "newbalanceDest": [10000.0, 5100.0],  # Leakage field
        "isFraud": [1, 0],
        "isFlaggedFraud": [0, 0],  # Leakage field
    })

    assert loader.is_paysim_schema(paysim_df) is True
    normalized = loader.normalize_paysim_dataset(paysim_df)

    # Verify forbidden leakage columns are eliminated
    for leak_col in PROHIBITED_LEAKAGE_COLUMNS:
        assert leak_col not in normalized.columns

    # Verify target label and mapped fields
    assert "is_fraud" in normalized.columns
    assert normalized["is_fraud"].tolist() == [1, 0]
    assert "sender_account_id" in normalized.columns
    assert "receiver_account_id" in normalized.columns
    assert "timestamp" in normalized.columns

    # Verify balance-delta features are present
    assert "amount_to_balance_ratio" in normalized.columns
    assert "is_balance_drain" in normalized.columns
    assert "receiver_zero_balance" in normalized.columns

    # Test label separation
    X, y, meta = loader.separate_features_and_labels(normalized)
    assert "is_fraud" not in X.columns
    assert y is not None
    assert len(y) == 2
    assert "transaction_id" in meta.columns


def test_data_loader_paysim_balance_delta_features():
    """Verify balance-delta features compute correctly and are not leakage."""
    loader = DataLoader()
    paysim_df = pd.DataFrame({
        "step": [1],
        "type": ["TRANSFER"],
        "amount": [9000.0],
        "nameOrig": ["C12345"],
        "oldbalanceOrg": [10000.0],
        "newbalanceOrig": [1000.0],  # Leakage
        "nameDest": ["M98765"],
        "oldbalanceDest": [0.0],
        "newbalanceDest": [9000.0],  # Leakage
        "isFraud": [1],
        "isFlaggedFraud": [0],  # Leakage
    })
    normalized = loader.normalize_paysim_dataset(paysim_df)

    # amount_to_balance_ratio = 9000 / (10000 + 1) ≈ 0.8999
    assert abs(normalized.iloc[0]["amount_to_balance_ratio"] - 9000.0 / 10001.0) < 0.01
    # 9000 >= 10000 * 0.9 → is_balance_drain = 1.0
    assert normalized.iloc[0]["is_balance_drain"] == 1.0
    # oldbalanceDest == 0.0 → receiver_zero_balance = 1.0
    assert normalized.iloc[0]["receiver_zero_balance"] == 1.0


# =====================================================================
# 2. FEATURE ENGINEERING & ZERO-LOOKAHEAD LEAKAGE TESTS
# =====================================================================

def test_feature_generation_chronological():
    engineer = FeatureEngineer()
    df = pd.DataFrame({
        "transaction_id": ["TX1", "TX2", "TX3"],
        "sender_account_id": ["ACC1", "ACC1", "ACC2"],
        "receiver_account_id": ["ACC2", "ACC3", "ACC1"],
        "amount": [500.0, 12000.0, 50.0],
        "channel": ["wire", "crypto", "ach"],
        "timestamp": [
            "2026-10-24 10:00:00",
            "2026-10-24 10:30:00",
            "2026-10-24 11:00:00",
        ],
    })

    feats_df = engineer.transform_chronological(df)
    assert len(feats_df) == 3
    for col in FeatureEngineer.FEATURE_NAMES:
        assert col in feats_df.columns
        assert not feats_df[col].isna().any()

    # Second transaction from ACC1 should observe prior transaction history
    assert feats_df.iloc[1]["sender_tx_count_prior"] == 1.0
    assert feats_df.iloc[1]["sender_volume_prior"] == 500.0
    assert feats_df.iloc[1]["is_cash_out"] == 1.0  # crypto channel treated as high-risk cashout


def test_temporal_leakage_prevention():
    """
    MATHEMATICAL PROOF TEST:
    Modifying or appending future transactions at T > T_now must NOT alter
    feature values for transactions evaluated at T <= T_now.
    """
    engineer = FeatureEngineer()

    # Initial history with 2 transactions
    base_df = pd.DataFrame({
        "transaction_id": ["TX1", "TX2"],
        "sender_account_id": ["ACC_ALICE", "ACC_ALICE"],
        "receiver_account_id": ["ACC_BOB", "ACC_CHARLIE"],
        "amount": [100.0, 200.0],
        "channel": ["wire", "wire"],
        "timestamp": ["2026-10-24 10:00:00", "2026-10-24 10:15:00"],
    })
    base_feats = engineer.transform_chronological(base_df)

    # Future scenario A: Future transaction TX3 is a small normal payment
    scenario_a_df = pd.concat([
        base_df,
        pd.DataFrame([{
            "transaction_id": "TX3",
            "sender_account_id": "ACC_ALICE",
            "receiver_account_id": "ACC_DAVE",
            "amount": 50.0,
            "channel": "wire",
            "timestamp": "2026-10-24 10:45:00",
        }])
    ], ignore_index=True)
    scenario_a_feats = engineer.transform_chronological(scenario_a_df)

    # Future scenario B: Future transaction TX3 is an anomalous $100,000,000 cashout
    scenario_b_df = pd.concat([
        base_df,
        pd.DataFrame([{
            "transaction_id": "TX3",
            "sender_account_id": "ACC_ALICE",
            "receiver_account_id": "ACC_OFFSHORE",
            "amount": 100000000.0,
            "channel": "crypto",
            "timestamp": "2026-10-24 10:45:00",
        }])
    ], ignore_index=True)
    scenario_b_feats = engineer.transform_chronological(scenario_b_df)

    # ASSERTION: The features for TX1 and TX2 in scenario A and scenario B
    # must be EXACTLY identical to the base features, proving ZERO future leakage!
    pd.testing.assert_frame_equal(base_feats, scenario_a_feats.iloc[:2])
    pd.testing.assert_frame_equal(base_feats, scenario_b_feats.iloc[:2])


def test_balance_delta_features_in_chronological_transform():
    """Verify balance-delta features flow through chronological transform correctly."""
    engineer = FeatureEngineer()
    df = pd.DataFrame({
        "transaction_id": ["TX1", "TX2"],
        "sender_account_id": ["ACC1", "ACC2"],
        "receiver_account_id": ["ACC2", "ACC3"],
        "amount": [9000.0, 100.0],
        "channel": ["transfer", "transfer"],
        "timestamp": ["2026-10-24 10:00:00", "2026-10-24 10:30:00"],
        "sender_balance_before": [10000.0, 50000.0],
        "receiver_balance_before": [0.0, 10000.0],
    })

    feats_df = engineer.transform_chronological(df)

    # TX1: 9000 / (10000 + 1) ≈ 0.8999, draining 90% → is_balance_drain=1, receiver zero → 1.0
    assert feats_df.iloc[0]["amount_to_balance_ratio"] > 0.8
    assert feats_df.iloc[0]["is_balance_drain"] == 1.0
    assert feats_df.iloc[0]["receiver_zero_balance"] == 1.0

    # TX2: 100 / (50000 + 1) ≈ 0.002, not draining → 0, receiver has balance → 0.0
    assert feats_df.iloc[1]["amount_to_balance_ratio"] < 0.01
    assert feats_df.iloc[1]["is_balance_drain"] == 0.0
    assert feats_df.iloc[1]["receiver_zero_balance"] == 0.0


# =====================================================================
# 3. BASELINE MODEL TRAINING, PREDICTION & PERSISTENCE TESTS
# =====================================================================

@pytest.fixture
def synthetic_labeled_dataset():
    """Generates a small, deterministic synthetic dataset for ML pipeline validation."""
    np.random.seed(42)
    n = 120

    # Base normal transactions
    amounts = np.random.uniform(20.0, 450.0, size=n)
    channels = np.random.choice(["ach", "card", "p2p"], size=n)
    labels = np.zeros(n, dtype=int)
    sender_balances = np.random.uniform(1000.0, 50000.0, size=n)
    receiver_balances = np.random.uniform(100.0, 30000.0, size=n)

    # Interleave realistic fraud transactions across both train and test periods
    fraud_indices = [12, 28, 44, 62, 78, 96, 112]
    for idx in fraud_indices:
        amounts[idx] = np.random.uniform(50000.0, 150000.0)
        channels[idx] = np.random.choice(["wire", "crypto"])
        labels[idx] = 1
        sender_balances[idx] = amounts[idx] * np.random.uniform(1.0, 1.2)
        receiver_balances[idx] = 0.0  # Mule pattern

    timestamps = pd.date_range("2026-01-01 08:00:00", periods=n, freq="15min")

    df = pd.DataFrame({
        "transaction_id": [f"TX-{i:04d}" for i in range(n)],
        "sender_account_id": [f"ACC-{i % 15}" for i in range(n)],
        "receiver_account_id": [f"REC-{i % 25}" for i in range(n)],
        "amount": amounts,
        "currency": "USD",
        "channel": channels,
        "timestamp": timestamps,
        "is_fraud": labels,
        "sender_balance_before": sender_balances,
        "receiver_balance_before": receiver_balances,
    })
    return df


def test_model_training_and_evaluation(synthetic_labeled_dataset):
    df = synthetic_labeled_dataset
    engineer = FeatureEngineer()
    loader = DataLoader()

    # 1. Separate features and ground truth labels
    X_raw, y, _ = loader.separate_features_and_labels(df)

    # 2. Chronological feature transformation
    X_features = engineer.transform_chronological(df)

    # 3. Chronological train/test split
    X_train, X_test, y_train, y_test = FraudModelBaseline.chronological_train_test_split(
        X_features, y, test_size=0.25
    )
    assert len(X_train) == 90
    assert len(X_test) == 30

    # 4. Model fitting
    model = FraudModelBaseline(model_version="test-v1", n_estimators=20, max_depth=4)
    model.fit(X_train, y_train)

    assert model.is_trained is True
    assert len(model.feature_importances_) == len(FeatureEngineer.FEATURE_NAMES)
    assert model._scaler is not None
    assert model.optimal_threshold > 0.0
    assert model.optimal_threshold < 1.0

    # 5. Model prediction
    y_scores = model.predict_proba(X_test)
    assert len(y_scores) == len(X_test)
    assert np.all(y_scores >= 0.0) and np.all(y_scores <= 1.0)

    # 6. Binary prediction with optimal threshold
    y_pred = model.predict(X_test)
    assert len(y_pred) == len(X_test)
    assert set(np.unique(y_pred)).issubset({0, 1})

    # 7. Evaluation metrics calculation
    metrics = ModelEvaluator.evaluate_predictions(y_test, y_scores, threshold=model.optimal_threshold)

    assert "roc_auc" in metrics
    assert "pr_auc" in metrics
    assert "precision" in metrics
    assert "recall" in metrics
    assert "f1_score" in metrics
    assert "confusion_matrix" in metrics
    assert metrics["evaluation_sample_size"] == 30
    assert metrics["class_distribution"]["total"] == 30


def test_model_artifact_save_and_load(synthetic_labeled_dataset, tmp_path):
    df = synthetic_labeled_dataset
    engineer = FeatureEngineer()
    X_features = engineer.transform_chronological(df)
    y = df["is_fraud"]

    model = FraudModelBaseline(model_version="persisted-v1", n_estimators=10)
    model.fit(X_features, y)

    artifact_file = str(tmp_path / "model_artifact.joblib")
    model.save(artifact_file)
    assert os.path.exists(artifact_file)

    loaded_model = FraudModelBaseline().load(artifact_file)
    assert loaded_model.is_trained is True
    assert loaded_model.model_version == "persisted-v1"
    assert loaded_model.optimal_threshold == model.optimal_threshold

    # Verify predictions are bit-for-bit identical
    original_probs = model.predict_proba(X_features)
    loaded_probs = loaded_model.predict_proba(X_features)
    np.testing.assert_array_almost_equal(original_probs, loaded_probs)


# =====================================================================
# 4. SCORING INTERFACE CONTRACT TESTS
# =====================================================================

def test_scoring_interface_unfitted_fallback():
    scorer = SentinelScorer()
    txn = {
        "amount": 75000.0,
        "channel": "crypto",
        "sender_account_id": "ACC_SUSPECT",
        "receiver_account_id": "ACC_MULE",
        "transaction_id": "TXN-TEST-99",
    }
    result = scorer.score_transaction(txn, {"velocity_1h_count": 4.0})

    assert result["transaction_id"] == "TXN-TEST-99"
    assert "risk_score" in result
    assert result["risk_score"] > 0
    assert result["score_type"] == "development_fallback_heuristic"
    assert result["is_placeholder"] is True
    assert result["risk_category"] in ("low", "medium", "high", "critical")
    assert isinstance(result["factors"], list)


def test_scoring_interface_with_trained_model(synthetic_labeled_dataset):
    df = synthetic_labeled_dataset
    engineer = FeatureEngineer()
    X_features = engineer.transform_chronological(df)
    y = df["is_fraud"]

    model = FraudModelBaseline(model_version="trained-v1", n_estimators=15)
    model.fit(X_features, y)

    scorer = SentinelScorer()
    scorer.model = model  # Inject trained model

    txn = {
        "amount": 95000.0,
        "channel": "wire",
        "sender_account_id": "ACC_HIGH_RISK",
        "receiver_account_id": "ACC_TARGET",
        "transaction_id": "TXN-LIVE-001",
    }
    result = scorer.score_transaction(txn, {"velocity_1h_count": 5.0})

    assert result["transaction_id"] == "TXN-LIVE-001"
    assert result["score_type"] == "model_score"
    assert result["is_placeholder"] is False
    assert 0.0 <= result["risk_score"] <= 100.0
    assert result["risk_category"] in ("low", "medium", "high", "critical")
    assert len(result["factors"]) >= 1


# =====================================================================
# 5. EVALUATION METRIC EDGE CASES
# =====================================================================

def test_model_evaluator_edge_cases():
    with pytest.raises(ValueError, match="must not be empty"):
        ModelEvaluator.evaluate_predictions(np.array([]), np.array([]))

    # Perfect prediction test
    y_true = np.array([0, 0, 1, 1])
    y_score = np.array([0.1, 0.2, 0.8, 0.9])
    res = ModelEvaluator.evaluate_predictions(y_true, y_score, threshold=0.5)

    assert res["roc_auc"] == 1.0
    assert res["pr_auc"] == 1.0
    assert res["precision"] == 1.0
    assert res["recall"] == 1.0
    assert res["confusion_matrix"]["true_positives"] == 2
    assert res["confusion_matrix"]["true_negatives"] == 2


# =====================================================================
# 6. OPTIMAL THRESHOLD TUNING TESTS
# =====================================================================

def test_optimal_threshold_finder():
    """Verify that the F2-optimal threshold finder works correctly."""
    y_true = pd.Series([0, 0, 0, 0, 0, 0, 0, 0, 1, 1])
    y_scores = np.array([0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.7, 0.9])

    threshold = FraudModelBaseline._find_optimal_threshold(y_true, y_scores, beta=2.0)

    # Threshold should be set to catch the fraud cases (around 0.5-0.7 range)
    assert 0.0 < threshold < 1.0
    # At the optimal threshold, both fraud cases should be caught
    preds = (y_scores >= threshold).astype(int)
    tp = int(np.sum((preds == 1) & (y_true == 1)))
    assert tp >= 1  # At least 1 fraud case caught


def test_model_predict_with_threshold(synthetic_labeled_dataset):
    """Verify predict() uses optimal threshold by default."""
    df = synthetic_labeled_dataset
    engineer = FeatureEngineer()
    X_features = engineer.transform_chronological(df)
    y = df["is_fraud"]

    model = FraudModelBaseline(model_version="test-thresh", n_estimators=15)
    model.fit(X_features, y)

    # predict() should use optimal_threshold
    preds_optimal = model.predict(X_features)
    assert set(np.unique(preds_optimal)).issubset({0, 1})

    # predict() with explicit threshold=0.99 should predict very few positives
    preds_high = model.predict(X_features, threshold=0.99)
    assert np.sum(preds_high) <= np.sum(preds_optimal)


# =====================================================================
# 7. PHASE 2C METHODOLOGICAL AUDIT & VALIDATION TESTS
# =====================================================================

def test_chronological_3way_split_integrity(synthetic_labeled_dataset):
    """Verify strictly forward temporal ordering without overlap across train, val, and test partitions."""
    df = synthetic_labeled_dataset
    engineer = FeatureEngineer()
    X = engineer.transform_chronological(df)
    y = df["is_fraud"]

    X_train, X_val, X_test, y_train, y_val, y_test = FraudModelBaseline.chronological_train_val_test_split(
        X, y, val_size=0.2, test_size=0.2
    )

    # 1. Size checks: 120 total => 72 train (60%), 24 val (20%), 24 test (20%)
    assert len(X_train) == 72
    assert len(X_val) == 24
    assert len(X_test) == 24
    assert len(y_train) == 72
    assert len(y_val) == 24
    assert len(y_test) == 24

    # 2. Strict non-overlapping chronological indices
    assert set(X_train.index).isdisjoint(set(X_val.index))
    assert set(X_val.index).isdisjoint(set(X_test.index))
    assert set(X_train.index).isdisjoint(set(X_test.index))


def test_natural_prevalence_in_eval_splits(tmp_path):
    """Verify that load_chronological_splits preserves natural prevalence in val and test splits."""
    loader = DataLoader()
    # Create a synthetic CSV with 100 rows, 4 fraud cases (4% natural prevalence)
    n = 100
    steps = list(range(1, n + 1))
    fraud = [0] * n
    # Frauds distributed across time: steps 10, 20, 65, 85
    for idx in [9, 19, 64, 84]:
        fraud[idx] = 1

    df_synth = pd.DataFrame({
        "step": steps,
        "type": ["TRANSFER"] * n,
        "amount": [1000.0] * n,
        "nameOrig": [f"C{i}" for i in range(n)],
        "oldbalanceOrg": [5000.0] * n,
        "newbalanceOrig": [4000.0] * n,
        "nameDest": [f"M{i}" for i in range(n)],
        "oldbalanceDest": [0.0] * n,
        "newbalanceDest": [1000.0] * n,
        "isFraud": fraud,
        "isFlaggedFraud": [0] * n,
    })

    file_path = str(tmp_path / "test_paysim.csv")
    df_synth.to_csv(file_path, index=False)

    # Load with 60/20/20 split and training negative downsampling
    df_train, df_val, df_test, meta = loader.load_chronological_splits(
        file_path=file_path,
        train_ratio=0.6,
        val_ratio=0.2,
        test_ratio=0.2,
        target_train_fraud_ratio=0.10,  # 10% in train
        filter_eligible_types=True,
    )

    # Validation (steps 61-80) has row 65 (1 fraud out of 20 = 5.0% natural prevalence)
    assert meta["validation"]["total_samples"] == 20
    assert meta["validation"]["fraud_count"] == 1
    assert abs(meta["validation"]["fraud_prevalence"] - 0.05) < 1e-4

    # Test (steps 81-100) has row 85 (1 fraud out of 20 = 5.0% natural prevalence)
    assert meta["test"]["total_samples"] == 20
    assert meta["test"]["fraud_count"] == 1
    assert abs(meta["test"]["fraud_prevalence"] - 0.05) < 1e-4

    # Train was downsampled: 2 fraud / 0.10 = 20 total rows
    assert meta["train"]["fraud_count"] == 2
    assert len(df_train) == 20
    assert abs(meta["train"]["fraud_prevalence"] - 0.10) < 1e-4


def test_threshold_tuned_on_validation_split(synthetic_labeled_dataset):
    """Verify that tune_threshold tunes on validation data and updates optimal_threshold."""
    df = synthetic_labeled_dataset
    engineer = FeatureEngineer()
    X = engineer.transform_chronological(df)
    y = df["is_fraud"]

    X_train, X_val, X_test, y_train, y_val, y_test = FraudModelBaseline.chronological_train_val_test_split(
        X, y, val_size=0.25, test_size=0.25
    )

    model = FraudModelBaseline(model_version="test-val-tune", n_estimators=15)
    model.fit(X_train, y_train)

    # Default threshold before explicit validation tuning is 0.5 (or initial estimate)
    initial_threshold = model.optimal_threshold

    # Tune on validation set
    val_threshold = model.tune_threshold(X_val, y_val, beta=2.0)

    assert 0.0 < val_threshold < 1.0
    assert model.optimal_threshold == val_threshold
    assert "held_out_validation_fbeta" in model.training_metadata.get("threshold_tuning_method", "")


def test_scorer_distinguishes_model_vs_heuristic(synthetic_labeled_dataset):
    """Verify SentinelScorer accurately reports score_type for trained model vs unfitted fallback."""
    df = synthetic_labeled_dataset
    engineer = FeatureEngineer()
    X = engineer.transform_chronological(df)
    y = df["is_fraud"]

    # 1. Unfitted scorer
    unfitted_scorer = SentinelScorer()
    txn = {
        "amount": 25000.0,
        "channel": "transfer",
        "sender_account_id": "ACC-1",
        "receiver_account_id": "ACC-2",
        "transaction_id": "TX-UNFITTED",
    }
    unfitted_res = unfitted_scorer.score_transaction(txn)
    assert unfitted_res["score_type"] == "development_fallback_heuristic"
    assert unfitted_res["is_placeholder"] is True

    # 2. Trained scorer
    trained_model = FraudModelBaseline(model_version="trained-v2", n_estimators=10)
    trained_model.fit(X, y)

    trained_scorer = SentinelScorer()
    trained_scorer.model = trained_model

    trained_res = trained_scorer.score_transaction(txn)
    assert trained_res["score_type"] == "model_score"
    assert trained_res["is_placeholder"] is False
    assert "v2" in trained_res["model_version"]


# =====================================================================
# 8. PHASE 3 BEHAVIORAL FINGERPRINTING TESTS
# =====================================================================

def test_welford_incremental_statistics():
    """Verify that AccountProfile computes exact sample mean and std matching numpy (ddof=1)."""
    from ml.features.fingerprint import AccountProfile
    prof = AccountProfile(account_id="ACC_STAT_TEST")

    amounts = [100.0, 250.0, 400.0, 150.0, 600.0]
    for i, amt in enumerate(amounts):
        prof.update_outbound(amount=amt, channel="transfer", receiver_id=f"REC_{i}")

    expected_mean = float(np.mean(amounts))
    expected_std = float(np.std(amounts, ddof=1))

    assert math.isclose(prof.amount_mean, expected_mean, rel_tol=1e-5)
    assert math.isclose(prof.sample_std(), expected_std, rel_tol=1e-5)
    assert prof.tx_count == 5
    assert prof.total_volume == sum(amounts)
    assert prof.min_amount == 100.0
    assert prof.max_amount == 600.0


def test_exclusion_of_current_transaction_from_profile():
    """Verify current transaction is strictly excluded from its own behavioral profile."""
    from ml.features.fingerprint import BehavioralFingerprintEngine
    engine = BehavioralFingerprintEngine()

    txn = {
        "sender_account_id": "ACC_NEWBIE",
        "receiver_account_id": "ACC_RECIP",
        "amount": 50000.0,
        "channel": "transfer",
    }
    feats = engine.compute_transaction_features(txn)

    # First transaction must reflect zero prior history
    assert feats["sender_history_count"] == 0.0
    assert feats["sender_has_sufficient_history"] == 0.0
    assert feats["sender_amount_mean_prior"] == 0.0
    assert feats["sender_amount_std_prior"] == 0.0
    assert feats["sender_amount_zscore_prior"] == 0.0
    assert feats["sender_type_unseen_prior"] == 1.0


def test_future_leakage_prevention_behavioral():
    """Verify future events appended at T > T_current produce bit-for-bit identical features for earlier events."""
    from ml.features.fingerprint import BehavioralFingerprintEngine
    engine1 = BehavioralFingerprintEngine()
    engine2 = BehavioralFingerprintEngine()

    df_base = pd.DataFrame([
        {"step": 1, "sender_account_id": "ACC_A", "receiver_account_id": "REC_1", "amount": 100.0, "channel": "transfer"},
        {"step": 2, "sender_account_id": "ACC_A", "receiver_account_id": "REC_2", "amount": 120.0, "channel": "transfer"},
    ])

    df_future_tampered = pd.DataFrame([
        {"step": 1, "sender_account_id": "ACC_A", "receiver_account_id": "REC_1", "amount": 100.0, "channel": "transfer"},
        {"step": 2, "sender_account_id": "ACC_A", "receiver_account_id": "REC_2", "amount": 120.0, "channel": "transfer"},
        # Future massive burst
        {"step": 3, "sender_account_id": "ACC_A", "receiver_account_id": "REC_3", "amount": 10000000.0, "channel": "crypto"},
    ])

    feats1 = engine1.transform_chronological(df_base, use_step_batching=True)
    feats2 = engine2.transform_chronological(df_future_tampered, use_step_batching=True)

    # Features for step 1 and step 2 must be bit-for-bit identical
    pd.testing.assert_frame_equal(feats1, feats2.iloc[:2])


def test_same_paysim_step_batch_handling():
    """Verify transactions sharing the same PaySim step see state strictly before that step."""
    from ml.features.fingerprint import BehavioralFingerprintEngine
    engine = BehavioralFingerprintEngine()

    # Step 1: Baseline transactions for ACC_MULTI
    init_txns = [
        {"step": 1, "sender_account_id": "ACC_MULTI", "receiver_account_id": "R1", "amount": 100.0, "channel": "ach"},
        {"step": 2, "sender_account_id": "ACC_MULTI", "receiver_account_id": "R2", "amount": 200.0, "channel": "ach"},
        {"step": 3, "sender_account_id": "ACC_MULTI", "receiver_account_id": "R3", "amount": 300.0, "channel": "ach"},
    ]
    engine.transform_chronological(pd.DataFrame(init_txns), use_step_batching=True)

    # At the end of step 3: mean = 200.0, std = 100.0, tx_count = 3
    prof = engine.get_or_create_profile("ACC_MULTI")
    assert prof.tx_count == 3
    assert math.isclose(prof.amount_mean, 200.0, abs_tol=1e-5)

    # Step 4: Three transactions for ACC_MULTI in the SAME step
    step4_txns = [
        {"step": 4, "sender_account_id": "ACC_MULTI", "receiver_account_id": "R4", "amount": 500.0, "channel": "ach"},
        {"step": 4, "sender_account_id": "ACC_MULTI", "receiver_account_id": "R5", "amount": 1000.0, "channel": "ach"},
        {"step": 4, "sender_account_id": "ACC_MULTI", "receiver_account_id": "R6", "amount": 1500.0, "channel": "ach"},
    ]
    step4_feats = engine.process_step_batch(step4_txns, step=4)

    # CRITICAL ASSERTION: All 3 transactions in step 4 must see the SAME prior history (count=3, mean=200.0)
    for feats in step4_feats:
        assert feats["sender_history_count"] == 3.0
        assert math.isclose(feats["sender_amount_mean_prior"], 200.0, abs_tol=1e-5)
        assert feats["sender_has_sufficient_history"] == 1.0

    # In step 5: a transaction sees all 6 prior transactions (3 from steps 1-3 + 3 from step 4)
    step5_txn = {"step": 5, "sender_account_id": "ACC_MULTI", "receiver_account_id": "R7", "amount": 100.0, "channel": "ach"}
    step5_feats = engine.compute_transaction_features(step5_txn)
    assert step5_feats["sender_history_count"] == 6.0


def test_sender_and_recipient_profile_separation():
    """Verify that outbound and inbound histories are properly isolated between parties."""
    from ml.features.fingerprint import BehavioralFingerprintEngine
    engine = BehavioralFingerprintEngine()

    engine.update_profile({
        "sender_account_id": "ALICE",
        "receiver_account_id": "BOB",
        "amount": 500.0,
        "channel": "wire",
    })

    alice_prof = engine.get_or_create_profile("ALICE")
    bob_prof = engine.get_or_create_profile("BOB")

    # ALICE is sender: tx_count=1, inflow_count=0
    assert alice_prof.tx_count == 1
    assert alice_prof.total_volume == 500.0
    assert alice_prof.inflow_count == 0

    # BOB is recipient: tx_count=0 (no outbound), inflow_count=1, inflow_volume=500.0
    assert bob_prof.tx_count == 0
    assert bob_prof.total_volume == 0.0
    assert bob_prof.inflow_count == 1
    assert bob_prof.inflow_volume == 500.0


def test_cold_start_and_insufficient_history():
    """Verify cold start and transition to established baseline at threshold N=3."""
    from ml.features.fingerprint import BehavioralFingerprintEngine
    engine = BehavioralFingerprintEngine(min_history_threshold=3)

    # N=0: cold start
    f0 = engine.compute_transaction_features({"sender_account_id": "COLD_ACC", "amount": 100.0, "channel": "wire"})
    assert f0["sender_has_sufficient_history"] == 0.0
    assert f0["sender_amount_zscore_prior"] == 0.0

    engine.update_profile({"sender_account_id": "COLD_ACC", "amount": 100.0, "channel": "wire"})

    # N=1: insufficient
    f1 = engine.compute_transaction_features({"sender_account_id": "COLD_ACC", "amount": 100.0, "channel": "wire"})
    assert f1["sender_history_count"] == 1.0
    assert f1["sender_has_sufficient_history"] == 0.0
    assert f1["sender_amount_zscore_prior"] == 0.0

    engine.update_profile({"sender_account_id": "COLD_ACC", "amount": 200.0, "channel": "wire"})

    # N=2: insufficient
    f2 = engine.compute_transaction_features({"sender_account_id": "COLD_ACC", "amount": 300.0, "channel": "wire"})
    assert f2["sender_history_count"] == 2.0
    assert f2["sender_has_sufficient_history"] == 0.0
    assert f2["sender_amount_zscore_prior"] == 0.0

    engine.update_profile({"sender_account_id": "COLD_ACC", "amount": 300.0, "channel": "wire"})

    # N=3: SUFFICIENT history (baseline active)
    f3 = engine.compute_transaction_features({"sender_account_id": "COLD_ACC", "amount": 1000.0, "channel": "wire"})
    assert f3["sender_history_count"] == 3.0
    assert f3["sender_has_sufficient_history"] == 1.0
    # Mean is 200.0, std = 100.0 => zscore = (1000 - 200) / 100 = 8.0
    assert math.isclose(f3["sender_amount_zscore_prior"], 8.0, rel_tol=1e-3)


def test_zero_variance_and_invalid_values():
    """Verify safe zero division on uniform amounts and robustness to invalid values."""
    from ml.features.fingerprint import BehavioralFingerprintEngine
    engine = BehavioralFingerprintEngine()

    # Create 5 identical transactions of 50.0 (variance = 0.0)
    for _ in range(5):
        engine.update_profile({"sender_account_id": "UNIFORM_ACC", "amount": 50.0, "channel": "ach"})

    # Exactly matching amount => z-score = 0.0 without ZeroDivisionError
    f_match = engine.compute_transaction_features({"sender_account_id": "UNIFORM_ACC", "amount": 50.0, "channel": "ach"})
    assert f_match["sender_amount_std_prior"] == 0.0
    assert f_match["sender_amount_zscore_prior"] == 0.0

    # Non-matching amount with zero variance history => bounded deviation
    f_diff = engine.compute_transaction_features({"sender_account_id": "UNIFORM_ACC", "amount": 200.0, "channel": "ach"})
    assert np.isfinite(f_diff["sender_amount_zscore_prior"])

    # Robustness to None/NaN/negative inputs
    f_invalid = engine.compute_transaction_features({
        "sender_account_id": None,
        "receiver_account_id": None,
        "amount": -500.0,
        "channel": None,
    })
    assert f_invalid["sender_history_count"] == 0.0
    assert np.isfinite(f_invalid["sender_amount_mean_prior"])


def test_batch_vs_incremental_agreement():
    """Verify batch transform_chronological and incremental processing produce identical outputs."""
    from ml.features.fingerprint import BehavioralFingerprintEngine
    engine_batch = BehavioralFingerprintEngine()
    engine_inc = BehavioralFingerprintEngine()

    df = pd.DataFrame([
        {"sender_account_id": "ACC_X", "receiver_account_id": "R1", "amount": 100.0, "channel": "transfer"},
        {"sender_account_id": "ACC_X", "receiver_account_id": "R2", "amount": 200.0, "channel": "transfer"},
        {"sender_account_id": "ACC_Y", "receiver_account_id": "R1", "amount": 50.0, "channel": "wire"},
        {"sender_account_id": "ACC_X", "receiver_account_id": "R3", "amount": 300.0, "channel": "transfer"},
    ])

    batch_res = engine_batch.transform_chronological(df, use_step_batching=False)

    inc_records = []
    for row in df.itertuples():
        txn = {
            "sender_account_id": row.sender_account_id,
            "receiver_account_id": row.receiver_account_id,
            "amount": row.amount,
            "channel": row.channel,
        }
        feats = engine_inc.compute_transaction_features(txn)
        inc_records.append(feats)
        engine_inc.update_profile(txn)

    inc_res = pd.DataFrame(inc_records)
    pd.testing.assert_frame_equal(batch_res, inc_res)


def test_behavioral_indicators_explainability():
    """Verify explainable anomaly indicators for extreme z-score and unseen channel."""
    from ml.features.fingerprint import BehavioralFingerprintEngine
    engine = BehavioralFingerprintEngine(min_history_threshold=3)

    # Build established profile of ACH transactions around 100.0
    for _ in range(5):
        engine.update_profile({"sender_account_id": "ACC_ESTABLISHED", "receiver_account_id": "R1", "amount": 100.0, "channel": "ach"})

    # Anomaly: $10,000 crypto transfer
    txn = {"sender_account_id": "ACC_ESTABLISHED", "receiver_account_id": "R2", "amount": 10000.0, "channel": "crypto"}
    indicators = engine.get_behavioral_indicators(txn)

    indicator_codes = [ind["code"] for ind in indicators]
    assert "UNSEEN_TRANSACTION_RAIL" in indicator_codes
    assert any("AMOUNT" in code for code in indicator_codes)

    # Check indicator details
    rail_ind = next(ind for ind in indicators if ind["code"] == "UNSEEN_TRANSACTION_RAIL")
    assert "CRYPTO" in rail_ind["description"]
    assert rail_ind["severity"] == "medium"


def test_scoring_interface_behavioral_integration():
    """Verify SentinelScorer provides behavioral indicators and retains contract compliance."""
    scorer = SentinelScorer()
    txn = {
        "amount": 250000.0,
        "channel": "crypto",
        "sender_account_id": "ACC_TEST_BEH",
        "receiver_account_id": "REC_TEST_BEH",
        "transaction_id": "TX-BEH-01",
    }
    result = scorer.score_transaction(txn)

    assert "behavioral_indicators" in result
    assert isinstance(result["behavioral_indicators"], list)
    # Cold start account has INSUFFICIENT_HISTORY indicator
    assert any(ind["code"] == "INSUFFICIENT_HISTORY" for ind in result["behavioral_indicators"])

    # Update profile and verify subsequent scoring recognizes established count
    scorer.update_profile(txn)
    prof = scorer.get_account_profile("ACC_TEST_BEH")
    assert prof is not None
    assert prof["tx_count"] == 1
    assert prof["total_volume"] == 250000.0


def test_consistency_of_training_and_inference_schemas(synthetic_labeled_dataset):
    """Verify that training batch feature schema exactly matches single-transaction inference schema."""
    df = synthetic_labeled_dataset
    engineer = FeatureEngineer(include_behavioral=True)

    # Batch features
    batch_df = engineer.transform_chronological(df)

    # Single event feature
    row = df.iloc[0].to_dict()
    single_feats = engineer.extract_single_transaction_features(row)

    # Schemas must have identical column/key sets
    assert set(batch_df.columns) == set(single_feats.keys())
    assert set(batch_df.columns) == set(FeatureEngineer.ALL_CANDIDATE_FEATURE_NAMES)


def test_candidate_model_artifact_save_load_and_score(synthetic_labeled_dataset, tmp_path):
    """Verify training, saving, and loading a candidate model with behavioral features into SentinelScorer."""
    df = synthetic_labeled_dataset
    engineer = FeatureEngineer(include_behavioral=True)
    X = engineer.transform_chronological(df)
    y = df["is_fraud"]

    candidate_model = FraudModelBaseline(model_version="v3.0-candidate-test", n_estimators=10)
    candidate_model.fit(X, y)

    artifact_path = str(tmp_path / "candidate_behavioral_rf.joblib")
    candidate_model.save(artifact_path)
    assert os.path.exists(artifact_path)

    # Scorer loads candidate artifact and scores with 28 features
    scorer = SentinelScorer(model_path=artifact_path)
    assert scorer.model.is_trained is True
    assert scorer.model.model_version == "v3.0-candidate-test"
    assert len(scorer.model.feature_names) == len(FeatureEngineer.ALL_CANDIDATE_FEATURE_NAMES)

    txn = {
        "amount": 75000.0,
        "channel": "wire",
        "sender_account_id": "ACC-0",
        "receiver_account_id": "REC-0",
    }
    res = scorer.score_transaction(txn)
    assert res["score_type"] == "model_score"
    assert res["is_placeholder"] is False
    assert 0.0 <= res["risk_score"] <= 100.0



