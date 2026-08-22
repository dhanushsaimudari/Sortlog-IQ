import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.ingestion_service import PLACEHOLDERS
from app.validation.uom_validator import uom_validator
from app.validation.lov_validator import lov_validator
from app.validation.content_validator import content_validator
from app.validation.auto_fix import auto_fix_service
from app.validation.engine import validation_engine
from app.services.quality_service import quality_service
from app.schemas.product import (
    ProductSchema, SourceDataSchema, ProductIdentitySchema, ValueMatchSchema,
    ClassificationDataSchema, ProductContentSchema, ProductAttributeSchema,
    QualityScoreSchema, ComponentScoreSchema
)
from app.schemas.attributes import ExplanationSchema

class TestUnitCoreLogic(unittest.TestCase):

    def test_01_placeholder_cleaning(self):
        self.assertIn("-- UNBRANDED --", PLACEHOLDERS)
        self.assertIn("-- NO UNILOG BRAND --", PLACEHOLDERS)
        self.assertIn("-- NO DIB BRAND --", PLACEHOLDERS)
        
        # Test cleaning logic
        test_val = "-- Unbranded --"
        cleaned = test_val if test_val.upper() not in PLACEHOLDERS else ""
        self.assertEqual(cleaned, "")

    def test_02_uom_spacing_normalization(self):
        valid, norm1 = uom_validator.validate_uom_spacing("120V")
        self.assertFalse(valid)
        self.assertEqual(norm1, "120 V")

        valid2, norm2 = uom_validator.validate_uom_spacing("47dBA")
        self.assertFalse(valid2)
        self.assertEqual(norm2, "47 dBA")

        valid3, norm3 = uom_validator.validate_uom_spacing("24 in")
        self.assertTrue(valid3)
        self.assertEqual(norm3, "24 in")

    def test_03_lov_matching(self):
        self.assertTrue(lov_validator.validate_value("VOLTAGE RATING", "120 V"))
        canonical = lov_validator.match_canonical_lov("VOLTAGE RATING", "120 V")
        self.assertEqual(canonical, "120 V")

    def test_04_content_boundary_validation(self):
        content_dict = {
            "mobile_desc": "1234567890123456789012345678901234567890", # 40 chars (>35)
            "invoice_desc": "lowercase invoice desc",
            "short_desc": "Valid Short Desc",
            "long_desc": "Valid Long Desc",
            "retail_desc": "Valid Retail Desc",
            "marketing_description": "Valid Marketing Desc"
        }
        errors = content_validator.validate_descriptions(content_dict)
        self.assertGreaterEqual(len(errors), 2)
        rule_ids = [e["rule_id"] for e in errors]
        self.assertIn("R-LEN-MOBILE_DESC", rule_ids)
        self.assertIn("R-CASE-INVOICE", rule_ids)

    def test_05_quality_score_calculation(self):
        dummy_quality = QualityScoreSchema(
            overall_score=85.0,
            status="PASS",
            sub_scores=ComponentScoreSchema(
                brand_normalization=90.0,
                classification=90.0,
                attributes=85.0,
                descriptions=85.0,
                digital_assets=90.0,
                evidence=90.0
            ),
            breakdown_notes=[]
        )

        product = ProductSchema(
            id="prod-test-01",
            source_row_id=1,
            source_data=SourceDataSchema(mfg_part_num="TEST-MPN", part_desc="Test", e1_brand="", unilog_brand="TEST", dib_brand="", part_manuf="Test Mfr"),
            identity=ProductIdentitySchema(
                mfg_part_num="TEST-MPN",
                manufacturer=ValueMatchSchema(raw_value="Test Mfr", canonical_value="Test Mfr", confidence=0.9, status="MATCHED"),
                brand=ValueMatchSchema(raw_value="TEST", canonical_value="TEST®", confidence=0.9, status="MATCHED")
            ),
            classification=ClassificationDataSchema(department="Dep", class_name="Cls", fine_class="Fn", classpath="Dep>Cls>Fn>Path", confidence=0.9, reason="Test"),
            content=ProductContentSchema(product_name="Test Product", mobile_desc="Test Mobile", invoice_desc="TEST INVOICE", short_desc="Short", long_desc="Long", retail_desc="Retail", marketing_description="Mktg"),
            attributes=[],
            quality=dummy_quality,
            validations=[],
            created_at="2026-08-17T00:00:00Z",
            updated_at="2026-08-17T00:00:00Z"
        )
        
        validations = validation_engine.validate_product(product)
        quality = quality_service.calculate_quality(product, validations)
        self.assertGreater(quality.overall_score, 80.0)
        self.assertIn(quality.status, ["PASS", "EXCELLENT"])

if __name__ == "__main__":
    unittest.main()
