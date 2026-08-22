import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "SORTOLOG IQ"
    APP_ENV: str = "development"
    DEBUG: bool = True
    
    # API Server Config
    HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    PORT: int = 8000
    API_V1_STR: str = "/api/v1"
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # Deployment & URLs
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    # Session Management
    SESSION_TIMEOUT_MINUTES: int = 120
    MAX_AI_REQUESTS_PER_SESSION: int = 500
    MAX_AI_TOKENS_PER_SESSION: int = 200000
    
    # Primary AI Provider: IBM watsonx.ai
    WATSONX_API_KEY: Optional[str] = None
    WATSONX_PROJECT_ID: Optional[str] = None
    WATSONX_URL: str = "https://us-south.ml.cloud.ibm.com"
    WATSONX_MODEL_ID: str = "meta-llama/llama-3-3-70b-instruct"

    # Secondary AI Provider: Gemini (Fallback)
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # IBM Cloud Object Storage
    IBM_COS_ENDPOINT: Optional[str] = None
    IBM_COS_API_KEY: Optional[str] = None
    IBM_COS_INSTANCE_ID: Optional[str] = None
    IBM_COS_BUCKET: str = "sortolog-iq-bucket"
    
    # Data Storage Paths & ML Models
    LOCAL_STORAGE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "storage_data"))
    ML_MODEL_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ml_models"))
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
