from fastapi import APIRouter, UploadFile, File, Query, HTTPException, status
from typing import Optional
from app.session.session_manager import session_manager
from app.services.ingestion_service import ingestion_service
from app.services.processing_service import processing_service

router = APIRouter()

@router.post("/import")
async def import_catalog_file(
    file: UploadFile = File(...),
    session_id: Optional[str] = Query(None)
):
    session = session_manager.get_or_create_session(session_id)
    content_bytes = await file.read()
    import_id, total_rows, candidates = ingestion_service.process_import(file.filename, content_bytes)

    processed_products = processing_service.process_candidates_batch(session, candidates, max_workers=10)

    return {
        "status": "success",
        "session_id": session.session_id,
        "import_id": import_id,
        "filename": file.filename,
        "total_rows": total_rows,
        "processed_count": len(processed_products),
        "message": f"Successfully imported and enriched {len(processed_products)} SKUs."
    }
