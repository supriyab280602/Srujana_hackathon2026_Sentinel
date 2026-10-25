"""
Phase 4A Deterministic Test Suite for Sentinel Behavioral Intelligence Integration.
Verifies all 12 Phase 4A acceptance criteria:
1. New account with no history (cold start).
2. Established account with ordinary behavior.
3. Transaction that deviates from historical behavior.
4. Prevention of self-influence and temporal leakage.
5. Duplicate transaction requests and idempotency.
6. Sequential transactions for the same account.
7. Batch processing according to documented semantics.
8. Scoring and persistence failures.
9. Baseline model compatibility.
10. Model feature-schema compatibility.
11. Profile persistence across restarts.
12. Concurrent profile updates (thread safety).
"""
import os
import sys
import tempfile
import threading
from typing import List, Dict, Any
import pytest
import numpy as np

# Ensure repository root and backend directory are on sys.path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_DIR = os.path.join(REPO_ROOT, "backend")
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from ml.features.fingerprint import BehavioralFingerprintEngine, AccountProfile
from ml.scoring.interface import SentinelScorer
from ml.models.baseline import FraudModelBaseline
from app.schemas.scoring import ScoreRequest
from app.schemas.transaction import TransactionCreate
from app.services.scoring_service import ScoringService


@pytest.fixture
def fresh_engine():
    """Returns a clean BehavioralFingerprintEngine instance."""
    engine = BehavioralFingerprintEngine(min_history_threshold=3)
    engine.reset()
    return engine


@pytest.fixture
def fresh_scorer():
    """Returns a clean SentinelScorer instance with baseline model loaded."""
    scorer = SentinelScorer()
    scorer.fingerprint_engine.reset()
    baseline_path = os.path.abspath("ml/models/saved/baseline_rf.joblib")
    if os.path.exists(baseline_path):
        scorer.load_model(baseline_path)
    return scorer


# 1. New account with no history (cold start)
def test_1_new_account_cold_start(fresh_scorer):
    """Verifies that an account with 0 history produces clean cold-start indicators and zero z-score."""
    res = fresh_scorer.score_transaction({
        "transaction_id": "TX-COLD-01",
        "sender_account_id": "ACC-COLD-NEW",
        "receiver_account_id": "ACC-DEST-01",
        "amount": 5000.0,
        "channel": "wire",
    }, auto_update_profile=False)

    assert res["transaction_id"] == "TX-COLD-01"
    assert "risk_score" in res
    assert res["risk_score"] >= 0.0

    indicators = res["behavioral_indicators"]
    codes = [ind["code"] for ind in indicators]
    assert "INSUFFICIENT_HISTORY" in codes

    # Engine profile should still be empty since auto_update_profile was False
    assert fresh_scorer.get_account_profile("ACC-COLD-NEW") is None


# 2. Established account with ordinary behavior
def test_2_established_account_ordinary_behavior(fresh_scorer):
    """Verifies that established accounts with ordinary amounts get BEHAVIOR_CONSISTENT indicators."""
    acc_id = "ACC-ORDINARY-01"
    # Establish baseline with 4 normal transactions of ~$1000 with natural variance
    setup_amounts = [1000.0, 1050.0, 950.0, 1000.0]
    for i, amt in enumerate(setup_amounts):
        fresh_scorer.score_transaction({
            "transaction_id": f"TX-EST-{i}",
            "sender_account_id": acc_id,
            "receiver_account_id": f"ACC-DEST-{i}",
            "amount": amt,
            "channel": "wire",
        }, auto_update_profile=True)

    prof = fresh_scorer.get_account_profile(acc_id)
    assert prof is not None
    assert prof["tx_count"] == 4
    assert prof["has_sufficient_history"] is True
    assert np.isclose(prof["amount_mean"], np.mean(setup_amounts))

    # Score ordinary transaction matching the baseline
    res = fresh_scorer.score_transaction({
        "transaction_id": "TX-EST-NORMAL",
        "sender_account_id": acc_id,
        "receiver_account_id": "ACC-DEST-0",
        "amount": 1020.0,
        "channel": "wire",
    }, auto_update_profile=False)

    indicator_codes = [ind["code"] for ind in res["behavioral_indicators"]]
    assert "INSUFFICIENT_HISTORY" not in indicator_codes
    assert "AMOUNT_ZSCORE_CRITICAL" not in indicator_codes


