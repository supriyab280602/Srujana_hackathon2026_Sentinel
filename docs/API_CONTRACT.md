# Sentinel API Contract & Endpoint Documentation

Base URL: `/api` (Proxied in development from `http://localhost:3000/api` to `http://localhost:8000/api`)

---

## 1. System Health

### `GET /api/health`
Checks backend and pipeline operational status.

**Response `200 OK`**:
```json
{
  "status": "ok",
  "service": "sentinel-core",
  "version": "0.1.0",
  "timestamp": "2026-10-24T14:50:00Z"
}
```

---

## 2. Risk Alerts

### `GET /api/alerts`
Retrieves surveillance alerts.

**Query Parameters:**
- `severity` (optional, string): Filter by tier (`low`, `medium`, `high`, `critical`).

**Response `200 OK`**:
```json
[
  {
    "id": "ALT-8902",
    "transaction_id": "TXN-99410",
    "account_id": "ACC-7749",
    "severity": "critical",
    "risk_score": 94.0,
    "status": "open",
    "detection_rule": "CROSS_ACCOUNT_FANOUT_BURST",
    "title": "Rapid High-Velocity Outflows to Unverified Accounts",
    "summary": "Account executed consecutive wire transfers exceeding typical volume by 1,420%.",
    "created_at": "2026-10-24T14:32:00Z",
    "factors": [
      {
        "name": "Velocity Delta",
        "weight": 0.45,
        "contribution": 42.3,
        "description": "12 standard deviations above historical hourly norm"
      }
    ]
  }
]
```

### `GET /api/alerts/{id}`
Returns details for a specific alert.

**Response `200 OK`**:
Returns single Alert object.

**Response `404 Not Found`**:
```json
{ "detail": "Alert 'ALT-XYZ' not found" }
```

---

## 3. Account Intelligence & Graph Topology

### `GET /api/accounts/{account_id}/transactions`
Returns list of transactions for an account.

**Response `200 OK`**:
```json
[
  {
    "id": "TXN-99410",
    "sender_account_id": "ACC-7749",
    "receiver_account_id": "ACC-4410",
    "amount": 125000.0,
    "currency": "USD",
    "channel": "wire",
    "timestamp": "2026-10-24T14:10:02Z",
    "location_country": "US"
  }
]
```

### `GET /api/accounts/{account_id}/network`
Returns multi-hop graph topology formatted for React Flow visualization and NetworkX analysis. Replay Mode is embedded directly within this endpoint via chronological step filtering.

**Query Parameters:**
- `max_hops` (optional, integer, default `3`, range `1-5`): Graph traversal depth limit.
- `as_of_step` (optional, integer, minimum `1`): Chronological replay step filter. When supplied, returns only edges with `step_index <= as_of_step` and connected active nodes, guaranteeing zero-lookahead temporal replay on the canvas.

**Response `200 OK`**:
```json
{
  "account_id": "ACC-7749",
  "max_hops": 3,
  "total_volume": 485000.0,
  "nodes": [
    {
      "id": "ACC-7749",
      "label": "ACC-7749 (Target)",
      "type": "account",
      "riskScore": 94.0,
      "balance": 24500.0
    },
    {
      "id": "ACC-4410",
      "label": "ACC-4410 (Mule 1)",
      "type": "flagged_mule",
      "riskScore": 82.0,
      "balance": 1200.0
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "ACC-7749",
      "target": "ACC-1102",
      "amount": 1500.0,
      "timestamp": "14:05:00",
      "suspicious": false,
      "hopIndex": 1,
      "step_index": 1
    },
    {
      "id": "e2",
      "source": "ACC-7749",
      "target": "ACC-4410",
      "amount": 125000.0,
      "timestamp": "14:10:02",
      "suspicious": true,
      "hopIndex": 1,
      "step_index": 2
    }
  ],
  "detected_cycles": [],
  "metrics": {
    "node_count": 5,
    "edge_count": 5,
    "suspicious_edge_count": 4,
    "current_replay_step": null,
    "has_cycles": false
  }
}
```

---

## 4. Human-in-the-Loop Review

