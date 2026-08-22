import re
from typing import Dict, Any, Tuple, Optional, List

MANUFACTURER_MAPPING = {
    "APPLIANCE DEALERS COOPERATIVE (APPDE)": "Rheem Manufacturing",
    "WHIRLPOOL CORP (2890)": "Whirlpool Corporation",
    "FREUD INC (2435)": "Freud Inc",
    "MALCO PRODUCTS INC (1120)": "Malco Products SBC",
}

BRAND_MAPPING = {
    "FRIGIDAIRE": "FRIGIDAIRE®",
    "WHIRLPOOL": "Whirlpool®",
    "DIABLO": "Diablo®",
    "MALCO": "Malco®",
}

FRACTION_MAP = {
    "1/16": "0.0625",
    "1/8": "0.125",
    "3/16": "0.1875",
    "1/4": "0.25",
    "5/16": "0.3125",
    "3/8": "0.375",
    "7/16": "0.4375",
    "1/2": "0.5",
    "9/16": "0.5625",
    "5/8": "0.625",
    "11/16": "0.6875",
    "3/4": "0.75",
    "13/16": "0.8125",
    "7/8": "0.875",
    "15/16": "0.9375",
}

UOM_NORMALIZATION_MAP = {
    "INCH": "IN",
    "INCHES": "IN",
    "IN.": "IN",
    '"': "IN",
    "FOOT": "FT",
    "FEET": "FT",
    "FT.": "FT",
    "'": "FT",
    "MILLIMETER": "MM",
    "MILLIMETERS": "MM",
    "MM.": "MM",
    "VOLTS": "V",
    "VOLT": "V",
    "VDC": "V",
    "VAC": "V",
    "HERTZ": "HZ",
    "HORSEPOWER": "HP",
    "POUNDS": "LBS",
    "POUND": "LBS",
    "LB": "LBS",
}

class LocalCleanerService:
    def clean_text(self, raw: str) -> str:
        if not raw:
            return ""
        # Remove redundant whitespace & control characters
        cleaned = re.sub(r'\s+', ' ', raw).strip()
        return cleaned

    def resolve_manufacturer(self, raw_mfr: str) -> Tuple[str, str, float]:
        """
        Returns (canonical_mfr, status, confidence)
        """
        cleaned = self.clean_text(raw_mfr)
        if not cleaned or cleaned.upper() in ["UNKNOWN", "N/A", "NONE", "NULL", "--"]:
            return "Generic Manufacturer", "DEFAULT", 0.70

        upper = cleaned.upper()
        if upper in MANUFACTURER_MAPPING:
            return MANUFACTURER_MAPPING[upper], "NORMALIZED", 0.98

        return cleaned, "MATCHED", 0.90

    def resolve_brand(self, raw_brand: str) -> Tuple[str, str, float]:
        """
        Returns (canonical_brand, status, confidence)
        """
        cleaned = self.clean_text(raw_brand)
        if not cleaned or cleaned.upper() in ["-- UNBRANDED --", "-- NO UNILOG BRAND --", "UNKNOWN", "N/A", "NONE", "NULL", "--"]:
            return "-- Unbranded --", "UNBRANDED", 1.00

        upper = cleaned.upper()
        canonical = BRAND_MAPPING.get(upper, cleaned)
        if not canonical.endswith("®") and canonical != "-- Unbranded --":
            canonical += "®"
        return canonical, "NORMALIZED", 0.95

    def normalize_uom(self, uom_raw: str) -> str:
        cleaned = self.clean_text(uom_raw).upper()
        return UOM_NORMALIZATION_MAP.get(cleaned, cleaned)

    def normalize_fractions(self, text: str) -> str:
        res = text
        for frac, dec in FRACTION_MAP.items():
            res = re.sub(r'\b' + re.escape(frac) + r'\b', dec, res)
        return res

local_cleaner = LocalCleanerService()
