from typing import Dict, Any, Tuple
from app.services.local_cleaner import local_cleaner
from app.ml.taxonomy_classifier import local_ml_classifier
from app.core.logging import logger

class SemanticDecisionService:
    """
    Evaluates product candidate data to decide if external AI (Gemini/watsonx) is required
    or if local deterministic intelligence + local ML can resolve it confidently.
    """
    def evaluate_enrichment_need(
        self,
        mpn: str,
        description: str,
        raw_mfr: str,
        raw_brand: str
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Returns:
            should_call_ai (bool): True if external AI is necessary.
            reason (str): Justification for local vs AI decision.
            local_context (dict): Computed local values (mfr, brand, classification).
        """
        # 1. Local Normalization & Master Match
        canonical_mfr, mfr_status, mfr_conf = local_cleaner.resolve_manufacturer(raw_mfr)
        canonical_brand, brand_status, brand_conf = local_cleaner.resolve_brand(raw_brand)

        # 2. Local ML / Rule Taxonomy Inference
        ml_prediction = local_ml_classifier.predict(description)
        if ml_prediction:
            ml_class, ml_conf = ml_prediction
        else:
            ml_class = None
            ml_conf = 0.0

        local_context = {
            "canonical_mfr": canonical_mfr,
            "mfr_status": mfr_status,
            "mfr_confidence": mfr_conf,
            "canonical_brand": canonical_brand,
            "brand_status": brand_status,
            "brand_confidence": brand_conf,
            "ml_classification": ml_class,
            "ml_confidence": ml_conf
        }

        # 3. Measurable Uncertainty Decision Conditions
        # If manufacturer is known, brand is known, and description has clear local keywords/ML confidence >= 0.85
        desc_upper = description.upper()
        has_known_keywords = any(kw in desc_upper for kw in ["DISHWASHER", "CUT-OFF", "CRIMPER", "SAW BLADE", "GRINDING WHEEL", "COUPLING", "WASHER", "SCREW", "CABLE"])

        if mfr_status in ["NORMALIZED", "MATCHED"] and brand_status in ["NORMALIZED", "MATCHED", "UNBRANDED"] and (ml_conf >= 0.85 or has_known_keywords):
            return False, f"Local deterministic intelligence confident (mfr={mfr_status}, brand={brand_status}, ML_conf={ml_conf:.2f}). External AI bypassed.", local_context

        # Ambiguous description, abbreviation, or missing masters require semantic AI interpretation
        reasons = []
        if mfr_status not in ["NORMALIZED", "MATCHED"]:
            reasons.append("Uncertain manufacturer master match")
        if brand_status not in ["NORMALIZED", "MATCHED", "UNBRANDED"]:
            reasons.append("Uncertain brand master match")
        if ml_conf < 0.85 and not has_known_keywords:
            reasons.append("Ambiguous product taxonomy / abbreviation")

        reason_str = "; ".join(reasons) if reasons else "Semantic attribute interpretation required"
        return True, f"AI required: {reason_str}", local_context

semantic_decision_service = SemanticDecisionService()
