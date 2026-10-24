# Sentinel System Architecture

## Architectural Principles

Sentinel is engineered around modularity, low latency, and zero-lookahead integrity for financial crime surveillance.

```
+---------------------------------------------------------------------------------+
|                                 USER / INVESTIGATOR                             |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
|                           FRONTEND (React + Vite + TS)                          |
|  - AppShell Layout (Sidebar, Header, Alert Banners)                             |
|  - Dashboard (KPIs, Risk Index Trend Area Chart)                                |
|  - Alerts Queue & Explainable Detail View                                       |
|  - Behavioral Fingerprinting Profile Cards                                      |
|  - Relationship Graph & Integrated Chronological Replay (React Flow)            |
|  - Human-in-the-Loop Legitimacy Review Queue                                    |
|  - Adaptive Risk Sensitivity Calibration                                        |
+---------------------------------------------------------------------------------+
                                      |  HTTP / REST JSON
                                      v
+---------------------------------------------------------------------------------+
|                           BACKEND (Python + FastAPI)                            |
|  - Route Handlers (/api/health, /api/alerts, /api/accounts, /api/transactions)  |
|  - Pydantic V2 Request & Response Schemas                                       |
|  - Service Layer:                                                               |
|      * AlertService                                                             |
|      * GraphService (NetworkX DiGraph & cycle detection)                        |
|      * ScoringService (Bridge to ML Scorer)                                     |
|  - Repository Layer (In-memory mock store / future Supabase boundary)            |
+---------------------------------------------------------------------------------+
                                      |  In-process call
                                      v
+---------------------------------------------------------------------------------+
|                           MACHINE LEARNING SUBSYSTEM                            |
|  - Data Validation & Schema Enforcement (DataLoader)                            |
|  - Zero-Lookahead Feature Engineering (FeatureEngineer)                         |
|  - Baseline Estimators (FraudModelBaseline)                                     |
|  - Public Inference Interface (SentinelScorer)                                  |
|  - Objective Model Evaluation (ModelEvaluator - ROC-AUC, PR-AUC, FPR)           |
+---------------------------------------------------------------------------------+
```

## Key Boundaries

### 1. Frontend-Backend Boundary
- Defined through REST contracts in `docs/API_CONTRACT.md`.
- Frontend presentation components consume `services/api.ts` rather than embedding direct `fetch` logic.
- Offline resilience: `services/api.ts` seamlessly falls back to high-fidelity mocks when the backend is offline.

### 2. Backend-ML Boundary
- Backend calls `SentinelScorer.score_transaction(transaction, historical_context)`.
- The ML subsystem produces explicit score metadata (`score_type`, `factors`, `is_placeholder`).
- No circular dependencies: `ml/` does not depend on FastAPI or Web modules.

### 3. Graph & Replay Integration
- Replay Mode is fully embedded within `TransactionGraphPage`.
- As the user plays or scrubs the replay slider, the canvas edge states and node risk values update step-by-step.
- Replay logic maintains strict temporal causality: no subsequent events or future ground-truth labels can be referenced at step $T$.
