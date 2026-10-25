from datetime import datetime, timezone, timedelta
import pytest
from app.main import app
from app.repositories.base import repo
from app.schemas.transaction import TransactionRead
from app.core.auth import verified_user, VerifiedUser

_STUB_USER = VerifiedUser(sub="00000000-0000-0000-0000-000000000099", email="test@sentinel.test")


@pytest.fixture(autouse=True)
def auth_override():
    app.dependency_overrides[verified_user] = lambda: _STUB_USER
    yield
    app.dependency_overrides.pop(verified_user, None)


# Reference UTC time
BASE_TIME = datetime(2026, 10, 24, 12, 0, 0, tzinfo=timezone.utc)



def create_txn(
    tx_id: str,
    sender: str,
    receiver: str,
    amount: float,
    ts: datetime,
    channel: str = "wire",
) -> TransactionRead:
    return TransactionRead(
        id=tx_id,
        sender_account_id=sender,
        receiver_account_id=receiver,
        amount=amount,
        currency="USD",
        channel=channel,
        timestamp=ts,
    )


# ---------------------------------------------------------------------------
# Acceptance Test 1: Graph nodes and edges correspond to actual ledger transactions
# ---------------------------------------------------------------------------
def test_graph_nodes_and_edges_correspond_to_actual_ledger_transactions(client):
    custom_txns = {
        "TXN-REAL-01": create_txn("TXN-REAL-01", "ACC-100", "ACC-200", 50000.0, BASE_TIME),
        "TXN-REAL-02": create_txn(
            "TXN-REAL-02", "ACC-200", "ACC-300", 49000.0, BASE_TIME + timedelta(minutes=5)
        ),
    }
    repo.reset_transactions(custom_txns)

    response = client.get("/api/accounts/ACC-100/network?max_hops=2")
    assert response.status_code == 200
    data = response.json()

    assert data["account_id"] == "ACC-100"
    edge_ids = {e["id"] for e in data["edges"]}
    assert edge_ids == {"TXN-REAL-01", "TXN-REAL-02"}

    node_ids = {n["id"] for n in data["nodes"]}
    assert node_ids == {"ACC-100", "ACC-200", "ACC-300"}

    # No hardcoded mock IDs (like "e1", "e2", etc.)
    assert not any(e["id"].startswith("e") and len(e["id"]) == 2 for e in data["edges"])


# ---------------------------------------------------------------------------
# Acceptance Test 2: No hardcoded unrelated edges appear in the graph result
# ---------------------------------------------------------------------------
def test_no_hardcoded_unrelated_edges_appear_in_graph_result(client):
    txns = {
        "TXN-CONNECTED": create_txn("TXN-CONNECTED", "ACC-MAIN", "ACC-NEIGHBOR", 1000.0, BASE_TIME),
        "TXN-UNRELATED": create_txn(
            "TXN-UNRELATED", "ACC-OTHER-1", "ACC-OTHER-2", 9999.0, BASE_TIME + timedelta(minutes=1)
        ),
    }
    repo.reset_transactions(txns)

    response = client.get("/api/accounts/ACC-MAIN/network?max_hops=3")
    assert response.status_code == 200
    data = response.json()

    edge_ids = [e["id"] for e in data["edges"]]
    node_ids = [n["id"] for n in data["nodes"]]

    assert edge_ids == ["TXN-CONNECTED"]
    assert set(node_ids) == {"ACC-MAIN", "ACC-NEIGHBOR"}
    assert "TXN-UNRELATED" not in edge_ids
    assert "ACC-OTHER-1" not in node_ids
    assert "ACC-OTHER-2" not in node_ids


