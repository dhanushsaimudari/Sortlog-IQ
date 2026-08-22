from app.schemas.product import ProductSchema
from app.validation.uom_validator import uom_validator
from app.validation.lov_validator import lov_validator
from typing import Tuple

class AutoFixService:
    def apply_auto_fixes(self, product: ProductSchema) -> Tuple[ProductSchema, int]:
        fixes_applied = 0

        # 1. Fix Brand Registered Trademark symbol
        if product.identity.brand.canonical_value and not product.identity.brand.canonical_value.endswith("®"):
            product.identity.brand.canonical_value += "®"
            fixes_applied += 1

        # 2. Fix Invoice Description Uppercase Requirement
        if product.content.invoice_desc and product.content.invoice_desc != product.content.invoice_desc.upper():
            product.content.invoice_desc = product.content.invoice_desc.upper()
            fixes_applied += 1

        # 3. Fix Invoice Description Length Limit (30 chars max)
        if len(product.content.invoice_desc) > 30:
            product.content.invoice_desc = product.content.invoice_desc[:30]
            fixes_applied += 1

        # 4. Fix Mobile Description Length Limit (35 chars max)
        if len(product.content.mobile_desc) > 35:
            product.content.mobile_desc = product.content.mobile_desc[:35]
            fixes_applied += 1

        # 5. Fix Attribute UOM Spacing & Values
        for attr in product.attributes:
            if attr.raw_value:
                valid, normalized = uom_validator.validate_uom_spacing(attr.raw_value)
                if not valid and normalized != attr.normalized_value:
                    attr.normalized_value = normalized
                    attr.status = "VALID"
                    fixes_applied += 1

        return product, fixes_applied

auto_fix_service = AutoFixService()
