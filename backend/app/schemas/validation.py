from pydantic import BaseModel
from typing import Optional, Any

class ValidationResultSchema(BaseModel):
    rule_id: str
    rule_name: str
    target_field: str
    severity: str  # INFO, WARNING, ERROR, CRITICAL
    status: str    # PASS, FAIL, FIXED, REVIEW
    message: str
    current_value: Optional[Any] = None
    expected_value: Optional[Any] = None
    auto_fix_available: bool = False
    auto_fix_result: Optional[str] = None
