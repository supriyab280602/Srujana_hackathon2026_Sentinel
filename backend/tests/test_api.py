from app.schemas.network import AccountNetworkResponse, NetworkNode, NetworkEdge
from app.services.graph_service import graph_service
from app.repositories.base import repo


def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "sentinel-core"
    assert data["version"] == "0.1.0"
    assert "timestamp" in data


def test_list_alerts(authed_client):
    response = authed_client.get("/api/alerts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "risk_score" in data[0]
    assert "factors" in data[0]


def test_list_alerts_filtered_by_severity(authed_client):
    response = authed_client.get("/api/alerts?severity=critical")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    for alert in data:
        assert alert["severity"] == "critical"

    # Non-existent severity filter returns empty list
    response_none = authed_client.get("/api/alerts?severity=low")
    assert response_none.status_code == 200
    assert isinstance(response_none.json(), list)


def test_get_alert_by_id(authed_client):
    response = authed_client.get("/api/alerts/ALT-8902")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "ALT-8902"
    assert data["severity"] == "critical"
    assert data["risk_score"] == 94.0


def test_get_alert_not_found(authed_client):
    response = authed_client.get("/api/alerts/NON-EXISTENT")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_account_transactions(authed_client):
    response = authed_client.get("/api/accounts/ACC-7749/transactions")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    assert all(t["sender_account_id"] == "ACC-7749" or t["receiver_account_id"] == "ACC-7749" for t in data)


def test_get_account_network_full(authed_client):
    response = authed_client.get("/api/accounts/ACC-7749/network")
    assert response.status_code == 200
    data = response.json()
    assert data["account_id"] == "ACC-7749"
    assert len(data["nodes"]) >= 2
    assert len(data["edges"]) >= 1
    assert "detected_cycles" in data
    assert "metrics" in data
    assert data["metrics"]["edge_count"] == len(data["edges"])


def test_get_account_network_replay_mode(authed_client):
    """
    Verifies that Replay Mode is embedded directly within the Transaction Relationship Graph
    by filtering graph state with zero-lookahead chronological steps.
    """
    response_step_2 = authed_client.get("/api/accounts/ACC-7749/network?as_of_step=2")

    assert response_step_2.status_code == 200
    data_step_2 = response_step_2.json()

    response_full = authed_client.get("/api/accounts/ACC-7749/network")
    data_full = response_full.json()

    # Step 2 should have at most 2 edges and fewer or equal nodes than full graph
    assert len(data_step_2["edges"]) == 2
    assert len(data_step_2["edges"]) < len(data_full["edges"])
    assert data_step_2["metrics"]["current_replay_step"] == 2
    assert all(e["step_index"] <= 2 for e in data_step_2["edges"])


def test_score_transaction_high_risk(authed_client):
    payload = {
        "transaction": {
            "sender_account_id": "ACC-7749",
            "receiver_account_id": "ACC-4410",
            "amount": 25000.0,
            "currency": "USD",
            "channel": "crypto",
            "location_country": "US",
        },
        "account_history_lookback_days": 30,
        "include_graph_context": True,
    }
    response = authed_client.post("/api/transactions/score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "risk_score" in data
    assert data["risk_score"] > 0
    assert "factors" in data
    assert data["confidence"] > 0
    assert data["is_alert_triggered"] is True
    assert data["suggested_severity"] in ["medium", "high", "critical"]

    # Verify transaction was persisted and actual ID is returned
    txn_id = data["transaction_id"]
    assert txn_id is not None
    assert txn_id.startswith("TXN-")

    # Verify transaction is retrievable through the account ledger
    txn_resp = authed_client.get("/api/accounts/ACC-7749/transactions")
    assert txn_resp.status_code == 200
    assert any(t["id"] == txn_id for t in txn_resp.json())

    # Verify exactly one corresponding alert was created and is retrievable
    alerts_resp = authed_client.get("/api/alerts")
    assert alerts_resp.status_code == 200
    matched_alerts = [a for a in alerts_resp.json() if a["transaction_id"] == txn_id]
    assert len(matched_alerts) == 1

    new_alert = matched_alerts[0]
    assert new_alert["account_id"] == "ACC-7749"
    assert new_alert["severity"] == data["suggested_severity"]
    assert new_alert["risk_score"] == data["risk_score"]
    assert new_alert["status"] == "open"
    assert len(new_alert["factors"]) == len(data["factors"])

    # Verify retrievable via GET /api/alerts/{id}
    single_alert_resp = authed_client.get(f"/api/alerts/{new_alert['id']}")
    assert single_alert_resp.status_code == 200
    assert single_alert_resp.json()["id"] == new_alert["id"]


def test_score_transaction_low_risk(authed_client):
    payload = {
        "transaction": {
            "sender_account_id": "ACC-CLEAN",
            "receiver_account_id": "ACC-GROCERY",
            "amount": 42.50,
            "currency": "USD",
            "channel": "card",
            "location_country": "US",
        },
        "account_history_lookback_days": 30,
        "include_graph_context": False,
    }
    response = authed_client.post("/api/transactions/score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_score"] < 50.0
    assert data["is_alert_triggered"] is False
    assert data["suggested_severity"] == "low"

    # Persists transaction but creates NO alert
    txn_id = data["transaction_id"]
    assert txn_id is not None
    assert txn_id.startswith("TXN-")

    txn_resp = authed_client.get("/api/accounts/ACC-CLEAN/transactions")
    assert txn_resp.status_code == 200
    assert any(t["id"] == txn_id for t in txn_resp.json())

    alerts_resp = authed_client.get("/api/alerts")
    assert alerts_resp.status_code == 200
    assert not any(a["transaction_id"] == txn_id for a in alerts_resp.json())


def test_dynamic_alert_investigation_lifecycle(authed_client):
    """
    Verifies that dynamically generated alerts can be reviewed by investigators,
    transitioning status properly.
    """
    payload = {
        "transaction": {
            "sender_account_id": "ACC-LIFECYCLE-MULE",
            "receiver_account_id": "ACC-OFFSHORE-99",
            "amount": 99000.0,
            "currency": "USD",
            "channel": "crypto",
            "location_country": "US",
        },
        "account_history_lookback_days": 30,
        "include_graph_context": True,
    }
    score_resp = authed_client.post("/api/transactions/score", json=payload)
    assert score_resp.status_code == 200
    score_data = score_resp.json()
    assert score_data["is_alert_triggered"] is True
    txn_id = score_data["transaction_id"]

    # Locate generated alert
    alerts = authed_client.get("/api/alerts").json()
    alert = next(a for a in alerts if a["transaction_id"] == txn_id)
    alert_id = alert["id"]

    # Submit investigation review on the dynamically generated alert
    review_payload = {
        "alert_id": alert_id,
        "decision": "confirm_fraud",
        "notes": "Confirmed dynamic mule activity from live scoring.",
        "investigator_id": "INV-AUDITOR-99",
        "tags": ["dynamic_test", "confirmed"],
    }
    review_resp = authed_client.post(f"/api/investigations/{alert_id}/review", json=review_payload)
    assert review_resp.status_code == 200
    assert review_resp.json()["alert_id"] == alert_id

    # Verify status transitioned to escalated
    updated_alert = authed_client.get(f"/api/alerts/{alert_id}").json()
    assert updated_alert["status"] == "escalated"


def test_investigation_review_success_and_state_transition(authed_client):
    payload = {
        "alert_id": "ALT-8902",
        "decision": "confirm_fraud",
        "notes": "Verified fan-out burst matches known mule pattern.",
        "investigator_id": "INV-TEST-01",
        "tags": ["fanout", "confirmed_mule"],
    }
    response = authed_client.post("/api/investigations/ALT-8902/review", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["alert_id"] == "ALT-8902"
    assert data["decision"] == "confirm_fraud"
    assert "review_id" in data
    # Verified user stub sub overrides client-supplied investigator_id
    assert data["investigator_id"] == "00000000-0000-0000-0000-000000000099"

    # Verify that the alert's status transitioned to escalated
    alert_resp = authed_client.get("/api/alerts/ALT-8902")
    assert alert_resp.status_code == 200
    assert alert_resp.json()["status"] == "escalated"


def test_investigation_review_not_found(authed_client):
    payload = {
        "alert_id": "ALT-DOES-NOT-EXIST",
        "decision": "false_positive",
        "notes": "Does not exist",
        "investigator_id": "INV-TEST-01",
    }
    response = authed_client.post("/api/investigations/ALT-DOES-NOT-EXIST/review", json=payload)
    assert response.status_code == 404


def test_investigation_review_path_mismatch_rejected_without_mutation(authed_client):
    """
    Submitting a review where path investigation_id does not match payload alert_id
    must return 400 Bad Request and NOT mutate either alert record.
    """
    alert_8902_before = authed_client.get("/api/alerts/ALT-8902").json()
    alert_8899_before = authed_client.get("/api/alerts/ALT-8899").json()
    assert alert_8902_before["status"] == "open"
    assert alert_8899_before["status"] == "under_review"
    reviews_count_before = len(repo._reviews)

    mismatched_payload = {
        "alert_id": "ALT-8899",
        "decision": "confirm_fraud",
        "notes": "Attempting to mutate ALT-8899 via ALT-8902 path",
        "investigator_id": "INV-ATTACKER",
    }
    response = authed_client.post("/api/investigations/ALT-8902/review", json=mismatched_payload)

    assert response.status_code == 400
    assert "mismatch" in response.json()["detail"].lower()
    assert "ALT-8902" in response.json()["detail"]
    assert "ALT-8899" in response.json()["detail"]

    # Verify neither alert record was mutated
    alert_8902_after = authed_client.get("/api/alerts/ALT-8902").json()
    alert_8899_after = authed_client.get("/api/alerts/ALT-8899").json()
    assert alert_8902_after["status"] == "open"
    assert alert_8899_after["status"] == "under_review"
    assert len(repo._reviews) == reviews_count_before


def test_investigation_review_nonexistent_path_with_valid_body_alert_rejected_without_mutation(authed_client):
    """
    Submitting a review where path investigation_id is nonexistent but body alert_id is valid
    must return 400 Bad Request and NOT mutate the existing alert.
    """
    alert_before = authed_client.get("/api/alerts/ALT-8902").json()
    assert alert_before["status"] == "open"
    reviews_count_before = len(repo._reviews)

    payload = {
        "alert_id": "ALT-8902",
        "decision": "confirm_fraud",
        "notes": "Nonexistent path ID with valid body",
    }
    response = authed_client.post("/api/investigations/NON-EXISTENT-CASE/review", json=payload)

    assert response.status_code == 400
    assert "mismatch" in response.json()["detail"].lower()

    alert_after = authed_client.get("/api/alerts/ALT-8902").json()
    assert alert_after["status"] == "open"
    assert len(repo._reviews) == reviews_count_before


def test_investigation_review_valid_path_with_nonexistent_body_alert_rejected_without_mutation(authed_client):
    """
    Submitting a review where path investigation_id is valid but body alert_id is nonexistent
    must return 400 Bad Request and NOT mutate the existing alert.
    """
    alert_before = authed_client.get("/api/alerts/ALT-8902").json()
    assert alert_before["status"] == "open"
    reviews_count_before = len(repo._reviews)

    payload = {
        "alert_id": "NON-EXISTENT-ALERT",
        "decision": "confirm_fraud",
        "notes": "Valid path ID with nonexistent body alert",
    }
    response = authed_client.post("/api/investigations/ALT-8902/review", json=payload)

    assert response.status_code == 400
    assert "mismatch" in response.json()["detail"].lower()

    alert_after = authed_client.get("/api/alerts/ALT-8902").json()
    assert alert_after["status"] == "open"
    assert len(repo._reviews) == reviews_count_before



def test_networkx_cycle_detection():
    """Unit test for GraphService NetworkX simple cycle detection."""
    synthetic_network = AccountNetworkResponse(
        account_id="A",
        nodes=[
            NetworkNode(id="A", label="A", riskScore=50.0),
            NetworkNode(id="B", label="B", riskScore=60.0),
            NetworkNode(id="C", label="C", riskScore=70.0),
        ],
        edges=[
            NetworkEdge(id="1", source="A", target="B", amount=100.0, timestamp="10:00"),
            NetworkEdge(id="2", source="B", target="C", amount=100.0, timestamp="10:05"),
            NetworkEdge(id="3", source="C", target="A", amount=100.0, timestamp="10:10"),
        ]
    )
    cycles = graph_service.detect_cycles(synthetic_network)
    assert len(cycles) == 1
    assert set(cycles[0]) == {"A", "B", "C"}


# ---------------------------------------------------------------------------
# Task A — Regression: deep-copy isolation for seeded alert status mutations
# ---------------------------------------------------------------------------

def test_seeded_alert_status_restored_after_mutation(authed_client):
    """
    Confirms the autouse isolate_repository_state fixture deep-copies seeded
    alert objects so that an in-place status mutation (via investigation review)
    in one test does not carry over into the next.

    This test would FAIL if the fixture used shallow dict copies, because a
    shallow copy keeps the same Pydantic object references — after reset, the
    restored dict still points to the already-mutated instance.

    With model_copy(deep=True) the snapshot holds independent objects whose
    field values are independent from the live repo objects, so restoring the
    snapshot also restores field values.

    Proof:
    1. Assert ALT-8902 starts at its seeded 'open' status.
    2. Confirm-fraud via POST review → transitions it to 'escalated' in-test.
    3. Fixture tears-down and restores from the deep-copied snapshot.
    4. The companion test below asserts it is 'open' again in the next test.
    """
    # Step 1: confirm seeded state at test start
    pre = authed_client.get("/api/alerts/ALT-8902").json()
    assert pre["status"] == "open", (
        "Seeded alert ALT-8902 must start as 'open'; "
        "a mutation leaked from a previous test — deep-copy isolation is broken."
    )

    # Step 2: mutate via review submission
    review_resp = authed_client.post("/api/investigations/ALT-8902/review", json={
        "alert_id": "ALT-8902",
        "decision": "confirm_fraud",
        "notes": "Isolation regression check.",
        "investigator_id": "INV-ISOLATION-TEST",
    })
    assert review_resp.status_code == 200

    # Step 3: within this test the status is now 'escalated'
    post = authed_client.get("/api/alerts/ALT-8902").json()
    assert post["status"] == "escalated"
    # Fixture will now restore state from the deep-copied snapshot on teardown.


def test_seeded_alert_status_is_open_after_restore(authed_client):
    """
    Must run after test_seeded_alert_status_restored_after_mutation.
    Confirms ALT-8902.status is back to 'open', proving the deep-copy restore
    reversed the mutation applied by the previous test.
    """
    resp = authed_client.get("/api/alerts/ALT-8902").json()
    assert resp["status"] == "open", (
        "Alert ALT-8902 should be restored to 'open' after the previous test's "
        "mutation. If this fails, the fixture is still using shallow copies."
    )



# ---------------------------------------------------------------------------
# Task B — Regression: alert creation failure must not return HTTP 200
# ---------------------------------------------------------------------------

def test_score_transaction_alert_creation_failure_returns_500(authed_client):
    """
    When alert_service.create_alert raises an unhandled exception for a
    high-risk transaction, the scoring endpoint MUST NOT return HTTP 200.
    Returning 200 here would falsely imply the alert was persisted.

    Patch target: the method on the live AlertService singleton that
    scoring_service imported at module load time:
        from app.services.alert_service import alert_service
    We patch the method on that same object, which is what ScoringService
    calls at runtime.

    TestClient note:
    By default TestClient(raise_server_exceptions=True) re-raises unhandled
    server exceptions in the test process rather than converting them to an
    HTTP 500 response.  We create a local client with
    raise_server_exceptions=False so we can inspect the status code directly.
    This does not affect any other test — the shared 'client' fixture retains
    its default behaviour.

    Known limitation documented (not fixed here):
    record_transaction() executes BEFORE create_alert() inside
    score_transaction(). When create_alert raises, the transaction has
    already been written to repo._transactions. The orphaned transaction
    remains after the error is returned. This test documents that
    behaviour; rollback/compensation is out of scope for this task.
    """
    import pytest
    from unittest.mock import patch
    from fastapi.testclient import TestClient
    from app.main import app
    from app.services.alert_service import alert_service as live_alert_service
    from app.repositories.base import repo as live_repo

    high_risk_payload = {
        "transaction": {
            "sender_account_id": "ACC-FAILURE-TEST",
            "receiver_account_id": "ACC-SINK",
            "amount": 75000.0,
            "currency": "USD",
            "channel": "crypto",
            "location_country": "US",
        },
        "account_history_lookback_days": 30,
        "include_graph_context": False,
    }

    alert_count_before = len(live_repo._alerts)

    # raise_server_exceptions=False: server errors become HTTP responses
    # instead of being re-raised in the test process.
    with TestClient(app, raise_server_exceptions=False) as non_raising_client:
        with patch.object(
            live_alert_service,
            "create_alert",
            side_effect=RuntimeError("Simulated storage failure in alert_service.create_alert"),
        ):
            response = non_raising_client.post("/api/transactions/score", json=high_risk_payload)

    # Must NOT return 200 — that would be a false-success contract violation.
    assert response.status_code == 500, (
        f"Expected HTTP 500 when alert creation fails, got {response.status_code}. "
        "A 200 response here would falsely imply the alert was persisted."
    )

    # No new alert must have been stored.
    assert len(live_repo._alerts) == alert_count_before, (
        "No alert should be stored when create_alert raises an exception."
    )

    # Document transaction orphan: record_transaction() already ran before
    # create_alert() was called, so the transaction IS in the ledger.
    # This is a known limitation — not asserted as an error, just documented.
    txns_after = [
        t for t in live_repo._transactions.values()
        if t.sender_account_id == "ACC-FAILURE-TEST"
    ]
    # txns_after contains exactly one orphaned transaction (the one persisted
    # before create_alert raised). Future rollback work can activate:
    # assert len(txns_after) == 1, "Exactly one orphaned transaction expected"
    _ = txns_after  # suppress lint; see comment above