# 3. Transaction that deviates from historical behavior
def test_3_transaction_deviates_from_history(fresh_scorer):
    """Verifies that a massive amount spike on an established account flags AMOUNT_ZSCORE_CRITICAL."""
    acc_id = "ACC-DEVIANT-01"
    # Establish baseline of small transfers: $50, $60, $55, $50
    for i, amt in enumerate([50.0, 60.0, 55.0, 50.0]):
        fresh_scorer.score_transaction({
            "transaction_id": f"TX-DEV-SETUP-{i}",
            "sender_account_id": acc_id,
            "receiver_account_id": "ACC-REGULAR-RECIP",
            "amount": amt,
            "channel": "card",
        }, auto_update_profile=True)

    # Submit an extreme 100x anomalous wire transfer
    res = fresh_scorer.score_transaction({
        "transaction_id": "TX-DEV-SPIKE",
        "sender_account_id": acc_id,
        "receiver_account_id": "ACC-NEW-MULE",
        "amount": 500000.0,
        "channel": "wire",
    }, auto_update_profile=False)

    codes = [ind["code"] for ind in res["behavioral_indicators"]]
    assert "AMOUNT_ZSCORE_CRITICAL" in codes
    assert "UNSEEN_TRANSACTION_RAIL" in codes

    # Factors list must reflect the behavioral anomaly
    factor_names = [f["name"] for f in res["factors"]]
    assert any("Amount Deviation" in name or "Unseen" in name for name in factor_names)


# 4. Prevention of self-influence and temporal leakage
def test_4_prevention_of_self_influence(fresh_scorer):
    """
    Verifies that a transaction is evaluated strictly against the profile state
    prior to that transaction, even when auto_update_profile is True.
    """
    acc_id = "ACC-LEAK-TEST"
    # Pre-populate 3 transactions of exactly $100
    for i in range(3):
        fresh_scorer.score_transaction({
            "transaction_id": f"TX-LEAK-PRE-{i}",
            "sender_account_id": acc_id,
            "receiver_account_id": "ACC-RECIP",
            "amount": 100.0,
            "channel": "ach",
        }, auto_update_profile=True)

    prof_before = fresh_scorer.get_account_profile(acc_id)
    assert prof_before["amount_mean"] == 100.0
    assert prof_before["tx_count"] == 3

    # Now score a $10,000 transaction with auto_update_profile=True
    res = fresh_scorer.score_transaction({
        "transaction_id": "TX-LEAK-EVAL",
        "sender_account_id": acc_id,
        "receiver_account_id": "ACC-RECIP",
        "amount": 10000.0,
        "channel": "ach",
    }, auto_update_profile=True)

    # During scoring of TX-LEAK-EVAL, the baseline baseline_value reported in indicators
    # must be $100.0, NOT the post-transaction mean!
    for ind in res["behavioral_indicators"]:
        if ind["code"] == "AMOUNT_ZSCORE_CRITICAL":
            assert ind["baseline_value"] == 100.0

    # Post-transaction profile must now show updated state (N=4, mean > 100)
    prof_after = fresh_scorer.get_account_profile(acc_id)
    assert prof_after["tx_count"] == 4
    assert prof_after["amount_mean"] > 100.0


