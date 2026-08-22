import sys
import os
import uvicorn

curr_dir = os.path.abspath(os.path.dirname(__file__))
backend_dir = os.path.join(curr_dir, "backend") if os.path.exists(os.path.join(curr_dir, "backend")) else curr_dir

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if curr_dir not in sys.path:
    sys.path.insert(0, curr_dir)

from app.main import app
from app.core.config import settings

if __name__ == "__main__":
    port = int(os.environ.get("PORT", getattr(settings, 'BACKEND_PORT', 8000)))
    print(f"Starting SORTOLOG IQ FastAPI Backend Server on http://0.0.0.0:{port} ...")
    uvicorn.run(app, host=settings.HOST, port=port)
