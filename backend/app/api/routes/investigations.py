from fastapi import APIRouter, HTTPException
from app.schemas.investigation import InvestigationReviewRequest, InvestigationReviewResponse
from app.services.alert_service import alert_service

router = APIRouter(prefix="/investigations", tags=["Human-in-the-Loop Investigation"])


INITIAL_CASES = [
    {
        "id": "CASE-2026-081",
        "case_title": "Structured Fanout via Rapid ACH and Crypto Gateway",
        "target_account": "ACC-7749",
        "opened_at": "2026-10-24 14:15 UTC",
        "investigator": "AJ / Tier-2 AML Desk",
        "priority": "critical",
        "status": "in_progress",
        "summary": "Corroborating high velocity layering burst across newly activated mule accounts with immediate exit to offshore crypto destination.",
        "notes_history": [
            {
                "author": "System Sentinel Watchdog",
                "timestamp": "2026-10-24 14:10:05",
                "note": "Triggered rule CROSS_ACCOUNT_FANOUT_BURST. Risk score elevated to 94.",
                "action": "AUTO_ALERT_FILED"
            }
        ],
        "evidence_items": [
            {
                "id": "EV-1",
                "type": "velocity",
                "title": "1,420% Hourly Volume Surge",
                "description": "Account moved $220k in 4 minutes vs 30-day baseline average of $12.5k daily.",
                "confidence": 0.98
            }
        ],
        "related_alerts": ["ALT-8902"]
    },
    {
        "id": "CASE-2026-079",
        "case_title": "Layering Loop Multi-Hop Verification",
        "target_account": "ACC-3120",
        "opened_at": "2026-10-24 11:30 UTC",
        "investigator": "Investigator Unit",
        "priority": "high",
        "status": "completed",
        "summary": "Confirmed legitimate inter-subsidiary liquidity sweep after corporate treasury compliance document validation.",
        "verdict": "FALSE_POSITIVE_RESOLVED",
        "notes_history": [],
        "evidence_items": [],
        "related_alerts": ["ALT-8899"]
    }
]


@router.get("/")
def list_investigations():
    """
    Retrieve docket list of all AML investigations.
    """
    return INITIAL_CASES


@router.get("/{investigation_id}")
def get_investigation(investigation_id: str):
    """
    Retrieve specific investigation dossier, exhibits, and audit trail.
    """
    for c in INITIAL_CASES:
        if c["id"] == investigation_id:
            return c
    raise HTTPException(status_code=404, detail="Investigation docket not found")


@router.post("/{investigation_id}/review", response_model=InvestigationReviewResponse)
def submit_investigation_review(
    investigation_id: str,
    payload: InvestigationReviewRequest,
):
    """
    Submit an investigator adjudication decision and structured feedback for an alert/case.
    Closes the human-in-the-loop validation loop.
    """
    review = alert_service.submit_review(payload)
    return review

