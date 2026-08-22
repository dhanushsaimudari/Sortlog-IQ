from fastapi import APIRouter, UploadFile, File, Query, HTTPException, status, Response, BackgroundTasks
from typing import Optional
from app.session.session_manager import session_manager
from app.services.ingestion_service import ingestion_service
from app.services.processing_service import processing_service
from app.services.review_service import review_service
from app.services.export_service import export_service
from app.evaluation.evaluator import evaluator_engine
from app.evidence.evidence_resolver import evidence_resolver
from app.services.import_job_service import import_job_service

router = APIRouter()

# --- SESSION LIFECYCLE ---

@router.post("/sessions")
def create_session(seed_demo: bool = Query(False)):
    session = session_manager.create_session(seed_demo=seed_demo)
    return {
        "session_id": session.session_id,
        "status": session.status,
        "created_at": session.created_at.isoformat(),
        "total_products": len(session.products)
    }

@router.get("/sessions/{session_id}")
def get_session_info(session_id: str):
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found or expired.")
    return {
        "session_id": session.session_id,
        "status": session.status,
        "created_at": session.created_at.isoformat(),
        "last_accessed_at": session.last_accessed_at.isoformat(),
        "total_products": len(session.products),
        "pending_reviews": len(session.list_reviews(status="PENDING"))
    }

@router.delete("/sessions/{session_id}")
def delete_session(session_id: str):
    success = session_manager.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found.")
    return {
        "status": "success",
        "message": f"Session {session_id} and associated temporary files deleted successfully."
    }

@router.post("/sessions/{session_id}/extend")
def extend_session(session_id: str, additional_minutes: int = Query(120)):
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found or expired.")
    session.extend_session(additional_minutes)
    return {
        "status": "success",
        "session_id": session.session_id,
        "message": f"Session {session.session_id} extended by {additional_minutes} minutes.",
        "last_accessed_at": session.last_accessed_at.isoformat()
    }

# --- SESSION INGESTION ---

@router.post("/sessions/{session_id}/import")
async def import_into_session(
    session_id: str,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
):
    session = session_manager.get_session(session_id)
    if not session:
        # Auto-create session if specified ID is new
        session = session_manager.create_session(session_id=session_id, seed_demo=False)

    content_bytes = await file.read()
    job_id = import_job_service.create_job(session, file.filename, content_bytes)
    if background_tasks is not None:
        background_tasks.add_task(import_job_service.run_job, job_id, session, file.filename, content_bytes)
    else:
        import_job_service.run_job(job_id, session, file.filename, content_bytes)
    return {
        "status": "QUEUED",
        "session_id": session.session_id,
        "job_id": job_id,
        "filename": file.filename,
        "message": "Catalogue accepted for background processing."
    }


@router.get("/sessions/{session_id}/imports/{job_id}")
def get_import_status(session_id: str, job_id: str):
    job = import_job_service.get_job(job_id)
    if not job or job["session_id"] != session_id:
        raise HTTPException(status_code=404, detail="Import job not found.")
    return job

# --- SESSION PRODUCTS ---

@router.get("/sessions/{session_id}/products")
def list_session_products(
    session_id: str,
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    requires_review: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=1000)
):
    session = session_manager.get_or_create_session(session_id)
    skip = (page - 1) * limit
    items, total = session.list_products(search=search, status=status, requires_review=requires_review, skip=skip, limit=limit)
    return {
        "items": [p.model_dump() for p in items],
        "total": total,
        "page": page,
        "limit": limit,
        "session_id": session.session_id
    }

@router.get("/sessions/{session_id}/products/{product_id}")
def get_session_product(session_id: str, product_id: str):
    session = session_manager.get_or_create_session(session_id)
    product = session.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found in session.")
    return product.model_dump()

@router.post("/sessions/{session_id}/products/{product_id}/process")
def reprocess_session_product(session_id: str, product_id: str):
    session = session_manager.get_or_create_session(session_id)
    product = session.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found in session.")

    candidate = {
        "source_row_id": product.source_row_id,
        "mpn": product.identity.mfg_part_num,
        "description": product.source_data.part_desc,
        "part_manuf": product.source_data.part_manuf,
        "e1_brand": product.source_data.e1_brand,
        "unilog_brand": product.source_data.unilog_brand,
        "dib_brand": product.source_data.dib_brand,
        "raw_row": product.source_data.raw_columns
    }
    updated = processing_service.process_candidate(session, candidate)
    return updated.model_dump()

@router.get("/sessions/{session_id}/products/{product_id}/evidence")
def get_session_product_evidence(session_id: str, product_id: str):
    session = session_manager.get_or_create_session(session_id)
    product = session.get_product(product_id)
    mpn = product.identity.mfg_part_num if product else product_id
    evidence_list = evidence_resolver.resolve_product_evidence(mpn)
    return [e.model_dump() for e in evidence_list]

# --- SESSION REVIEWS ---

@router.get("/sessions/{session_id}/reviews")
def list_session_reviews(session_id: str, status: Optional[str] = Query("PENDING")):
    session = session_manager.get_or_create_session(session_id)
    reviews = session.list_reviews(status=status)
    return [r.model_dump() for r in reviews]

@router.get("/sessions/{session_id}/reviews/{review_id}")
def get_session_review(session_id: str, review_id: str):
    session = session_manager.get_or_create_session(session_id)
    review = session.get_review(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review item not found in session.")
    return review.model_dump()

@router.post("/sessions/{session_id}/reviews/{review_id}/approve")
def approve_session_review(session_id: str, review_id: str):
    session = session_manager.get_or_create_session(session_id)
    res = review_service.approve_review(session, review_id)
    if not res:
        raise HTTPException(status_code=404, detail="Review item not found in session.")
    return res.model_dump()

@router.post("/sessions/{session_id}/reviews/{review_id}/reject")
def reject_session_review(session_id: str, review_id: str):
    session = session_manager.get_or_create_session(session_id)
    res = review_service.reject_review(session, review_id)
    if not res:
        raise HTTPException(status_code=404, detail="Review item not found in session.")
    return res.model_dump()

@router.post("/sessions/{session_id}/reviews/{review_id}/autofix")
def autofix_session_review(session_id: str, review_id: str):
    session = session_manager.get_or_create_session(session_id)
    res = review_service.autofix_review(session, review_id)
    if not res:
        raise HTTPException(status_code=404, detail="Review item not found in session.")
    return res.model_dump()

# --- SESSION EVALUATION & ANALYTICS ---

@router.post("/sessions/{session_id}/evaluation/run")
def run_session_evaluation(session_id: str):
    session = session_manager.get_or_create_session(session_id)
    res = evaluator_engine.run_benchmark_evaluation(session)
    session.evaluation = res
    return res.model_dump()

@router.get("/sessions/{session_id}/evaluation")
def get_session_evaluation(session_id: str):
    session = session_manager.get_or_create_session(session_id)
    if not session.evaluation:
        return None
    return session.evaluation.model_dump()

@router.get("/sessions/{session_id}/analytics")
def get_session_analytics(session_id: str):
    session = session_manager.get_or_create_session(session_id)
    return session.calculate_analytics()

# --- SESSION EXPORT ---

@router.post("/sessions/{session_id}/export")
def export_session_csv(session_id: str):
    session = session_manager.get_or_create_session(session_id)
    products, _ = session.list_products(limit=10000)
    csv_content = export_service.export_products_to_csv(products)

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=Sortolog_Session_{session.session_id}_Unilog_Delivery.csv"
        }
    )
