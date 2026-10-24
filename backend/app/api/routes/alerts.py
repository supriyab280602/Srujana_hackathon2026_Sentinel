from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.schemas.alert import AlertRead
from app.services.alert_service import alert_service

router = APIRouter(prefix="/alerts", tags=["Risk Alerts"])


@router.get("", response_model=List[AlertRead])
def list_alerts(
    severity: Optional[str] = Query(None, description="Filter by risk severity tier: low, medium, high, critical")
):
    """
    Retrieve active fraud alerts under surveillance.
    Supports filtering by severity tier.
    """
    return alert_service.list_alerts(severity=severity)


@router.get("/{alert_id}", response_model=AlertRead)
def get_alert(alert_id: str):
    """
    Retrieve a specific alert by ID including explainable risk factor weights.
    """
    alert = alert_service.get_alert(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found")
    return alert
