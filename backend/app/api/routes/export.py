from fastapi import APIRouter, Query, Response
from typing import Optional
from app.session.session_manager import session_manager
from app.services.export_service import export_service

router = APIRouter()

@router.post("/export")
def export_delivery_csv(session_id: Optional[str] = Query(None)):
    session = session_manager.get_or_create_session(session_id)
    products, _ = session.list_products(limit=10000)
    csv_content = export_service.export_products_to_csv(products)
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=Unihack_Delivery_Format_252_Columns.csv"
        }
    )
