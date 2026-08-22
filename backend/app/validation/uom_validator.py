import re
from typing import Tuple, Optional

class UOMValidator:
    def __init__(self):
        # Standard UOM mappings with required space prefix
        self.uom_rules = {
            r"(\d+)\s*(v|volts|volt)$": r"\1 V",
            r"(\d+)\s*(a|amps|ampere|amperage)$": r"\1 A",
            r"(\d+)\s*(dba|db)$": r"\1 dBA",
            r"(\d+)\s*(hz)$": r"\1 Hz",
            r"(\d+)\s*(w|watts)$": r"\1 W",
            r"(\d+)\s*(in|inch|inches|\")$": r"\1 in",
            r"(\d+)\s*(ft|feet|\')$": r"\1 ft",
            r"(\d+)\s*(rpm)$": r"\1 RPM",
            r"(\d+)\s*(psi)$": r"\1 PSI",
            r"(\d+)\s*(lb|lbs|pound|pounds)$": r"\1 lb",
            r"(\d+)\s*(oz|ounce|ounces)$": r"\1 oz",
        }

    def validate_uom_spacing(self, value: str) -> Tuple[bool, str]:
        if not value:
            return True, ""
        val = value.strip()
        for pattern, replacement in self.uom_rules.items():
            if re.search(pattern, val, re.IGNORECASE):
                normalized = re.sub(pattern, replacement, val, flags=re.IGNORECASE)
                is_valid = (val == normalized)
                return is_valid, normalized
        return True, val

uom_validator = UOMValidator()