# ---------------------------------------------------------------------------
# Acceptance Test 3: Directed transfer relationships and metadata represented correctly
# ---------------------------------------------------------------------------
def test_directed_transfer_relationships_and_metadata_represented(client):
    ts = BASE_TIME + timedelta(minutes=15)
    txns = {
        "TXN-META-01": create_txn(
            "TXN-META-01", "ACC-SENDER", "ACC-RECEIVER", 75432.10, ts, channel="crypto"
        ),
    }
    repo.reset_transactions(txns)

    response = client.get("/api/accounts/ACC-SENDER/network")
    assert response.status_code == 200
    data = response.json()

    assert len(data["edges"]) == 1
    edge = data["edges"][0]
    assert edge["id"] == "TXN-META-01"
    assert edge["source"] == "ACC-SENDER"
    assert edge["target"] == "ACC-RECEIVER"
    assert edge["amount"] == 75432.10
    assert edge["channel"] == "crypto"
    assert edge["timestamp"] == ts.isoformat()
    assert edge["hopIndex"] == 1
    assert edge["step_index"] == 1

    # Verify NetworkX directional degree metrics
    metrics = data["metrics"]
    assert metrics["out_degree"]["ACC-SENDER"] == 1
    assert metrics["in_degree"]["ACC-SENDER"] == 0
    assert metrics["out_degree"]["ACC-RECEIVER"] == 0
    assert metrics["in_degree"]["ACC-RECEIVER"] == 1


# ---------------------------------------------------------------------------
# Acceptance Test 4: Empty ledger or account with no matching transactions handled safely
# ---------------------------------------------------------------------------
def test_empty_ledger_handled_safely(client):
    repo.reset_transactions({})

    response = client.get("/api/accounts/ACC-EMPTY/network")
    assert response.status_code == 200
    data = response.json()

    assert data["account_id"] == "ACC-EMPTY"
    assert len(data["nodes"]) == 1
    assert data["nodes"][0]["id"] == "ACC-EMPTY"
    assert data["nodes"][0]["label"] == "ACC-EMPTY (Target)"
    assert data["edges"] == []
    assert data["total_volume"] == 0.0
    assert data["detected_cycles"] == []
    assert data["metrics"]["edge_count"] == 0
    assert data["metrics"]["node_count"] == 1
    assert data["metrics"]["has_cycles"] is False


def test_account_with_no_matching_transactions_handled_safely(client):
    txns = {
        "TXN-OTHER": create_txn("TXN-OTHER", "ACC-X", "ACC-Y", 100.0, BASE_TIME),
    }
    repo.reset_transactions(txns)

    response = client.get("/api/accounts/ACC-ISOLATED/network")
    assert response.status_code == 200
    data = response.json()

    assert data["account_id"] == "ACC-ISOLATED"
    assert len(data["nodes"]) == 1
    assert data["nodes"][0]["id"] == "ACC-ISOLATED"
    assert data["edges"] == []
    assert data["total_volume"] == 0.0
    assert data["detected_cycles"] == []


# ---------------------------------------------------------------------------
# Acceptance Test 5: Replay steps ordered deterministically, including equal timestamps
# ---------------------------------------------------------------------------
def test_replay_steps_ordered_deterministically_with_equal_timestamps(client):
    equal_ts = BASE_TIME
    txns = {
        "TXN-C": create_txn("TXN-C", "ACC-ROOT", "ACC-NODE-C", 300.0, equal_ts),
        "TXN-A": create_txn("TXN-A", "ACC-ROOT", "ACC-NODE-A", 100.0, equal_ts),
        "TXN-B": create_txn("TXN-B", "ACC-ROOT", "ACC-NODE-B", 200.0, equal_ts),
    }
    repo.reset_transactions(txns)

    response = client.get("/api/accounts/ACC-ROOT/network")
    assert response.status_code == 200
    data = response.json()

    assert len(data["edges"]) == 3
    # Sorted by (timestamp, transaction_id): equal timestamps tie-break on ID
    assert [e["id"] for e in data["edges"]] == ["TXN-A", "TXN-B", "TXN-C"]
    assert [e["step_index"] for e in data["edges"]] == [1, 2, 3]