# 5. Duplicate transaction requests and idempotency
def test_5_duplicate_transaction_idempotency(fresh_scorer):
    """Verifies that submitting the same transaction_id repeatedly does not double-count volume."""
    acc_id = "ACC-IDEMPOTENCY"
    txn = {
        "transaction_id": "TX-IDEM-999",
        "sender_account_id": acc_id,
        "receiver_account_id": "ACC-RECIP",
        "amount": 5000.0,
        "channel": "wire",
    }

    # First update
    updated_1 = fresh_scorer.update_profile(txn)
    assert updated_1 is True

    prof_1 = fresh_scorer.get_account_profile(acc_id)
    assert prof_1["tx_count"] == 1
    assert prof_1["total_volume"] == 5000.0

    # Duplicate call with exact same transaction_id
    updated_2 = fresh_scorer.update_profile(txn)
    assert updated_2 is False  # Skipped duplicate

    prof_2 = fresh_scorer.get_account_profile(acc_id)
    assert prof_2["tx_count"] == 1
    assert prof_2["total_volume"] == 5000.0


# 6. Sequential transactions for the same account
def test_6_sequential_transactions_welford(fresh_scorer):
    """Verifies that sequential transactions correctly advance count, mean, and variance via Welford."""
    acc_id = "ACC-SEQ-WELFORD"
    amounts = [100.0, 200.0, 300.0, 400.0, 500.0]

    for i, amt in enumerate(amounts):
        fresh_scorer.score_transaction({
            "transaction_id": f"TX-SEQ-{i}",
            "sender_account_id": acc_id,
            "receiver_account_id": "ACC-RECIP",
            "amount": amt,
            "channel": "wire",
        }, auto_update_profile=True)

    prof = fresh_scorer.get_account_profile(acc_id)
    raw_prof = fresh_scorer.fingerprint_engine.profiles[acc_id]
    assert prof["tx_count"] == 5
    assert prof["total_volume"] == sum(amounts)
    assert np.isclose(raw_prof.amount_mean, np.mean(amounts))
    assert np.isclose(raw_prof.sample_std(), np.std(amounts, ddof=1))


# 7. Batch processing according to documented semantics
def test_7_batch_processing_semantics(fresh_scorer):
    """
    Verifies that score_batch evaluates all transactions against the pre-batch snapshot
    with zero within-batch lookahead.
    """
    acc_id = "ACC-BATCH-SEMANTICS"
    batch_txns = [
        {
            "transaction_id": "TX-BATCH-0",
            "sender_account_id": acc_id,
            "receiver_account_id": "ACC-B0",
            "amount": 1000.0,
            "channel": "ach",
        },
        {
            "transaction_id": "TX-BATCH-1",
            "sender_account_id": acc_id,
            "receiver_account_id": "ACC-B1",
            "amount": 2000.0,
            "channel": "ach",
        },
        {
            "transaction_id": "TX-BATCH-2",
            "sender_account_id": acc_id,
            "receiver_account_id": "ACC-B2",
            "amount": 3000.0,
            "channel": "ach",
        },
    ]

    # Batch score with auto_update_profiles=True
    results = fresh_scorer.score_batch(batch_txns, auto_update_profiles=True)
    assert len(results) == 3

    # All 3 transactions must have evaluated as cold-start (INSUFFICIENT_HISTORY)
    # because they all evaluated against the pre-batch state (N=0)!
    for r in results:
        codes = [ind["code"] for ind in r["behavioral_indicators"]]
        assert "INSUFFICIENT_HISTORY" in codes

    # After the batch completes, the profile must reflect all 3 transactions
    prof = fresh_scorer.get_account_profile(acc_id)
    assert prof["tx_count"] == 3
    assert prof["total_volume"] == 6000.0


# 8. Scoring and persistence failures
def test_8_scoring_failures_do_not_corrupt_state(fresh_scorer):
    """Verifies that an error during scoring prevents profile state mutation."""
    acc_id = "ACC-FAILURE-ISOLATION"
    fresh_scorer.update_profile({
        "transaction_id": "TX-INIT-01",
        "sender_account_id": acc_id,
        "receiver_account_id": "ACC-RECIP",
        "amount": 100.0,
        "channel": "wire",
    })

    prof_before = fresh_scorer.get_account_profile(acc_id)
    assert prof_before["tx_count"] == 1

    # Simulate an error during scoring by passing an invalid model that raises an exception
    original_predict = fresh_scorer.model.predict_risk
    fresh_scorer.model.predict_risk = lambda features: (_ for _ in ()).throw(RuntimeError("Model failure!"))

    with pytest.raises(RuntimeError, match="Model failure!"):
        fresh_scorer.score_transaction({
            "transaction_id": "TX-FAILING-02",
            "sender_account_id": acc_id,
            "receiver_account_id": "ACC-RECIP",
            "amount": 50000.0,
            "channel": "wire",
        }, auto_update_profile=True)

    # Profile must remain strictly unchanged at N=1
    prof_after = fresh_scorer.get_account_profile(acc_id)
    assert prof_after["tx_count"] == 1
    assert prof_after["total_volume"] == 100.0

    # Restore predict_risk
    fresh_scorer.model.predict_risk = original_predict


