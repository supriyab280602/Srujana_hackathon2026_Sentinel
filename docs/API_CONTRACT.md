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
Returns multi-hop graph topology formatted for React Flow visualization and NetworkX analysis.

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
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "ACC-7749",
      "target": "ACC-4410",
      "amount": 125000.0,
      "timestamp": "14:10:02",
      "suspicious": true,
      "hopIndex": 1
    }
  ]
}
```

---

## 4. Human-in-the-Loop Review

### `POST /api/investigations/{id}/review`
Submits human investigator adjudication for an alert or case docket.

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

---

## 5. Transaction Risk Scoring

### `POST /api/transactions/score`
Calculates real-time risk score and feature attributions for an incoming transaction.

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
  "score_type": "rule_baseline_v0_scaffold",
  "is_alert_triggered": true,
  "suggested_severity": "medium",
  "factors": [
    {
      "name": "High Single-Transaction Volume",
      "weight": 0.40,
      "contribution": 25.0,
      "description": "Transaction volume $25,000.00 exceeds standard baseline"
    }
  ],
  "confidence": 0.75,
  "scored_at": "2026-10-24T14:52:00Z"
}
```
