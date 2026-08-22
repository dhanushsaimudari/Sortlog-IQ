from fastapi import APIRouter, Query, HTTPException, status
from typing import Optional
from app.session.session_manager import session_manager
from app.services.processing_service import processing_service

router = APIRouter()

@router.get("/products")
def list_products(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    requires_review: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=1000),
    session_id: Optional[str] = Query(None)
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

@router.get("/products/{product_id}")
def get_product(product_id: str, session_id: Optional[str] = Query(None)):
    session = session_manager.get_or_create_session(session_id)
    product = session.get_product(product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product {product_id} not found.")
    return product.model_dump()

@router.post("/products/{product_id}/process")
def process_product(product_id: str, session_id: Optional[str] = Query(None)):
    session = session_manager.get_or_create_session(session_id)
    product = session.get_product(product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product {product_id} not found.")

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

@router.get("/products/{product_id}/quality")
def get_product_quality(product_id: str, session_id: Optional[str] = Query(None)):
    session = session_manager.get_or_create_session(session_id)
    product = session.get_product(product_id)
    if not product or not product.quality:
        raise HTTPException(status_code=404, detail="Product quality score not found.")
    return product.quality.model_dump()

@router.get("/products/{product_id}/validation")
def get_product_validations(product_id: str, session_id: Optional[str] = Query(None)):
    session = session_manager.get_or_create_session(session_id)
    product = session.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    return [v.model_dump() for v in product.validations]

@router.get("/products/{product_id}/audit")
def get_product_audit_trail(product_id: str, session_id: Optional[str] = Query(None)):
    session = session_manager.get_or_create_session(session_id)
    return session.get_audit_events_for_product(product_id)