# 9. Baseline model compatibility
def test_9_baseline_model_compatibility(fresh_scorer):
    """Verifies that baseline model operates correctly with 18 features while behavioral indicators fire."""
    res = fresh_scorer.score_transaction({
        "transaction_id": "TX-BASE-COMPAT",
        "sender_account_id": "ACC-SENDER",
        "receiver_account_id": "ACC-RECEIVER",
        "amount": 250000.0,
        "channel": "wire",
    })

    assert res["score_type"] == "model_score"
    assert res["model_version"].startswith("v2.1")
    assert "risk_score" in res
    assert "factors" in res
    assert "behavioral_indicators" in res


# 10. Model feature-schema compatibility
def test_10_model_feature_schema_compatibility():
    """Verifies that both baseline and candidate models load and execute without schema errors."""
    scorer = SentinelScorer()

    # Load baseline
    baseline_path = os.path.abspath("ml/models/saved/baseline_rf.joblib")
    if os.path.exists(baseline_path):
        scorer.load_model(baseline_path)
        assert len(scorer.model.feature_names) == 18
        res_base = scorer.score_transaction({"amount": 1000.0, "channel": "wire"})
        assert res_base["score_type"] == "model_score"

    # Load candidate
    candidate_path = os.path.abspath("ml/models/saved/candidate_behavioral_rf.joblib")
    if os.path.exists(candidate_path):
        scorer.load_model(candidate_path)
        assert len(scorer.model.feature_names) == 28
        res_cand = scorer.score_transaction({"amount": 1000.0, "channel": "wire"})
        assert res_cand["score_type"] == "model_score"


# 11. Profile persistence across restarts
def test_11_profile_persistence_save_load(fresh_scorer):
    """Verifies that save_profiles and load_profiles preserve exact profile state across restarts."""
    acc_id = "ACC-PERSIST-TEST"
    fresh_scorer.score_transaction({
        "transaction_id": "TX-P1",
        "sender_account_id": acc_id,
        "receiver_account_id": "ACC-R1",
        "amount": 1500.0,
        "channel": "wire",
    }, auto_update_profile=True)
    fresh_scorer.score_transaction({
        "transaction_id": "TX-P2",
        "sender_account_id": acc_id,
        "receiver_account_id": "ACC-R2",
        "amount": 2500.0,
        "channel": "ach",
    }, auto_update_profile=True)

    prof_orig = fresh_scorer.get_account_profile(acc_id)

    with tempfile.TemporaryDirectory() as tmpdir:
        save_path = os.path.join(tmpdir, "profiles_snapshot.json")
        fresh_scorer.save_profiles(save_path)
        assert os.path.exists(save_path)

        # Create a brand new scorer and load the snapshot
        new_scorer = SentinelScorer()
        assert new_scorer.get_account_profile(acc_id) is None

        loaded_count = new_scorer.load_profiles(save_path)
        assert loaded_count >= 1

        prof_loaded = new_scorer.get_account_profile(acc_id)
        assert prof_loaded is not None
        assert prof_loaded["tx_count"] == prof_orig["tx_count"]
        assert prof_loaded["total_volume"] == prof_orig["total_volume"]
        assert prof_loaded["amount_mean"] == prof_orig["amount_mean"]
        assert prof_loaded["amount_std"] == prof_orig["amount_std"]
        assert prof_loaded["channel_counts"] == prof_orig["channel_counts"]


