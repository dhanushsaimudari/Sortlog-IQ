import re
from typing import Tuple

class FieldComparator:
    def compare_fields(self, field_name: str, expected: str, predicted: str) -> Tuple[str, str, bool]:
        exp_str = str(expected or "").strip()
        pred_str = str(predicted or "").strip()

        if exp_str == pred_str:
            return "EXACT_MATCH", "PASS", False

        exp_upper = exp_str.upper()
        pred_upper = pred_str.upper()

        if exp_upper == pred_upper or exp_str.replace("®", "") == pred_str.replace("®", ""):
            return "NORMALIZED_MATCH", "NORM PASS", True

        if field_name.upper() in ["MANUFACTURER_NAME", "PART_MANUF"]:
            return "MANUFACTURER_ERROR", "REVIEW", False

        if field_name.upper() in ["BRAND_NAME", "E1_BRAND", "UNILOG_BRAND"]:
            return "BRAND_ERROR", "REVIEW", False

        if "DESC" in field_name.upper():
            return "DESCRIPTION_ERROR", "REVIEW", True

        if not pred_str:
            return "MISSING_VALUE", "FAIL", False

        return "FORMATTING_MISMATCH", "AUTO-FIX", True

field_comparator = FieldComparator()
