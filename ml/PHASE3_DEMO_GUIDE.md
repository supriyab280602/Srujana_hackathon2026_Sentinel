# SENTINEL — Phase 3 Demo Guide: Behavioral ML & Risk Intelligence

This guide provides exact, reproducible instructions for demonstrating the integrated **Behavioral Fingerprinting** and **Adaptive Risk Monitoring** pipeline developed by Member 1 for the SENTINEL platform.

---

## 1. How to Run the Backend & Scorer Locally

### Prerequisites
- Python 3.10+ with project virtual environment active.
- Working directory: repository root `c:\Users\athar\OneDrive\Desktop\Srujana_hackathon2026_Sentinel`.

### Start the FastAPI Backend
From the repository root:
```bash
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```
Alternatively, from the `backend/` directory:
```bash
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Health Check Verification
```bash
curl -X GET http://127.0.0.1:8000/api/health
```
**Expected Response**:
```json
{
  "status": "healthy",
  "service": "sentinel-core",
  "version": "0.1.0"
}
```

---

## 2. Test Execution Commands

### Run Full ML & Behavioral Test Suite (54 Tests)
```bash
python -m pytest ml/tests/ -v
```
**Expected Exit Code**: `0`  
**Expected Result**: `54 passed, 1 warning`

### Run Focused Phase 3 Demo Integration Sequence Test
```bash
python -m pytest ml/tests/test_phase4a_behavioral.py -k "test_phase3_demo_end_to_end_sequence" -v
```
**Expected Exit Code**: `0`  
**Expected Result**: `1 passed`

---

## 3. Step-by-Step Demo Walkthrough

### Scenario Overview
- **Account Under Surveillance**: `ACC-DEMO-001`
- **Merchant Counterparty**: `ACC-MERCHANT-88`
- **Objective**: Observe cold-start handling, profile accumulation across sequential transactions, adaptive sensitivity thresholding, and behavioral anomaly detection when amounts diverge from established norms.

---

### Step 1: Initial Cold-Start Transaction
A new account with zero prior history submits its first transaction.

#### Request: `POST /api/transactions/score`
```bash
curl -X POST http://127.0.0.1:8000/api/transactions/score \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": {
      "id": "TXN-DEMO-001",
      "sender_account_id": "ACC-DEMO-001",
      "receiver_account_id": "ACC-MERCHANT-88",
      "amount": 1000.0,
      "currency": "USD",
      "channel": "wire"
    }
  }'
```

#### Verified Observable Outputs:
- **`is_alert_triggered`**: `false` (at default threshold 50.0).
- **`score_type`**: `"model_score"`.
- **`behavioral_indicators`**: Contains an indicator with `code: "INSUFFICIENT_HISTORY"`, explicitly signaling cold-start status rather than asserting false certainty.

#### Check Profile: `GET /api/accounts/ACC-DEMO-001/profile`
```bash
curl -X GET http://127.0.0.1:8000/api/accounts/ACC-DEMO-001/profile
```
**Verified Response**:
```json
{
  "account_id": "ACC-DEMO-001",
  "status": "cold_start",
  "has_sufficient_history": false,
  "tx_count": 1,
  "total_volume": 1000.0,
  "amount_mean": 1000.0,
  "amount_std": 0.0,
  "confidence_score": 0.2,
  "channel_counts": { "wire": 1 },
  "frequent_counterparties": ["ACC-MERCHANT-88"],
  "inflow_count": 0,
  "inflow_volume": 0.0,
  "last_seen_step": null
}
```

---

### Step 2: Establish Baseline History (Sequential Transactions)
Submit 2 subsequent ordinary transactions to cross the minimum history threshold (`min_history_threshold = 3`).

#### Request: Transaction 2 ($950.00)
```bash
curl -X POST http://127.0.0.1:8000/api/transactions/score \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": {
      "id": "TXN-DEMO-002",
      "sender_account_id": "ACC-DEMO-001",
      "receiver_account_id": "ACC-MERCHANT-88",
      "amount": 950.0,
      "currency": "USD",
      "channel": "wire"
    }
  }'
```

#### Request: Transaction 3 ($1,050.00)
```bash
curl -X POST http://127.0.0.1:8000/api/transactions/score \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": {
      "id": "TXN-DEMO-003",
      "sender_account_id": "ACC-DEMO-001",
      "receiver_account_id": "ACC-MERCHANT-88",
      "amount": 1050.0,
      "currency": "USD",
      "channel": "wire"
    }
  }'
