from fastapi import APIRouter, Query, HTTPException, status
from typing import Optional
from app.session.session_manager import session_manager
from app.services.review_service import review_service

router = APIRouter()

@router.get("/reviews")
def list_reviews(
    status: Optional[str] = Query("PENDING"),
    session_id: Optional[str] = Query(None)
):
    session = session_manager.get_or_create_session(session_id)
    items = session.list_reviews(status=status)
    return [item.model_dump() for item in items]

@router.get("/reviews/{review_id}")
def get_review(review_id: str, session_id: Optional[str] = Query(None)):
    session = session_manager.get_or_create_session(session_id)
    review = session.get_review(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review item not found.")
    return review.model_dump()

@router.post("/reviews/{review_id}/approve")
def approve_review(review_id: str, session_id: Optional[str] = Query(None)):
    session = session_manager.get_or_create_session(session_id)
    res = review_service.approve_review(session, review_id)
    if not res:
        raise HTTPException(status_code=404, detail="Review item not found.")
    return res.model_dump()

@router.post("/reviews/{review_id}/reject")
def reject_review(review_id: str, session_id: Optional[str] = Query(None)):
    session = session_manager.get_or_create_session(session_id)
    res = review_service.reject_review(session, review_id)
    if not res:
        raise HTTPException(status_code=404, detail="Review item not found.")
    return res.model_dump()

@router.post("/reviews/{review_id}/autofix")
def autofix_review(review_id: str, session_id: Optional[str] = Query(None)):
    session = session_manager.get_or_create_session(session_id)
    res = review_service.autofix_review(session, review_id)
    if not res:
        raise HTTPException(status_code=404, detail="Review item not found.")
    return res.model_dump()