# ---------------------------------------------------------------------------
# Acceptance Test 6: Replay step excludes future transactions (zero-lookahead)
# ---------------------------------------------------------------------------
def test_replay_step_excludes_future_transactions(client):
    txns = {
        "TXN-01": create_txn("TXN-01", "ACC-ROOT", "ACC-N1", 1000.0, BASE_TIME),
        "TXN-02": create_txn(
            "TXN-02", "ACC-ROOT", "ACC-N2", 2000.0, BASE_TIME + timedelta(minutes=10)
        ),
        "TXN-03": create_txn(
            "TXN-03", "ACC-ROOT", "ACC-N3", 3000.0, BASE_TIME + timedelta(minutes=20)
        ),
    }
    repo.reset_transactions(txns)

    # Step 2: as of step 2, TXN-03 is in the future
    response_step_2 = client.get("/api/accounts/ACC-ROOT/network?as_of_step=2")
    assert response_step_2.status_code == 200
    data_2 = response_step_2.json()

    assert len(data_2["edges"]) == 2
    assert [e["id"] for e in data_2["edges"]] == ["TXN-01", "TXN-02"]
    assert data_2["total_volume"] == 3000.0
    assert data_2["metrics"]["current_replay_step"] == 2

    # Active nodes must NOT leak future destination ACC-N3
    node_ids_2 = {n["id"] for n in data_2["nodes"]}
    assert node_ids_2 == {"ACC-ROOT", "ACC-N1", "ACC-N2"}
    assert "ACC-N3" not in node_ids_2

    # Full graph includes all 3
    response_full = client.get("/api/accounts/ACC-ROOT/network")
    data_full = response_full.json()
    assert len(data_full["edges"]) == 3
    assert {n["id"] for n in data_full["nodes"]} == {"ACC-ROOT", "ACC-N1", "ACC-N2", "ACC-N3"}


# ---------------------------------------------------------------------------
# Acceptance Test 7: Cycle detection uses only edges available at that step
# ---------------------------------------------------------------------------
def test_cycle_detection_uses_only_edges_at_current_replay_step(client):
    """
    Constructs a 3-step circular routing loop:
    Step 1 (T0): ACC-A -> ACC-B
    Step 2 (T1): ACC-B -> ACC-C
    Step 3 (T2): ACC-C -> ACC-A (completes loop)

    Proves:
    - At step 1 and step 2, no cycle is detected (zero-lookahead temporal safety).
    - At step 3, cycle is detected.
    - Entities in the cycle are NOT labeled fraudulent solely because of cycle presence.
    """
    t0 = BASE_TIME
    t1 = BASE_TIME + timedelta(minutes=2)
    t2 = BASE_TIME + timedelta(minutes=4)

    txns = {
        "TXN-HOP-1": create_txn("TXN-HOP-1", "ACC-CYC-A", "ACC-CYC-B", 10000.0, t0),
        "TXN-HOP-2": create_txn("TXN-HOP-2", "ACC-CYC-B", "ACC-CYC-C", 9900.0, t1),
        "TXN-HOP-3": create_txn("TXN-HOP-3", "ACC-CYC-C", "ACC-CYC-A", 9800.0, t2),
    }
    repo.reset_transactions(txns)

    # Step 1: linear path ACC-CYC-A -> ACC-CYC-B
    resp_step_1 = client.get("/api/accounts/ACC-CYC-A/network?as_of_step=1")
    assert resp_step_1.status_code == 200
    data_1 = resp_step_1.json()
    assert data_1["detected_cycles"] == []
    assert data_1["metrics"]["has_cycles"] is False

    # Step 2: path ACC-CYC-A -> ACC-CYC-B -> ACC-CYC-C (still open, no cycle)
    resp_step_2 = client.get("/api/accounts/ACC-CYC-A/network?as_of_step=2")
    assert resp_step_2.status_code == 200
    data_2 = resp_step_2.json()
    assert data_2["detected_cycles"] == []
    assert data_2["metrics"]["has_cycles"] is False

    # Step 3: ACC-CYC-C -> ACC-CYC-A completes the circular cycle
    resp_step_3 = client.get("/api/accounts/ACC-CYC-A/network?as_of_step=3")
    assert resp_step_3.status_code == 200
    data_3 = resp_step_3.json()
    assert len(data_3["detected_cycles"]) == 1
    assert set(data_3["detected_cycles"][0]) == {"ACC-CYC-A", "ACC-CYC-B", "ACC-CYC-C"}
    assert data_3["metrics"]["has_cycles"] is True

    # Critical requirement: do not label an account or transfer fraudulent solely because it appears in a cycle
    for node in data_3["nodes"]:
        assert node["type"] == "account"
        assert node["riskScore"] == 0.0
    for edge in data_3["edges"]:
        assert edge["suspicious"] is False