### `POST /api/investigations/{id}/review`
Submits human investigator adjudication for an alert or case docket and transitions alert workflow status (`confirm_fraud` -> `escalated`, `false_positive` -> `dismissed`, `needs_escalation` -> `under_review`).

**Request Body**:
```json
{
  "alert_id": "ALT-8902",
  "decision": "confirm_fraud",
  "notes": "Verified fan-out burst matches known mule pattern.",
  "investigator_id": "INV-TEST-01",
  "tags": ["fanout", "confirmed_mule"]
}
```

**Response `200 OK`**:
```json
{
  "review_id": "REV-0001",
  "alert_id": "ALT-8902",
  "decision": "confirm_fraud",
  "status": "recorded",
  "notes": "Verified fan-out burst matches known mule pattern.",
  "investigator_id": "INV-TEST-01",
  "created_at": "2026-10-24T14:55:00Z"
}
```

**Response `404 Not Found`**:
```json
{
  "detail": "Target alert 'ALT-XYZ' for investigation 'INV-1' not found"
}
```

---

## 5. Transaction Risk Scoring

### `POST /api/transactions/score`
Calculates real-time risk score and feature attributions for an incoming transaction, bridging directly to Member 1's ML scoring subsystem (`SentinelScorer`).

**Request Body**:
```json
{
  "transaction": {
    "sender_account_id": "ACC-7749",
    "receiver_account_id": "ACC-4410",
    "amount": 25000.0,
    "currency": "USD",
    "channel": "crypto",
    "location_country": "US"
  },
  "account_history_lookback_days": 30,
  "include_graph_context": true
}
```

**Response `200 OK`**:
```json
{
  "transaction_id": null,
  "risk_score": 65.0,
  "score_type": "baseline_heuristic_scaffold",
  "model_version": "v0.1-scaffold",
  "is_placeholder": true,
  "is_alert_triggered": true,
  "suggested_severity": "medium",
  "factors": [
    {
      "name": "High Single-Transaction Volume",
      "weight": 0.40,
      "contribution": 25.0,
      "description": "Volume of $25,000.00 deviates from standard tier baseline"
    },
    {
      "name": "High-Risk Channel Rail",
      "weight": 0.25,
      "contribution": 15.0,
      "description": "Cross-border cryptocurrency routing observed"
    }
  ],
  "confidence": 0.75,
  "scored_at": "2026-10-24T14:52:00Z"
}
```

---

## 6. Member 1 ML Scoring Subsystem Contract

The FastAPI backend interacts with Member 1's machine learning subsystem in-process through `ml.scoring.interface.SentinelScorer`:

### Python Interface Specification:
```python
from ml.scoring.interface import sentinel_scorer

result = sentinel_scorer.score_transaction(
    transaction_data={
        "amount": 25000.0,
        "channel": "crypto",
        "sender_account_id": "ACC-7749",
        "receiver_account_id": "ACC-4410",
        "timestamp": "2026-10-24T14:10:02Z",
    },
    historical_context={
        "velocity_1h_count": 8.0,
        "velocity_1h_volume": 280000.0,
        "unique_destinations_1h": 6.0,
        "lookback_days": 30,
    }
)
```

### Return Dictionary Specification:
- `risk_score` (`float`): Composite risk score [0.0 - 100.0].
- `score_type` (`str`): Model family / pipeline tag (e.g. `baseline_heuristic_scaffold`, `lightgbm_v1`).
- `model_version` (`str`): Active estimator checkpoint version.
- `is_placeholder` (`bool`): `True` if using default scaffold weights prior to dataset training.
- `confidence` (`float`): Confidence certainty score [0.0 - 1.0].
- `factors` (`List[dict]`): Top risk attribution factors with `name`, `weight`, `contribution`, `description`.
- `scored_at` (`str`): ISO timestamp.

### Backend Resilience:
The backend `ScoringService` enriches `historical_context` by querying the transaction repository for the sender account, invokes `sentinel_scorer`, and provides automated graceful fallback to a deterministic rule baseline (`rule_baseline_v0_fallback`) if the ML module is absent or raises an error.
