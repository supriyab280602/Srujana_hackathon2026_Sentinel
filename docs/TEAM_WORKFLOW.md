# Sentinel Team Division & Hackathon Workflow

## Team Roles & Ownership

### Member 1 — AJ: ML & Risk Intelligence
- **Primary Domain**: `ml/` directory.
- **Key Responsibilities**:
  - Dataset preparation and schema validation in `ml/data/loader.py`.
  - Feature engineering (log transforms, velocity windows, graph centrality) in `ml/features/engineer.py`.
  - Baseline model training and hyperparameter tuning in `ml/models/baseline.py`.
  - Risk scoring and explainability in `ml/scoring/interface.py`.
  - Incremental risk reassessment algorithms for Replay Mode.
  - Model evaluation metrics in `ml/evaluation/metrics.py`.

### Member 2 — Backend & Investigation Intelligence
- **Primary Domain**: `backend/` directory.
- **Key Responsibilities**:
  - FastAPI endpoints, route routers, and Pydantic schemas in `backend/app/schemas/`.
  - Persistence boundary and data access repository in `backend/app/repositories/`.
  - NetworkX transaction topology graph analysis, cycle detection, and mule tracing in `backend/app/services/graph_service.py`.
  - Integrating `ml.scoring.interface` into backend transaction endpoints.
  - Test suites and CI checks in `backend/tests/`.

### Member 3 — Frontend & Investigator Experience
- **Primary Domain**: `frontend/` directory.
- **Key Responsibilities**:
  - Application layout, navigation shell, responsive theming in `frontend/src/components/layout/`.
  - Dashboard KPIs and risk trend visualizations in `frontend/src/features/dashboard/`.
  - Alerts queue and explainable detail triage view in `frontend/src/features/alerts/`.
  - Behavioral insights view in `frontend/src/features/behavioral/`.
  - Transaction Relationship Graph and integrated Replay Mode UI in `frontend/src/features/transaction-graph/`.
  - Human review workflow and audit logs in `frontend/src/features/investigations/`.

---

## Independent Development & Coordination

### Decoupled Workflow via Mocks
- Frontend developers can work without backend servers running by utilizing `frontend/src/services/api.ts` automatic fallback mocks or setting `VITE_ENABLE_MOCKS=true`.
- Backend developers can test endpoints and schemas using `pytest backend/tests` without frontend dependencies.
- ML developers can run data pipelines and tests using `pytest ml/tests` without waiting on backend routes.

### API Contract Alignment
- Any changes to request or response schemas must be proposed and agreed upon in `docs/API_CONTRACT.md` before altering code.
- Shared schemas in `frontend/src/types/index.ts` and `backend/app/schemas/` must remain synchronized.

### Testing Commands

```bash
# Frontend validation
cd frontend
npm run build

# Backend and ML validation
python -m pytest ml/tests backend/tests
```
