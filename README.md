# SENTINEL — AI-Powered Financial Fraud Detection Platform

> **Phase 1: Project Foundation Scaffold**  
> Built for a 48-hour hackathon. Sentinel is an AI/ML-powered financial fraud detection and investigation platform that identifies suspicious transactions using behavioral fingerprinting, explainable risk scoring, multi-hop relationship graph intelligence, and integrated chronological replay.

---

## 1. Quick Start

### Prerequisites
- Node.js 18+ (tested with v26.1.0)
- Python 3.10+ (tested with v3.11.9)

### Frontend Setup & Run
```bash
cd frontend
npm install
npm run dev
# Running at http://localhost:3000
```
To verify production build:
```bash
npm run build
```

### Backend Setup & Run
```bash
cd backend
# Optional: create and activate virtual environment
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
# API docs available at http://localhost:8000/docs
# Health check at http://localhost:8000/api/health
```

### Run Unit Tests
```bash
# Run both ML and Backend tests
python -m pytest ml/tests backend/tests
```

---

## 2. Six Core Product Features

1. **Behavioral Fingerprinting**: Historical transaction rhythms, circadian active hours, counterparty baselines, and anomaly flags (`/app/behavioral`).
2. **Explainable Risk Scoring and Alert Explanation**: Transparent factor attribution and contribution weights rather than opaque black-box verdicts (`/app/alerts/:id`).
3. **Transaction Relationship Graph & Integrated Replay Mode**: Multi-hop fund routing network visualization with in-page chronological replay engine (`/app/network`).
4. **Human-in-the-Loop Legitimacy Review**: High-throughput AML investigator docket and triage workflow (`/app/investigations`).
5. **Adaptive Risk Monitoring**: Dynamic sensitivity thresholding and concept drift tracking (`/app/monitoring`).
6. **Cross-Account Fraud Pattern Detection**: Detecting fan-out bursts, circular layering loops, and mule funnels.

---

## 3. Repository Structure

```text
sentinel/
├── frontend/                     # React + Vite + TypeScript + Tailwind
│   ├── public/
│   ├── src/
│   │   ├── app/                  # App shell & React Router routes
│   │   ├── components/           # Reusable layout, ui, and chart components
│   │   ├── features/             # Feature-based view modules
│   │   │   ├── dashboard/
│   │   │   ├── alerts/
│   │   │   ├── behavioral/
│   │   │   ├── transaction-graph/ # Graph explorer + Replay Mode
│   │   │   │   ├── components/
│   │   │   │   ├── replay/
│   │   │   │   └── types.ts
│   │   │   ├── investigations/
│   │   │   └── monitoring/
│   │   ├── services/             # API client with offline mock fallbacks
│   │   ├── mocks/                # High-fidelity mock fixtures
│   │   ├── types/                # Domain TypeScript models
│   │   ├── styles/               # Tailwind & custom stylesheets
│   │   └── main.tsx
│   ├── .env.example
│   └── package.json
├── backend/                      # Python + FastAPI + NetworkX
│   ├── app/
│   │   ├── api/routes/           # Modular route handlers (/health, /alerts, etc.)
│   │   ├── schemas/              # Pydantic v2 domain schemas
│   │   ├── services/             # Business services & graph analysis
│   │   ├── repositories/         # Local persistence & future Supabase boundary
│   │   ├── core/                 # Config & settings
│   │   └── main.py
│   ├── tests/                    # Pytest test suite
│   ├── .env.example
│   └── requirements.txt
├── ml/                           # Python, scikit-learn, pandas, numpy
│   ├── data/                     # Data validation & loaders (raw/ gitignored)
│   ├── features/                 # Zero-lookahead feature extraction
│   ├── models/                   # Model wrappers & baseline estimators
│   ├── scoring/                  # Documented public SentinelScorer interface
│   ├── evaluation/               # ROC-AUC, PR-AUC, confusion matrix evaluation
│   ├── tests/                    # Pipeline verification tests
│   └── README.md
├── docs/                         # Team specifications and guides
│   ├── PROJECT_BRIEF.md
│   ├── ARCHITECTURE.md
│   ├── API_CONTRACT.md
│   ├── DATA_SCHEMA.md
│   ├── TEAM_WORKFLOW.md
│   └── IMPLEMENTATION_ROADMAP.md
├── .gitignore
└── README.md
```

---

## 4. Frontend Routes

| Path | Description |
| :--- | :--- |
| `/` | Project landing and architecture overview |
| `/login` | Investigator authentication UI scaffold |
| `/signup` | Investigator registration UI scaffold |
| `/app` | Surveillance dashboard with KPIs and risk trend chart |
| `/app/alerts` | Active risk alert triage queue |
| `/app/alerts/:id` | Alert inspection and explainable factor breakdown |
| `/app/behavioral` | Behavioral fingerprinting profile cards |
| `/app/network` | Relationship Graph & integrated Replay Mode |
| `/app/investigations`| Human-in-the-loop review workflow and dockets |
| `/app/monitoring` | Adaptive risk monitoring & threshold calibration |

---

## 5. Team Division

- **Member 1 — AJ: ML & Risk Intelligence**: Dataset preparation, feature engineering, baseline ML model, risk scoring, evaluation.
- **Member 2 — Backend & Investigation Intelligence**: FastAPI endpoints, persistence boundary, NetworkX graph analysis, review workflows.
- **Member 3 — Frontend & Investigator Experience**: Application shell, dashboard, graph visualizer, replay mode, investigation console.

---

## 6. Safety & Secrets
- Never commit secrets or credentials. Local execution operates entirely without external credentials.
- All large raw datasets in `ml/data/raw/` are excluded from Git via `.gitignore`.