# 12. Concurrent profile updates (thread safety)
def test_12_concurrent_profile_updates(fresh_scorer):
    """Verifies that concurrent transaction updates for the same account do not corrupt counts or volume."""
    acc_id = "ACC-CONCURRENT"
    num_threads = 10
    txns_per_thread = 20
    amount_per_tx = 10.0

    def worker(thread_idx: int):
        for j in range(txns_per_thread):
            txn_id = f"TX-T{thread_idx}-{j}"
            fresh_scorer.score_transaction({
                "transaction_id": txn_id,
                "sender_account_id": acc_id,
                "receiver_account_id": f"ACC-RECIP-{thread_idx}",
                "amount": amount_per_tx,
                "channel": "wire",
            }, auto_update_profile=True)

    threads = [threading.Thread(target=worker, args=(i,)) for i in range(num_threads)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    prof = fresh_scorer.get_account_profile(acc_id)
    expected_total_tx = num_threads * txns_per_thread
    expected_total_vol = expected_total_tx * amount_per_tx

    assert prof["tx_count"] == expected_total_tx
    assert np.isclose(prof["total_volume"], expected_total_vol)
    assert np.isclose(prof["amount_mean"], amount_per_tx)


# Backend ScoringService integration test
def test_backend_scoring_service_behavioral_integration():
    """Verifies that backend ScoringService accurately triggers profile updates and returns transaction_id."""
    svc = ScoringService()
    req = ScoreRequest(
        transaction=TransactionCreate(
            sender_account_id="ACC-BACKEND-TEST",
            receiver_account_id="ACC-RECEIVER",
            amount=50000.0,
            channel="wire",
        )
    )

    resp = svc.score_transaction(req, auto_update_profile=True)
    assert resp.transaction_id is not None
    assert resp.transaction_id.startswith("TXN-")
    assert resp.risk_score >= 0.0
    assert len(resp.factors) >= 1

    # Check profile via backend service
    prof = svc.get_account_profile("ACC-BACKEND-TEST")
    assert prof is not None
    assert prof["tx_count"] >= 1


# Phase 4A.1 Integration Hardening Tests
def test_phase4a1_persistence_failure_isolates_behavioral_profile():
    """
    Verifies that if transaction persistence in the repository fails,
    the behavioral profile is NEVER updated, preventing state corruption.
    """
    from app.repositories.base import repo
    svc = ScoringService()
    acc_id = "ACC-ROLLBACK-TEST"

    # Pre-condition: account has no profile
    assert svc.get_account_profile(acc_id) is None

    # Simulate a persistence failure in repo.add_transaction
    orig_add_tx = repo.add_transaction
    def failing_add_tx(*args, **kwargs):
        raise RuntimeError("Database connection dropped during transaction persistence!")
    repo.add_transaction = failing_add_tx

    req = ScoreRequest(
        transaction=TransactionCreate(
            sender_account_id=acc_id,
            receiver_account_id="ACC-RECEIVER",
            amount=75000.0,
            channel="wire",
        )
    )

    with pytest.raises(RuntimeError, match="Database connection dropped"):
        svc.score_transaction(req, auto_update_profile=True, persist_transaction=True)

    # Post-condition: Behavioral profile must still be empty!
    assert svc.get_account_profile(acc_id) is None

    # Restore repo
    repo.add_transaction = orig_add_tx


def test_phase4a1_durable_restart_idempotency(fresh_scorer):
    """
    Verifies that saving snapshot to disk preserves seen_tx_ids so that
    retrying a transaction after restart does not double-count volume.
    """
    acc_id = "ACC-RESTART-IDEM"
    txn = {
        "transaction_id": "TX-DURABLE-001",
        "sender_account_id": acc_id,
        "receiver_account_id": "ACC-RECIP",
        "amount": 2500.0,
        "channel": "wire",
    }

    # Process first time
    updated_1 = fresh_scorer.update_profile(txn)
    assert updated_1 is True

    prof_1 = fresh_scorer.get_account_profile(acc_id)
    assert prof_1["tx_count"] == 1
    assert prof_1["total_volume"] == 2500.0

    with tempfile.TemporaryDirectory() as tmpdir:
        snap_path = os.path.join(tmpdir, "profiles_idem_snap.json")
        fresh_scorer.save_profiles(snap_path)

        # Simulate fresh process startup / restart
        restarted_scorer = SentinelScorer()
        assert restarted_scorer.get_account_profile(acc_id) is None

        restarted_scorer.load_profiles(snap_path)
        prof_restarted = restarted_scorer.get_account_profile(acc_id)
        assert prof_restarted["tx_count"] == 1
        assert prof_restarted["total_volume"] == 2500.0

        # Resubmit exact same transaction ID after restart
        updated_2 = restarted_scorer.update_profile(txn)
        assert updated_2 is False  # Correctly rejected as duplicate across restart!

        prof_after = restarted_scorer.get_account_profile(acc_id)
        assert prof_after["tx_count"] == 1
        assert prof_after["total_volume"] == 2500.0


def test_phase4a1_account_profile_endpoint():
    """
    Verifies that GET /api/accounts/{account_id}/profile returns valid AccountProfileResponse
    schema for both cold-start and active accounts.
    """
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)

    # 1. Cold-start query
    resp_cold = client.get("/api/accounts/ACC-UNSEEN-999/profile")
    assert resp_cold.status_code == 200
    data_cold = resp_cold.json()
    assert data_cold["account_id"] == "ACC-UNSEEN-999"
    assert data_cold["status"] == "cold_start"
    assert data_cold["has_sufficient_history"] is False
    assert data_cold["tx_count"] == 0
    assert data_cold["confidence_score"] == 0.0

    # 2. Score 3 transactions to establish profile
    acc_id = "ACC-API-TEST"
    for i in range(3):
        client.post("/api/transactions/score", json={
            "transaction": {
                "sender_account_id": acc_id,
                "receiver_account_id": f"ACC-RECIP-{i}",
                "amount": 1000.0 + (i * 100.0),
                "currency": "USD",
                "channel": "wire",
            }
        })

    resp_active = client.get(f"/api/accounts/{acc_id}/profile")
    assert resp_active.status_code == 200
    data_active = resp_active.json()
    assert data_active["account_id"] == acc_id
    assert data_active["tx_count"] == 3
    assert data_active["has_sufficient_history"] is True
    assert data_active["confidence_score"] > 0.0
    assert data_active["total_volume"] == 3300.0
    assert "wire" in data_active["channel_counts"]


