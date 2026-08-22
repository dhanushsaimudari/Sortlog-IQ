from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class AIProviderStatusEnum(str, Enum):
    AI_AVAILABLE = "AI_AVAILABLE"
    AI_PROCESSING = "AI_PROCESSING"
    AI_QUOTA_EXHAUSTED = "AI_QUOTA_EXHAUSTED"
    AI_RATE_LIMITED = "AI_RATE_LIMITED"
    AI_PROVIDER_UNAVAILABLE = "AI_PROVIDER_UNAVAILABLE"
    AI_CONFIGURATION_ERROR = "AI_CONFIGURATION_ERROR"
    AI_FALLBACK_ACTIVE = "AI_FALLBACK_ACTIVE"
    AI_DISABLED = "AI_DISABLED"

class AIClassificationResult(BaseModel):
    department: str = "General Industrial"
    class_name: str = "Unclassified"
    fine_class: str = "UNKNOWN"
    classpath: str = "General Industrial>Unclassified>UNKNOWN"
    confidence: float = 0.50
    reason: str = "Uncertain classification"

class AIAttributeResult(BaseModel):
    sequence: int = 1
    label: str
    raw_value: str
    normalized_value: str
    uom: str = ""
    confidence: float = 0.90

class AIDescriptionResult(BaseModel):
    product_name: str
    mobile_desc: str
    invoice_desc: str
    short_desc: str
    long_desc: str
    retail_desc: str
    marketing_description: str
    item_features: List[str] = Field(default_factory=list)

class ProviderHealth(BaseModel):
    provider_name: str
    status: str
    circuit_open: bool
    message: str
