import pytest
import numpy as np
import pandas as pd
from ml.data.loader import DataLoader
from ml.features.engineer import FeatureEngineer
from ml.models.baseline import FraudModelBaseline
from ml.scoring.interface import sentinel_scorer
from ml.evaluation.metrics import ModelEvaluator


def test_data_loader_schema_validation():
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

    invalid_df = pd.DataFrame({"amount": [150.0]})
    with pytest.raises(ValueError):
        loader.validate_schema(invalid_df)


def test_feature_engineering_single():
    engineer = FeatureEngineer()
    txn = {
        "amount": 25000.0,
        "channel": "crypto",
        "sender_account_id": "ACC1",
        "receiver_account_id": "ACC2",
    }
    feats = engineer.extract_single_transaction_features(txn, {"velocity_1h_count": 4.0})
    assert "log_amount" in feats
    assert feats["is_wire_or_crypto"] == 1.0
    assert feats["velocity_1h_count"] == 4.0


def test_scoring_interface():
    txn = {
        "amount": 50000.0,
        "channel": "crypto",
        "sender_account_id": "ACC_SUSPECT",
        "receiver_account_id": "ACC_MULE",
    }
    result = sentinel_scorer.score_transaction(txn, {"velocity_1h_count": 5.0})
    assert "risk_score" in result
    assert result["risk_score"] > 0
    assert "score_type" in result
    assert "factors" in result
    assert isinstance(result["factors"], list)
    assert len(result["factors"]) >= 1


def test_model_evaluator():
    y_true = np.array([0, 0, 1, 1])
    y_score = np.array([0.1, 0.2, 0.8, 0.9])
    metrics = ModelEvaluator.evaluate_predictions(y_true, y_score, threshold=0.5)
    assert metrics["roc_auc"] == 1.0
    assert metrics["precision"] == 1.0
    assert metrics["recall"] == 1.0