# Member 1 ML Audit Regression Tests
def test_ml_audit_none_and_malformed_inputs_handling(fresh_scorer):
    """
    Regression Test: Verifies that None, invalid strings, negative values,
    and missing account IDs do not cause TypeErrors or corrupt the profile store.
    """
    # 1. Score with None amount and None account IDs
    res_none = fresh_scorer.score_transaction({
        "transaction_id": "TX-CORRUPT-01",
        "sender_account_id": None,
        "receiver_account_id": None,
        "amount": None,
        "channel": None,
    })
    assert res_none["risk_score"] >= 0.0
    assert isinstance(res_none["factors"], list)

    # 2. Score with invalid non-numeric string amount
    res_str = fresh_scorer.score_transaction({
        "transaction_id": "TX-CORRUPT-02",
        "sender_account_id": "ACC-TEST-DIRTY",
        "receiver_account_id": "ACC-RECIP",
        "amount": "not_a_number",
        "channel": "wire",
    })
    assert res_str["risk_score"] >= 0.0

    # 3. Update profile with None amount and None account IDs
    fresh_scorer.update_profile({
        "transaction_id": "TX-CORRUPT-03",
        "sender_account_id": None,
        "receiver_account_id": None,
        "amount": None,
    })
    # Must NOT create an account profile for string "None"
    assert "None" not in fresh_scorer.fingerprint_engine.profiles
    assert "" not in fresh_scorer.fingerprint_engine.profiles


