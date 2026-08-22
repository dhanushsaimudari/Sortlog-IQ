import sys
import os
import uvicorn

# Ensure backend directory is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.core.config import settings

if __name__ == "__main__":
    port = getattr(settings, 'BACKEND_PORT', settings.PORT)
    print(f"Starting SORTOLOG IQ FastAPI Backend Server on http://localhost:{port} ...")
    uvicorn.run(app, host=settings.HOST, port=port)
