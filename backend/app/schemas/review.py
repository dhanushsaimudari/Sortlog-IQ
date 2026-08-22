from pydantic import BaseModel
from typing import Optional

class ReviewItemSchema(BaseModel):
    review_id: str
    product_id: str
    mfg_part_num: str
    field: str
    field_name: Optional[str] = None
    issue_type: str
    severity: str  # WARNING, ERROR, CRITICAL
    current_value: str
    suggested_value: str
    reason: str
    quality_score: Optional[float] = 85.0
    product_name: Optional[str] = ""
    status: str  # PENDING, APPROVED, REJECTED, AUTO_FIXED
    created_at: str
