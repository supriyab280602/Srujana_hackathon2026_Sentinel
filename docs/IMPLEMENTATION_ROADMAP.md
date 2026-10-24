# Sentinel 48-Hour Hackathon Implementation Roadmap

## Phase 1: Foundation Scaffold (Completed)
- [x] Full repository structure: frontend, backend, ML, docs.
- [x] Frontend shell, design system tokens, 10 primary routes, React Flow graph setup.
- [x] Integrated Replay Mode component boundary inside Transaction Relationship Graph.
- [x] FastAPI runnable backend with `/api/health`, `/api/alerts`, `/api/accounts`, `/api/transactions/score`, `/api/investigations`.
- [x] Pydantic v2 schemas and local-first repository persistence stub.
- [x] ML pipeline contracts: DataLoader, FeatureEngineer, FraudModelBaseline, SentinelScorer, ModelEvaluator.
- [x] Unit test suites for backend and ML (11/11 passing).
- [x] Frontend production build verified (`tsc && vite build`).

## Phase 2: Core Feature Implementation (Hours 08 - 24)
- **ML**: Prepare raw AML/fraud dataset (e.g., PaySim or synthetic multi-hop dataset); fit baseline LightGBM/XGBoost; compute SHAP feature weights.
- **Backend**: Implement NetworkX community detection and simple cycle tracing; connect `sentinel_scorer` to live inference endpoint.
- **Frontend**: Connect live graph exploration with dynamic node expansion; link alert inspection directly to graph view.

## Phase 3: Replay Engine & Human-in-the-Loop Feedback (Hours 24 - 36)
- **ML & Backend**: Implement step-by-step sequential event ingestion buffer for replay with strict zero-lookahead score updates.
- **Frontend**: Wire timeline scrubbing in Replay Mode to step through historical hops and highlight newly suspicious nodes dynamically.
- **Backend**: Implement audit trail for investigator decisions (`confirm_fraud`, `false_positive`) and queue labeled items for retrain.

## Phase 4: Polish, Benchmark & Pitch Prep (Hours 36 - 48)
- End-to-end rehearsal using high-impact fraud scenarios:
  1. High-velocity fan-out burst.
  2. Multi-hop circular layering ring.
  3. Slow-drip siphon scheme.
- Latency optimization (p99 < 50ms for transaction scoring).
- Slide deck and live demo recording.
