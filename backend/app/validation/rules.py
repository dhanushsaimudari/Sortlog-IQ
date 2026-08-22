from pydantic import BaseModel
from typing import Callable, Any, Optional

class ValidationRule(BaseModel):
    rule_id: str
    name: str
    target_field: str
    severity: str  # INFO, WARNING, ERROR, CRITICAL
    message_template: str
    auto_fix_available: bool = False

RULES_CATALOG = [
    ValidationRule(
        rule_id="R-MPN-001",
        name="MPN Missing Validation",
        target_field="mfg_part_num",
        severity="CRITICAL",
        message_template="Manufacturer Part Number (MPN) cannot be null or empty.",
        auto_fix_available=False
    ),
    ValidationRule(
        rule_id="R-MFR-001",
        name="Manufacturer Normalization Check",
        target_field="manufacturer",
        severity="WARNING",
        message_template="Manufacturer was normalized from raw input string.",
        auto_fix_available=True
    ),
    ValidationRule(
        rule_id="R-BRD-001",
        name="Brand Trademark Requirement",
        target_field="brand",
        severity="INFO",
        message_template="Brand string formatted with registered trademark ®.",
        auto_fix_available=True
    ),
    ValidationRule(
        rule_id="R-TAX-001",
        name="Taxonomy Classpath Format",
        target_field="classpath",
        severity="ERROR",
        message_template="Classpath must follow 4-tier 'Dept>Class>Fine>Classpath' format.",
        auto_fix_available=False
    ),
    ValidationRule(
        rule_id="R-UOM-002",
        name="Unit of Measure Space Standard",
        target_field="uom",
        severity="WARNING",
        message_template="Unit of Measure requires single space separator between value and symbol.",
        auto_fix_available=True
    ),
    ValidationRule(
        rule_id="R-LOV-001",
        name="LOV Value Compliance",
        target_field="lov_value",
        severity="WARNING",
        message_template="Extracted attribute value matched canonical LOV master table.",
        auto_fix_available=True
    ),
]
