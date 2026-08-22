from fastapi import APIRouter
from app.core.config import settings
from app.ai.ai_provider_router import ai_provider_router
from app.ml.taxonomy_classifier import local_ml_classifier

router = APIRouter()

@router.get("/health")
def get_health():
    overall_status_enum, message = ai_provider_router.get_overall_status()
    provider_health = ai_provider_router.get_provider_health()
    return {
        "backend": "ok",
        "status": "ok",
        "service": "sortolog-iq-backend",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "watsonx": provider_health["watsonx"].status.lower(),
        "gemini": provider_health["gemini"].status.lower(),
        "local_intelligence": "available",
        "primary_provider": f"IBM watsonx.ai ({settings.WATSONX_MODEL_ID})",
        "secondary_provider": f"Google Gemini API ({settings.GEMINI_MODEL})",
        "ai_status": overall_status_enum.value,
        "ai_message": message,
        "providers": {k: v.model_dump() for k, v in provider_health.items()},
        "local_ml": {
            "status": "AVAILABLE" if local_ml_classifier.is_loaded else "FALLBACK_HEURISTIC",
            "model_path": local_ml_classifier.model_path
        }
    }

@router.get("/health/ai")
def get_ai_health():
    overall_status_enum, message = ai_provider_router.get_overall_status()
    provider_health = ai_provider_router.get_provider_health()
    return {
        "ai_status": overall_status_enum.value,
        "message": message,
        "primary_provider": f"IBM watsonx.ai ({settings.WATSONX_MODEL_ID})",
        "secondary_provider": f"Google Gemini API ({settings.GEMINI_MODEL})",
        "providers": {k: v.model_dump() for k, v in provider_health.items()}
    }
