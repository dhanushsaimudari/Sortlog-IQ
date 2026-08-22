from typing import List, Dict, Tuple

CHAR_LIMITS = {
    "mobile_desc": 35,
    "invoice_desc": 30,
    "short_desc": 50,
    "long_desc": 800,
    "retail_desc": 150,
    "marketing_description": 2000
}

class ContentValidator:
    def validate_descriptions(self, content_dict: Dict[str, str]) -> List[Dict[str, str]]:
        results = []
        for field, text in content_dict.items():
            if field in CHAR_LIMITS:
                max_len = CHAR_LIMITS[field]
                actual_len = len(text) if text else 0
                if actual_len > max_len:
                    results.append({
                        "rule_id": f"R-LEN-{field.upper()}",
                        "rule_name": f"{field.replace('_', ' ').title()} Length Bound",
                        "target_field": field,
                        "severity": "WARNING",
                        "status": "FAIL",
                        "message": f"Length of {actual_len} chars exceeds maximum allowed boundary of {max_len} chars.",
                        "current_value": text,
                        "expected_value": text[:max_len],
                        "auto_fix_available": True
                    })
                
                # Check uppercase requirement for invoice_desc
                if field == "invoice_desc" and text and text != text.upper():
                    results.append({
                        "rule_id": "R-CASE-INVOICE",
                        "rule_name": "Invoice Description Uppercase Requirement",
                        "target_field": "invoice_desc",
                        "severity": "WARNING",
                        "status": "FAIL",
                        "message": "Invoice descriptions must be strictly UPPERCASE for ERP compatibility.",
                        "current_value": text,
                        "expected_value": text.upper(),
                        "auto_fix_available": True
                    })
        return results

content_validator = ContentValidator()
