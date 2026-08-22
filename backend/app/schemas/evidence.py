from pydantic import BaseModel
from typing import Optional, Dict

class BoundingBoxSchema(BaseModel):
    x0: float
    y0: float
    x1: float
    y1: float

class EvidenceSchema(BaseModel):
    evidence_id: str
    attribute_label: str
    document_name: str
    page_number: int
    extracted_text: str
    confidence: float = 0.95
    bounding_box: Optional[BoundingBoxSchema] = None