# ---------------------------------------------------------------------------
# Acceptance Test 8: Future-linked disconnected subgraph does not leak into earlier replay
# ---------------------------------------------------------------------------
def test_future_linked_disconnected_subgraph_does_not_leak(client):
    """
    Scenario:
    - At T0: ACC-B -> ACC-C (earlier transaction between B and C).
    - At T0 + 5m: ACC-A -> ACC-B (later transaction connecting A to B).

    Guarantees:
    - At as_of_step=1 for ACC-A, ACC-B -> ACC-C must NOT appear.
    - ACC-C must NOT be in node membership at step 1.
    - ACC-A must NOT be returned as a disconnected node with an unrelated B->C edge.
    """
    t0 = BASE_TIME
    t1 = BASE_TIME + timedelta(minutes=5)

    txns = {
        "TXN-BC-EARLY": create_txn("TXN-BC-EARLY", "ACC-B", "ACC-C", 5000.0, t0),
        "TXN-AB-LATER": create_txn("TXN-AB-LATER", "ACC-A", "ACC-B", 10000.0, t1),
    }
    repo.reset_transactions(txns)

    resp = client.get("/api/accounts/ACC-A/network?as_of_step=1")
    assert resp.status_code == 200
    data = resp.json()

    assert data["account_id"] == "ACC-A"
    assert len(data["edges"]) == 1
    edge = data["edges"][0]
    assert edge["id"] == "TXN-AB-LATER"
    assert edge["source"] == "ACC-A"
    assert edge["target"] == "ACC-B"
    assert edge["step_index"] == 1

    node_ids = {n["id"] for n in data["nodes"]}
    assert node_ids == {"ACC-A", "ACC-B"}
    assert "ACC-C" not in node_ids
    assert data["metrics"]["edge_count"] == 1
    assert data["metrics"]["node_count"] == 2


# ---------------------------------------------------------------------------
# Acceptance Test 9: Future transfer does not introduce newly reachable account into earlier graph
# ---------------------------------------------------------------------------
def test_future_transfer_does_not_introduce_newly_reachable_account_earlier(client):
    """
    Scenario:
    - Step 1 (T0): ACC-ROOT -> ACC-N1
    - Step 2 (T1): ACC-N1 -> ACC-N2
    - Step 3 (T2): ACC-N2 -> ACC-N3

    Proves:
    - At step 1: nodes are only ACC-ROOT and ACC-N1 (ACC-N2 and ACC-N3 not present).
    - At step 2: ACC-N2 enters, but ACC-N3 is still not present.
    """
    t0 = BASE_TIME
    t1 = BASE_TIME + timedelta(minutes=5)
    t2 = BASE_TIME + timedelta(minutes=10)

    txns = {
        "TXN-STEP-1": create_txn("TXN-STEP-1", "ACC-ROOT", "ACC-N1", 1000.0, t0),
        "TXN-STEP-2": create_txn("TXN-STEP-2", "ACC-N1", "ACC-N2", 2000.0, t1),
        "TXN-STEP-3": create_txn("TXN-STEP-3", "ACC-N2", "ACC-N3", 3000.0, t2),
    }
    repo.reset_transactions(txns)

    # Step 1: only ACC-ROOT -> ACC-N1
    resp_1 = client.get("/api/accounts/ACC-ROOT/network?as_of_step=1")
    assert resp_1.status_code == 200
    data_1 = resp_1.json()
    assert [e["id"] for e in data_1["edges"]] == ["TXN-STEP-1"]
    assert {n["id"] for n in data_1["nodes"]} == {"ACC-ROOT", "ACC-N1"}

    # Step 2: ACC-N2 is introduced, but ACC-N3 must not be present
    resp_2 = client.get("/api/accounts/ACC-ROOT/network?as_of_step=2")
    assert resp_2.status_code == 200
    data_2 = resp_2.json()
    assert [e["id"] for e in data_2["edges"]] == ["TXN-STEP-1", "TXN-STEP-2"]
    assert {n["id"] for n in data_2["nodes"]} == {"ACC-ROOT", "ACC-N1", "ACC-N2"}
    assert "ACC-N3" not in {n["id"] for n in data_2["nodes"]}