def test_ml_audit_frequent_counterparties_ranked_by_frequency(fresh_scorer):
    """
    Regression Test: Verifies that frequent_counterparties returns recipients
    sorted by descending transaction frequency, not arbitrary insertion order.
    """
    acc_id = "ACC-RANKED-TEST"
    # Send 1 tx to RARE-RECIP first
    fresh_scorer.update_profile({
        "transaction_id": "TX-RANK-1",
        "sender_account_id": acc_id,
        "receiver_account_id": "RARE-RECIP",
        "amount": 100.0,
        "channel": "wire",
    })
    # Send 5 txs to FREQUENT-RECIP second
    for i in range(5):
        fresh_scorer.update_profile({
            "transaction_id": f"TX-RANK-FREQ-{i}",
            "sender_account_id": acc_id,
            "receiver_account_id": "FREQUENT-RECIP",
            "amount": 100.0,
            "channel": "wire",
        })
    # Send 3 txs to MEDIUM-RECIP third
    for i in range(3):
        fresh_scorer.update_profile({
            "transaction_id": f"TX-RANK-MED-{i}",
            "sender_account_id": acc_id,
            "receiver_account_id": "MEDIUM-RECIP",
            "amount": 100.0,
            "channel": "wire",
        })

    prof = fresh_scorer.get_account_profile(acc_id)
    assert prof is not None
    # FREQUENT (5) must appear before MEDIUM (3), which must appear before RARE (1)
    assert prof["frequent_counterparties"] == ["FREQUENT-RECIP", "MEDIUM-RECIP", "RARE-RECIP"]


def test_ml_audit_adaptive_alert_sensitivity_thresholding(fresh_scorer):
    """
    Regression Test: Verifies dynamic sensitivity thresholding for Adaptive Risk Monitoring.
    Higher sensitivity (lower threshold) catches borderline transactions,
    while conservative sensitivity (higher threshold) suppresses false positives.
    """
    txn = {
        "transaction_id": "TX-ADAPTIVE-01",
        "sender_account_id": "ACC-SENS-TEST",
        "receiver_account_id": "ACC-RECIP",
        "amount": 15000.0,
        "channel": "wire",
    }

    # Score with conservative threshold (e.g., 50.0) -> Alert should NOT trigger
    res_cons = fresh_scorer.score_transaction(txn, alert_threshold=50.0)
    assert res_cons["is_alert_triggered"] is False

    # Score same transaction with aggressive threshold (e.g., 10.0) -> Alert SHOULD trigger (risk score ~18.2)
    res_agg = fresh_scorer.score_transaction(txn, alert_threshold=10.0)
    assert res_agg["is_alert_triggered"] is True

    # Test global dynamic threshold setting
    fresh_scorer.set_alert_threshold(15.0)
    res_global = fresh_scorer.score_transaction(txn)
    assert res_global["is_alert_triggered"] is True