```

#### Check Profile: `GET /api/accounts/ACC-DEMO-001/profile`
```bash
curl -X GET http://127.0.0.1:8000/api/accounts/ACC-DEMO-001/profile
```
**Verified Observable Outputs**:
- **`status`**: Transitions from `"cold_start"` to `"active"`.
- **`has_sufficient_history`**: `true` (3 transactions evaluated).
- **`amount_mean`**: `1000.0` (computed via numerically stable Welford incremental update).
- **`amount_std`**: `50.0` (unbiased sample standard deviation with N-1 denominator).
- **`confidence_score`**: `0.9` (statistical maturity established).

---

### Step 3: Adaptive Alert Sensitivity Thresholding
Demonstrate how the configurable decision threshold allows dynamic sensitivity adjustment without retraining.

#### Case 3A: Conservative Surveillance (`alert_threshold: 80.0`)
```bash
curl -X POST http://127.0.0.1:8000/api/transactions/score \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": {
      "id": "TXN-DEMO-004A",
      "sender_account_id": "ACC-DEMO-001",
      "receiver_account_id": "ACC-MERCHANT-99",
      "amount": 5000.0,
      "currency": "USD",
      "channel": "wire"
    },
    "alert_threshold": 80.0
  }'
```
**Verified Output**:
- **`is_alert_triggered`**: `false` (suppresses operational analyst noise for medium-risk events).

#### Case 3B: Heightened Surveillance Queue (`alert_threshold: 15.0`)
```bash
curl -X POST http://127.0.0.1:8000/api/transactions/score \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": {
      "id": "TXN-DEMO-004B",
      "sender_account_id": "ACC-DEMO-001",
      "receiver_account_id": "ACC-MERCHANT-99",
      "amount": 5000.0,
      "currency": "USD",
      "channel": "wire"
    },
    "alert_threshold": 15.0
  }'
```
**Verified Output**:
- **`is_alert_triggered`**: `true` (borderline transaction is captured when heightened monitoring is active).

---

### Step 4: Extreme Behavioral Anomaly Detection
An account with a verified $1,000 ± $50 baseline executes an anomalous $25,000 transaction over a high-risk crypto rail.

#### Request: `POST /api/transactions/score`
```bash
curl -X POST http://127.0.0.1:8000/api/transactions/score \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": {
      "id": "TXN-DEMO-005",
      "sender_account_id": "ACC-DEMO-001",
      "receiver_account_id": "ACC-UNSEEN-CRYPTO",
      "amount": 25000.0,
      "currency": "USD",
      "channel": "crypto"
    }
  }'
```

#### Verified Observable Outputs:
- **`suggested_severity`**: `"critical"` or `"high"`.
- **`factors`**: Includes explainable factor attribution:
  - `"High Single-Transaction Volume"` (Observed volume $25,000.00 exceeds standard tier baseline).
  - `"Heightened Channel Rail"` (Rail 'CRYPTO' flagged for surveillance).
- **`behavioral_indicators`**:
  - `code: "AMOUNT_ZSCORE_CRITICAL"` (Observed amount deviates 480.0 standard deviations from historical mean $1,000.00).
  - `code: "NEW_COUNTERPARTY"` (First observed transfer to counterparty `ACC-UNSEEN-CRYPTO`).
  - `code: "UNSEEN_CHANNEL"` (First transfer on payment channel `CRYPTO`).

---

### Step 5: Idempotency & Account Isolation Verification
1. **Idempotency**: Submitting `TXN-DEMO-005` a second time produces identical scores but does not increment `tx_count` or double-count volume in `ACC-DEMO-001`'s profile.
2. **Account Isolation**: A completely distinct account `ACC-DEMO-999` queried at `/api/accounts/ACC-DEMO-999/profile` returns `status: "cold_start"` with `tx_count: 0`, completely isolated from `ACC-DEMO-001`.

---

## 4. Known Limitations & Technical Context

1. **PaySim Benchmark Characteristics**:
   - The PaySim dataset (`PS_log.csv`) is synthetic; 99.98% of sender accounts appear only once in the log.
   - Consequently, sender-side behavioral variance in PaySim offline training is near-zero (recipient inflow volume is the primary behavioral differentiator, achieving 2.71% feature importance).
   - In production financial environments with recurring customers, the 9 sender behavioral features (`sender_amount_zscore_prior`, `sender_type_unseen_prior`, etc.) will provide substantial additional discrimination.
2. **Full-Population vs. Strided Metrics**:
   - On the canonical `stride=10` matched split (55,411 validation rows, 77 fraud), the corrected candidate model improves PR-AUC from **0.1917 to 0.2118** (+10.5% relative gain) and precision to **76.00%**.
   - On the full unstrided population (`stride=1`, 554,082 validation rows, 774 fraud), a baseline RF trained on the full 63.5k samples achieves PR-AUC **0.2515** vs. **0.2469** for candidate.
3. **Frontend Integration Scope**:
   - Backend APIs (`/api/transactions/score`, `/api/accounts/{account_id}/profile`) and ML scoring services are 100% verified locally via FastAPI integration tests (`TestClient`).
   - Complete multi-user UI visualization (transaction graph canvas, React Flow replay timeline, alert tables) is maintained by team members owning frontend and graph visualization.
