from datetime import datetime, timezone
from threading import Lock
from typing import Any, Dict, Optional
import uuid

from app.core.logging import logger
from app.services.ingestion_service import ingestion_service
from app.services.processing_service import processing_service
from app.session.session_models import ProcessingSession


class ImportJobService:
    def __init__(self) -> None:
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._lock = Lock()

    def create_job(self, session: ProcessingSession, file_name: str, content_bytes: bytes) -> str:
        job_id = f"job-{uuid.uuid4().hex[:10]}"
        with self._lock:
            self._jobs[job_id] = {
                "job_id": job_id,
                "session_id": session.session_id,
                "filename": file_name,
                "status": "QUEUED",
                "stage": "UPLOAD_RECEIVED",
                "progress": 0,
                "total_rows": 0,
                "processed_rows": 0,
                "error_count": 0,
                "error": None,
                "started_at": datetime.now(timezone.utc).isoformat(),
            }
        return job_id

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            job = self._jobs.get(job_id)
            return dict(job) if job else None

    def run_job(self, job_id: str, session: ProcessingSession, file_name: str, content_bytes: bytes) -> None:
        self._update(job_id, status="PROCESSING", stage="PARSING", progress=5)
        try:
            import_id, total_rows, candidates = ingestion_service.process_import(file_name, content_bytes)
            self._update(job_id, stage="ENRICHING", total_rows=total_rows, progress=10, import_id=import_id)

            processed_list = processing_service.process_candidates_batch(
                session=session,
                candidates=candidates,
                max_workers=10,
                progress_callback=lambda stage, value: self._update(
                    job_id, stage=stage, progress=min(99, 10 + int(value * 0.89))
                )
            )
            self._update(job_id, processed_rows=len(processed_list))

            processed_rows = len(processed_list)
            final_status = "COMPLETED" if (processed_rows > 0 or total_rows == 0) else "FAILED"
            self._update(
                job_id,
                status=final_status,
                stage=final_status,
                progress=100,
            )
        except Exception as exc:
            logger.exception("Import job %s failed", job_id)
            self._update(job_id, status="FAILED", stage="FAILED", error=str(exc))


    def _get(self, job_id: str, key: str) -> Any:
        with self._lock:
            return self._jobs[job_id][key]

    def _update(self, job_id: str, **values: Any) -> None:
        with self._lock:
            if job_id in self._jobs:
                self._jobs[job_id].update(values)


import_job_service = ImportJobService()