# ---------------------------------------------------------------------------
# Acceptance Test 10: Future-reachable cycle does not appear in earlier replay graph
# ---------------------------------------------------------------------------
def test_future_reachable_cycle_does_not_appear_in_earlier_replay_graph(client):
    """
    Scenario:
    - At T0 and T1: Pre-existing external cycle between ACC-CYC-B and ACC-CYC-C.
    - At T2: ACC-CYC-A connects to ACC-CYC-B.

    Proves:
    - At step 1 for ACC-CYC-A, the pre-existing external cycle must NOT leak into ACC-CYC-A's graph.
    - ACC-CYC-A has no cycles at step 1.
    """
    t0 = BASE_TIME
    t1 = BASE_TIME + timedelta(minutes=2)
    t2 = BASE_TIME + timedelta(minutes=10)

    txns = {
        "TXN-EXT-1": create_txn("TXN-EXT-1", "ACC-CYC-B", "ACC-CYC-C", 5000.0, t0),
        "TXN-EXT-2": create_txn("TXN-EXT-2", "ACC-CYC-C", "ACC-CYC-B", 4900.0, t1),
        "TXN-CONN": create_txn("TXN-CONN", "ACC-CYC-A", "ACC-CYC-B", 8000.0, t2),
    }
    repo.reset_transactions(txns)

    resp = client.get("/api/accounts/ACC-CYC-A/network?as_of_step=1")
    assert resp.status_code == 200
    data = resp.json()

    assert data["detected_cycles"] == []
    assert data["metrics"]["has_cycles"] is False
    assert len(data["edges"]) == 1
    assert data["edges"][0]["id"] == "TXN-CONN"
    assert {n["id"] for n in data["nodes"]} == {"ACC-CYC-A", "ACC-CYC-B"}


