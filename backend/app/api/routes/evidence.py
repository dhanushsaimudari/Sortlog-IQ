from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.session.session_manager import session_manager
from app.evidence.evidence_resolver import evidence_resolver

router = APIRouter()

@router.get("/products/{product_id}/evidence")
def get_product_evidence(product_id: str, session_id: Optional[str] = Query(None)):
    session = session_manager.get_or_create_session(session_id)
    product = session.get_product(product_id)
    mpn = product.identity.mfg_part_num if product else product_id
    evidence_list = evidence_resolver.resolve_product_evidence(mpn)
    return [e.model_dump() for e in evidence_list]
