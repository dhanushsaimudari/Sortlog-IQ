from pydantic import BaseModel, Field
from typing import Optional

class ExplanationSchema(BaseModel):
    raw_source: str
    ai_interpretation: str
    lov_status: str
    uom_status: str
    validation_result: str

class ProductAttributeSchema(BaseModel):
    sequence: int
    label: str
    raw_value: Optional[str] = None
    normalized_value: Optional[str] = None
    uom: Optional[str] = None
    status: str = "VALID"  # VALID, REVIEW, BLOCKED, UNKNOWN
    source: str = "EXTRACTED"  # EXTRACTED, INFERRED, ENRICHED
    lov_matched: bool = False
    evidence_id: Optional[str] = None
    explanation: Optional[ExplanationSchema] = None
