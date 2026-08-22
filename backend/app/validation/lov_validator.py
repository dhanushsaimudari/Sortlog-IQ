import os
import csv
from typing import Dict, List, Set, Optional

class LOVValidator:
    def __init__(self):
        self.lov_index: Dict[str, Set[str]] = {}
        self.loaded = False

    def load_lov_data(self, lov_file_path: Optional[str] = None):
        if self.loaded:
            return

        # Default sample LOVs for high efficiency
        self.lov_index = {
            "VOLTAGE RATING": {"120 V", "240 V", "120/240 V", "208 V", "480 V"},
            "AMPERAGE RATING": {"15 A", "20 A", "30 A", "50 A"},
            "SOUND LEVEL": {"44 dBA", "47 dBA", "50 dBA", "52 dBA"},
            "DISC DIAMETER": {"4-1/2 in", "5 in", "7 in", "12 in"},
            "ARBOR SIZE": {"7/8 in", "5/8 in", "1 in"},
            "THICKNESS": {"1/16 in", "1/8 in", "1/64 in", "0.045 in"},
            "MATERIAL": {"Stainless Steel", "Aluminum Oxide", "Zirconia", "Hardened Steel"},
            "MOUNTING TYPE": {"Legs", "Built-In", "Arbor Mount", "Handheld"}
        }

        if lov_file_path and os.path.exists(lov_file_path):
            try:
                with open(lov_file_path, "r", encoding="utf-8-sig") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        attr = row.get("Attribute_Label", "").strip().upper()
                        val = row.get("Allowed_Value", "").strip()
                        if attr and val:
                            if attr not in self.lov_index:
                                self.lov_index[attr] = set()
                            self.lov_index[attr].add(val)
            except Exception as e:
                pass
        self.loaded = True

    def validate_value(self, attribute_label: str, value: str) -> bool:
        self.load_lov_data()
        attr_key = attribute_label.strip().upper()
        if attr_key not in self.lov_index:
            return True  # If attribute has no LOV constraints, allow
        allowed_set = self.lov_index[attr_key]
        return value.strip() in allowed_set or value.strip().upper() in {v.upper() for v in allowed_set}

    def match_canonical_lov(self, attribute_label: str, value: str) -> Optional[str]:
        self.load_lov_data()
        attr_key = attribute_label.strip().upper()
        if attr_key not in self.lov_index:
            return value
        val_upper = value.strip().upper()
        for canonical in self.lov_index[attr_key]:
            if canonical.upper() == val_upper:
                return canonical
        return None

lov_validator = LOVValidator()
