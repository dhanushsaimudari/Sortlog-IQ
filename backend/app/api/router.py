from fastapi import APIRouter
from app.api.routes import health, sessions, import_data, products, reviews, evaluation, analytics, evidence, export

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(sessions.router, tags=["Sessions"])
api_router.include_router(import_data.router, tags=["Ingestion"])
api_router.include_router(products.router, tags=["Products"])
api_router.include_router(reviews.router, tags=["Reviews"])
api_router.include_router(evaluation.router, tags=["Evaluation"])
api_router.include_router(analytics.router, tags=["Analytics"])
api_router.include_router(evidence.router, tags=["Evidence"])
api_router.include_router(export.router, tags=["Export"])
