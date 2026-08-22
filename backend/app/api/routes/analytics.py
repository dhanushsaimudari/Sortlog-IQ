from fastapi import APIRouter, Query
from typing import Optional
from app.session.session_manager import session_manager

router = APIRouter()

@router.get("/analytics/dashboard")
def get_analytics_dashboard(session_id: Optional[str] = Query(None)):
    session = session_manager.get_or_create_session(session_id)
    return session.calculate_analytics()
