import os
import shutil
from typing import Dict, Optional, List
from datetime import datetime, timezone
from app.session.session_models import ProcessingSession
from app.core.config import settings
from app.core.logging import logger

class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, ProcessingSession] = {}
        self.default_session_id: Optional[str] = None

    def create_session(self, session_id: Optional[str] = None, seed_demo: bool = False) -> ProcessingSession:
        session = ProcessingSession(session_id=session_id)
        self.sessions[session.session_id] = session
        
        # Set as active default session if none set
        if not self.default_session_id:
            self.default_session_id = session.session_id

        logger.info(f"Created new in-memory ProcessingSession: {session.session_id}")

        if seed_demo:
            self._seed_session(session)

        return session

    def _seed_session(self, session: ProcessingSession):
        pass

    def get_session(self, session_id: str) -> Optional[ProcessingSession]:
        self.cleanup_expired_sessions()
        session = self.sessions.get(session_id)
        if session:
            session.touch()
        return session

    def get_or_create_session(self, session_id: Optional[str] = None) -> ProcessingSession:
        self.cleanup_expired_sessions()

        if session_id and session_id in self.sessions:
            session = self.sessions[session_id]
            session.touch()
            return session

        if not session_id and self.default_session_id and self.default_session_id in self.sessions:
            session = self.sessions[self.default_session_id]
            session.touch()
            return session

        # Create new session if requested or fallback
        return self.create_session(session_id=session_id, seed_demo=False)

    def delete_session(self, session_id: str) -> bool:
        session = self.sessions.pop(session_id, None)
        if not session:
            return False

        # Clean up temporary files associated with this session
        for file_path in session.temporary_files:
            try:
                if os.path.exists(file_path):
                    if os.path.isdir(file_path):
                        shutil.rmtree(file_path, ignore_errors=True)
                    else:
                        os.remove(file_path)
            except Exception as e:
                logger.warning(f"Error cleaning temporary file {file_path} for session {session_id}: {e}")

        # Also clean directory /tmp/sortolog/{session_id} if exists
        tmp_dir = os.path.join(settings.LOCAL_STORAGE_DIR, session_id)
        if os.path.exists(tmp_dir):
            try:
                shutil.rmtree(tmp_dir, ignore_errors=True)
            except Exception as e:
                logger.warning(f"Error removing temp session dir {tmp_dir}: {e}")

        if self.default_session_id == session_id:
            self.default_session_id = next(iter(self.sessions.keys())) if self.sessions else None

        logger.info(f"Deleted ProcessingSession and cleaned resources: {session_id}")
        return True

    def cleanup_expired_sessions(self) -> int:
        timeout = getattr(settings, "SESSION_TIMEOUT_MINUTES", 60)
        expired_ids = [
            sid for sid, sess in self.sessions.items()
            if sess.is_expired(timeout)
        ]
        for sid in expired_ids:
            self.delete_session(sid)
        return len(expired_ids)

session_manager = SessionManager()