# ---------------------------------------------------------------------------
# Acceptance Test 11: Historical snapshot equivalence
# ---------------------------------------------------------------------------
def test_historical_snapshot_equivalence(client):
    """
    Requirement:
    The replay graph at step N on the full dataset must exactly match the graph
    constructed from only the transactions eligible by step N.
    """
    t0 = BASE_TIME
    t1 = BASE_TIME + timedelta(minutes=5)
    t2 = BASE_TIME + timedelta(minutes=10)
    t3 = BASE_TIME + timedelta(minutes=15)

    txns_full = {
        "T1": create_txn("T1", "ACC-ROOT", "ACC-X", 1000.0, t0),
        "T2": create_txn("T2", "ACC-X", "ACC-Y", 2000.0, t1),
        "T3": create_txn("T3", "ACC-ROOT", "ACC-Z", 3000.0, t2),
        "T4": create_txn("T4", "ACC-Y", "ACC-W", 4000.0, t3),
    }

    # Query 1: Replay at step 2 from the full repository
    repo.reset_transactions(txns_full)
    resp_replay = client.get("/api/accounts/ACC-ROOT/network?as_of_step=2")
    assert resp_replay.status_code == 200
    data_replay = resp_replay.json()

    # Query 2: Full graph from a repository holding only transactions eligible up to step 2 (T1, T2)
    txns_eligible_only = {
        "T1": create_txn("T1", "ACC-ROOT", "ACC-X", 1000.0, t0),
        "T2": create_txn("T2", "ACC-X", "ACC-Y", 2000.0, t1),
    }
    repo.reset_transactions(txns_eligible_only)
    resp_snapshot = client.get("/api/accounts/ACC-ROOT/network")
    assert resp_snapshot.status_code == 200
    data_snapshot = resp_snapshot.json()

    # Prove exact structural equivalence
    assert [e["id"] for e in data_replay["edges"]] == [e["id"] for e in data_snapshot["edges"]]
    assert {n["id"] for n in data_replay["nodes"]} == {n["id"] for n in data_snapshot["nodes"]}
    assert data_replay["total_volume"] == data_snapshot["total_volume"]
    assert data_replay["detected_cycles"] == data_snapshot["detected_cycles"]
    assert data_replay["metrics"]["edge_count"] == data_snapshot["metrics"]["edge_count"]
    assert data_replay["metrics"]["node_count"] == data_snapshot["metrics"]["node_count"]
    assert data_replay["metrics"]["has_cycles"] == data_snapshot["metrics"]["has_cycles"]
    assert data_replay["metrics"]["in_degree"] == data_snapshot["metrics"]["in_degree"]
    assert data_replay["metrics"]["out_degree"] == data_snapshot["metrics"]["out_degree"]


# ---------------------------------------------------------------------------
# Acceptance Test 12: Replay step boundaries and out-of-range handling
# ---------------------------------------------------------------------------
def test_replay_step_boundaries_and_out_of_range(client):
    """
    Tests edge boundaries:
    - as_of_step=1: exact first step.
    - as_of_step=2: exact second step.
    - as_of_step=999: out-of-range returns all available edges gracefully.
    - as_of_step=0 / -1 via HTTP: returns 422 Unprocessable Entity (per API contract ge=1).
    - direct service call with as_of_step=0: returns empty edges and target node without error.
    """
    from app.services.graph_service import graph_service

    txns = {
        "TX-1": create_txn("TX-1", "ACC-A", "ACC-B", 100.0, BASE_TIME),
        "TX-2": create_txn("TX-2", "ACC-B", "ACC-C", 200.0, BASE_TIME + timedelta(minutes=5)),
    }
    repo.reset_transactions(txns)

    # as_of_step=1
    r1 = client.get("/api/accounts/ACC-A/network?as_of_step=1")
    assert r1.status_code == 200
    assert len(r1.json()["edges"]) == 1

    # as_of_step=2
    r2 = client.get("/api/accounts/ACC-A/network?as_of_step=2")
    assert r2.status_code == 200
    assert len(r2.json()["edges"]) == 2

    # as_of_step=999 (out of range)
    r_out = client.get("/api/accounts/ACC-A/network?as_of_step=999")
    assert r_out.status_code == 200
    assert len(r_out.json()["edges"]) == 2
    assert r_out.json()["metrics"]["current_replay_step"] == 999

    # HTTP validation: as_of_step <= 0 returns 422
    assert client.get("/api/accounts/ACC-A/network?as_of_step=0").status_code == 422
    assert client.get("/api/accounts/ACC-A/network?as_of_step=-1").status_code == 422

    # Direct service call with as_of_step=0 handles safely
    direct_0 = graph_service.get_account_network("ACC-A", as_of_step=0)
    assert len(direct_0.edges) == 0
    assert len(direct_0.nodes) == 1
    assert direct_0.nodes[0].id == "ACC-A"

