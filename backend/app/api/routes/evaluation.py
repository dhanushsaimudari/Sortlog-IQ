from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.session.session_manager import session_manager
from app.evaluation.evaluator import evaluator_engine

router = APIRouter()

@router.post("/evaluation/run")
def run_evaluation(session_id: Optional[str] = Query(None)):
    session = session_manager.get_or_create_session(session_id)
    res = evaluator_engine.run_benchmark_evaluation(session)
    session.evaluation = res
    return res.model_dump()

@router.get("/evaluation/runs")
def get_latest_evaluation(session_id: Optional[str] = Query(None)):
    session = session_manager.get_or_create_session(session_id)
    if not session.evaluation:
        return None
    return session.evaluation.model_dump()

@router.get("/evaluation/runs/{run_id}")
def get_evaluation_by_id(run_id: str, session_id: Optional[str] = Query(None)):
    session = session_manager.get_or_create_session(session_id)
    if session.evaluation and getattr(session.evaluation, 'run_id', None) == run_id:
        return session.evaluation.model_dump()
    if session.evaluation:
        return session.evaluation.model_dump()
    return None
