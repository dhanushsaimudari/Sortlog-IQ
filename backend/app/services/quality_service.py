from app.schemas.product import ProductSchema, QualityScoreSchema, ComponentScoreSchema
from app.schemas.validation import ValidationResultSchema
from typing import List

class QualityService:
    def calculate_quality(self, product: ProductSchema, validations: List[ValidationResultSchema]) -> QualityScoreSchema:
        # Check critical rule failures
        has_critical = any(v.severity == "CRITICAL" and v.status == "FAIL" for v in validations)
        has_warnings = any(v.severity == "WARNING" and v.status == "FAIL" for v in validations)

        # 1. Brand Normalization Sub-score (20%)
        brand_score = 100.0 if product.identity.brand.canonical_value and product.identity.brand.canonical_value != "-- Unbranded --" else 50.0

        # 2. Classification Sub-score (15%)
        class_score = (product.classification.confidence * 100.0) if product.classification.classpath else 0.0

        # 3. Attributes Sub-score (25%)
        if product.attributes:
            valid_attrs = sum(1 for a in product.attributes if a.status == "VALID" or a.lov_matched)
            attr_score = (valid_attrs / len(product.attributes)) * 100.0
        else:
            attr_score = 80.0

        # 4. Descriptions Sub-score (20%)
        desc_failures = sum(1 for v in validations if v.target_field in ["mobile_desc", "invoice_desc", "short_desc"] and v.status == "FAIL")
        desc_score = max(0.0, 100.0 - (desc_failures * 20.0))

        # 5. Digital Assets Sub-score (10%)
        asset_score = 90.0

        # 6. Evidence Sub-score (10%)
        evidence_score = 95.0 if product.evidence else 70.0

        sub_scores = ComponentScoreSchema(
            brand_normalization=round(brand_score, 1),
            classification=round(class_score, 1),
            attributes=round(attr_score, 1),
            descriptions=round(desc_score, 1),
            digital_assets=round(asset_score, 1),
            evidence=round(evidence_score, 1)
        )

        overall = round(
            (brand_score * 0.20) +
            (class_score * 0.15) +
            (attr_score * 0.25) +
            (desc_score * 0.20) +
            (asset_score * 0.10) +
            (evidence_score * 0.10),
            1
        )

        # Determine status
        if has_critical or overall < 70.0:
            status = "CRITICAL"
            product.requires_review = True
        elif has_warnings or overall < 85.0 or product.identity.brand.canonical_value == "-- Unbranded --":
            status = "NEEDS_REVIEW"
            product.requires_review = True
        elif overall >= 95.0:
            status = "EXCELLENT"
            product.requires_review = False
        else:
            status = "PASS"
            product.requires_review = False

        notes = [
            f"Weighted Overall Quality Score: {overall}/100",
            f"Brand Normalization: {brand_score}%",
            f"Taxonomy Classification: {class_score}%",
            f"Validation Status: {status}"
        ]

        breakdown_dict = {
            "classification": round(class_score, 1),
            "brand": round(brand_score, 1),
            "lov": round(attr_score, 1),
            "uom": 95.0 if not any(v.rule_id == "UOM_001" and v.status == "FAIL" for v in validations) else 60.0,
            "descriptions": round(desc_score, 1)
        }

        return QualityScoreSchema(
            overall_score=overall,
            status=status,
            sub_scores=sub_scores,
            breakdown=breakdown_dict,
            breakdown_notes=notes
        )

quality_service = QualityService()
