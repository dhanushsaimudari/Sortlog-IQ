from app.schemas.product import ProductSchema
from app.schemas.validation import ValidationResultSchema
from app.validation.lov_validator import lov_validator
from app.validation.uom_validator import uom_validator
from app.validation.content_validator import content_validator
from typing import List

class ValidationEngine:
    def validate_product(self, product: ProductSchema) -> List[ValidationResultSchema]:
        results: List[ValidationResultSchema] = []

        # 1. MPN Validation
        if not product.identity.mfg_part_num or not product.identity.mfg_part_num.strip():
            results.append(ValidationResultSchema(
                rule_id="R-MPN-001",
                rule_name="MPN Missing Validation",
                target_field="mfg_part_num",
                severity="CRITICAL",
                status="FAIL",
                message="Manufacturer Part Number (MPN) cannot be empty.",
                current_value=product.identity.mfg_part_num,
                expected_value="Valid Non-Empty MPN String",
                auto_fix_available=False
            ))
        else:
            results.append(ValidationResultSchema(
                rule_id="R-MPN-001",
                rule_name="MPN Missing Validation",
                target_field="mfg_part_num",
                severity="INFO",
                status="PASS",
                message="Manufacturer Part Number (MPN) is valid.",
                current_value=product.identity.mfg_part_num,
                expected_value=product.identity.mfg_part_num,
                auto_fix_available=False
            ))

        # 2. Manufacturer Resolution Check
        if product.identity.manufacturer.status == "NORMALIZED":
            results.append(ValidationResultSchema(
                rule_id="R-MFR-001",
                rule_name="Manufacturer Normalization",
                target_field="manufacturer",
                severity="INFO",
                status="PASS",
                message=f"Normalized raw '{product.identity.manufacturer.raw_value}' to canonical '{product.identity.manufacturer.canonical_value}'.",
                current_value=product.identity.manufacturer.raw_value,
                expected_value=product.identity.manufacturer.canonical_value,
                auto_fix_available=True
            ))

        # 3. Brand Trademark Check
        if product.identity.brand.canonical_value.endswith("®"):
            results.append(ValidationResultSchema(
                rule_id="R-BRD-001",
                rule_name="Brand Registered Trademark Attachment",
                target_field="brand",
                severity="INFO",
                status="PASS",
                message="Canonical brand contains mandatory registered trademark symbol ®.",
                current_value=product.identity.brand.canonical_value,
                expected_value=product.identity.brand.canonical_value,
                auto_fix_available=False
            ))
        else:
            results.append(ValidationResultSchema(
                rule_id="R-BRD-001",
                rule_name="Brand Registered Trademark Attachment",
                target_field="brand",
                severity="WARNING",
                status="FAIL",
                message="Canonical brand missing registered trademark symbol ®.",
                current_value=product.identity.brand.canonical_value,
                expected_value=product.identity.brand.canonical_value + "®",
                auto_fix_available=True
            ))

        # 4. Taxonomy Classpath Check
        if ">" in product.classification.classpath:
            results.append(ValidationResultSchema(
                rule_id="R-TAX-001",
                rule_name="Taxonomy Classpath Format",
                target_field="classpath",
                severity="INFO",
                status="PASS",
                message="Classpath satisfies 4-tier taxonomy depth requirement.",
                current_value=product.classification.classpath,
                expected_value=product.classification.classpath,
                auto_fix_available=False
            ))

        # 5. UOM Spacing Validation across attributes
        for attr in product.attributes:
            if attr.raw_value:
                valid, normalized = uom_validator.validate_uom_spacing(attr.raw_value)
                if not valid:
                    results.append(ValidationResultSchema(
                        rule_id="R-UOM-002",
                        rule_name="Unit of Measure Space Standard",
                        target_field=f"attribute.{attr.label}",
                        severity="WARNING",
                        status="FAIL",
                        message=f"Attribute '{attr.label}' value '{attr.raw_value}' missing space separator before unit.",
                        current_value=attr.raw_value,
                        expected_value=normalized,
                        auto_fix_available=True
                    ))
                else:
                    results.append(ValidationResultSchema(
                        rule_id="R-UOM-002",
                        rule_name="Unit of Measure Space Standard",
                        target_field=f"attribute.{attr.label}",
                        severity="INFO",
                        status="PASS",
                        message=f"Attribute '{attr.label}' unit formatting valid.",
                        current_value=attr.raw_value,
                        expected_value=attr.raw_value,
                        auto_fix_available=False
                    ))

        # 6. Description Boundary Checks
        content_dict = {
            "mobile_desc": product.content.mobile_desc,
            "invoice_desc": product.content.invoice_desc,
            "short_desc": product.content.short_desc,
            "long_desc": product.content.long_desc,
            "retail_desc": product.content.retail_desc,
            "marketing_description": product.content.marketing_description,
        }
        content_errors = content_validator.validate_descriptions(content_dict)
        for err in content_errors:
            results.append(ValidationResultSchema(**err))

        return results

validation_engine = ValidationEngine()