def test_phase3_demo_end_to_end_sequence():
    """
    Phase 3 Demo Integration Test:
    Verifies the complete realistic sequence:
    1. Cold-start transaction for a new account.
    2. Sequential transactions building an active behavioral profile.
    3. Dynamic threshold configuration affecting alert outcomes.
    4. Behavioral deviation anomaly detection with explainable factors.
    5. Account isolation and idempotency guarantees.
    """
    import uuid
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)

    account_a = f"ACC-DEMO-A-{uuid.uuid4().hex[:6]}"
    account_b = f"ACC-DEMO-B-{uuid.uuid4().hex[:6]}"
    recip_1 = "RECIP-MERCHANT-01"
    recip_2 = "RECIP-MERCHANT-02"

    # Step 1: Cold start
    resp1 = client.post("/api/transactions/score", json={
        "transaction": {
            "id": f"TX-DEMO-1-{uuid.uuid4().hex[:4]}",
            "sender_account_id": account_a,
            "receiver_account_id": recip_1,
            "amount": 1000.0,
            "currency": "USD",
            "channel": "wire",
        }
    })
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert 0.0 <= data1["risk_score"] <= 100.0
    assert 0.0 <= data1["confidence"] <= 1.0
    assert "factors" in data1
    assert "behavioral_indicators" in data1
    codes1 = [ind["code"] for ind in data1["behavioral_indicators"]]
    assert "INSUFFICIENT_HISTORY" in codes1

    # Profile after 1 tx is cold_start
    prof1 = client.get(f"/api/accounts/{account_a}/profile").json()
    assert prof1["status"] == "cold_start"
    assert prof1["tx_count"] == 1
    assert prof1["has_sufficient_history"] is False

    # Step 2: Establish profile with tx 2 and tx 3
    for i, amt in enumerate([950.0, 1050.0], start=2):
        client.post("/api/transactions/score", json={
            "transaction": {
                "id": f"TX-DEMO-{i}-{uuid.uuid4().hex[:4]}",
                "sender_account_id": account_a,
                "receiver_account_id": recip_1,
                "amount": amt,
                "currency": "USD",
                "channel": "wire",
            }
        })

    prof3 = client.get(f"/api/accounts/{account_a}/profile").json()
    assert prof3["status"] == "active"
    assert prof3["tx_count"] == 3
    assert prof3["has_sufficient_history"] is True
    assert prof3["confidence_score"] >= 0.80
    assert prof3["amount_mean"] == 1000.0

    # Step 3: Threshold change demonstration
    tx_id_test = f"TX-DEMO-THRESH-{uuid.uuid4().hex[:4]}"
    # High threshold -> No alert
    resp_high = client.post("/api/transactions/score", json={
        "transaction": {
            "id": tx_id_test,
            "sender_account_id": account_a,
            "receiver_account_id": recip_2,
            "amount": 5000.0,
            "currency": "USD",
            "channel": "wire",
        },
        "alert_threshold": 80.0,
    })
    assert resp_high.status_code == 200
    assert resp_high.json()["is_alert_triggered"] is False

    # Low threshold -> Alert triggers
    tx_id_test2 = f"TX-DEMO-THRESH-2-{uuid.uuid4().hex[:4]}"
    resp_low = client.post("/api/transactions/score", json={
        "transaction": {
            "id": tx_id_test2,
            "sender_account_id": account_a,
            "receiver_account_id": recip_2,
            "amount": 5000.0,
            "currency": "USD",
            "channel": "wire",
        },
        "alert_threshold": 10.0,
    })
    assert resp_low.status_code == 200
    assert resp_low.json()["is_alert_triggered"] is True

    # Step 4: Extreme behavioral anomaly ($25,000 vs baseline $1,000)
    tx_id_anomaly = f"TX-DEMO-ANOMALY-{uuid.uuid4().hex[:4]}"
    resp_anom = client.post("/api/transactions/score", json={
        "transaction": {
            "id": tx_id_anomaly,
            "sender_account_id": account_a,
            "receiver_account_id": recip_2,
            "amount": 25000.0,
            "currency": "USD",
            "channel": "crypto",
        }
    })
    assert resp_anom.status_code == 200
    data_anom = resp_anom.json()
    anom_codes = [ind["code"] for ind in data_anom["behavioral_indicators"]]
    assert "AMOUNT_ZSCORE_CRITICAL" in anom_codes or "AMOUNT_RATIO_ELEVATED" in anom_codes

    # Step 5: Account isolation & idempotency
    # Account B must be unaffected by Account A's history
    prof_b = client.get(f"/api/accounts/{account_b}/profile").json()
    assert prof_b["status"] == "cold_start"
    assert prof_b["tx_count"] == 0

    # Duplicate submission of tx_id_anomaly must not increment tx_count
    prof_a_before = client.get(f"/api/accounts/{account_a}/profile").json()
    client.post("/api/transactions/score", json={
        "transaction": {
            "id": tx_id_anomaly,
            "sender_account_id": account_a,
            "receiver_account_id": recip_2,
            "amount": 25000.0,
            "currency": "USD",
            "channel": "crypto",
        }
    })
    prof_a_after = client.get(f"/api/accounts/{account_a}/profile").json()
    assert prof_a_after["tx_count"] == prof_a_before["tx_count"]
    assert prof_a_after["total_volume"] == prof_a_before["total_volume"]


