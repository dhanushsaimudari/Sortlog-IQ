import csv
import io
import os
from typing import List
from app.schemas.product import ProductSchema
from app.storage.ibm_object_storage import storage_adapter

class ExportService:
    def __init__(self):
        # Load sample delivery columns or default standard headers
        self.headers = self._load_delivery_headers()

    def _load_delivery_headers(self) -> List[str]:
        output_json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "output_columns.json"))
        if os.path.exists(output_json_path):
            try:
                import json
                with open(output_json_path, "r", encoding="utf-8") as f:
                    headers = json.load(f)
                    if isinstance(headers, list) and len(headers) > 0:
                        return headers
            except Exception as e:
                pass
        
        expected_csv_path = "sample_data/Unihack_ Expected Output - Delivery Format.csv"
        if os.path.exists(expected_csv_path):
            try:
                with open(expected_csv_path, "r", encoding="utf-8-sig") as f:
                    reader = csv.reader(f)
                    return next(reader)
            except Exception:
                pass
        
        # Default header generator fallback up to 252 columns
        headers = [
            "Mfg_Part_Num", "Brand_Name", "Manufacturer_Name", "Category_Path",
            "Product_Name", "Mobile_Desc", "Invoice_Desc", "Short_Desc", "Long_Desc1",
            "Retail_Desc", "Marketing_Description", "Item_Features_1", "Item_Features_2"
        ]
        for i in range(1, 100):
            headers.extend([f"ATTR_NAME_{i}", f"ATTR_VAL_{i}", f"ATTR_UOM_{i}"])
        return headers[:252]

    def export_products_to_csv(self, products: List[ProductSchema]) -> str:
        output_buffer = io.StringIO()
        writer = csv.writer(output_buffer)

        # 1. Write Header Row
        writer.writerow(self.headers)

        # 2. Write Product Rows
        for p in products:
            row = []
            for col in self.headers:
                col_upper = col.upper()
                if col_upper == "MFG_PART_NUM":
                    row.append(p.identity.mfg_part_num)
                elif col_upper == "BRAND_NAME":
                    row.append(p.identity.brand.canonical_value)
                elif col_upper == "MANUFACTURER_NAME":
                    row.append(p.identity.manufacturer.canonical_value)
                elif col_upper in ["CATEGORY_PATH", "CLASSPATH"]:
                    row.append(p.classification.classpath)
                elif col_upper == "PRODUCT_NAME":
                    row.append(p.content.product_name)
                elif col_upper == "MOBILE_DESC":
                    row.append(p.content.mobile_desc)
                elif col_upper == "INVOICE_DESC":
                    row.append(p.content.invoice_desc)
                elif col_upper == "SHORT_DESC":
                    row.append(p.content.short_desc)
                elif col_upper in ["LONG_DESC1", "LONG_DESC"]:
                    row.append(p.content.long_desc)
                elif col_upper == "RETAIL_DESC":
                    row.append(p.content.retail_desc)
                elif col_upper == "MARKETING_DESCRIPTION":
                    row.append(p.content.marketing_description)
                elif col_upper.startswith("ATTR_NAME_") or col_upper.startswith("ATTRIBUTE_NAME_"):
                    try:
                        idx = int(col_upper.split("_")[-1]) - 1
                        row.append(p.attributes[idx].label if idx < len(p.attributes) else "")
                    except Exception:
                        row.append("")
                elif col_upper.startswith("ATTR_VAL_") or col_upper.startswith("ATTRIBUTE_VAL_") or col_upper.startswith("ATTRIBUTE_VALUE_"):
                    try:
                        idx = int(col_upper.split("_")[-1]) - 1
                        if idx < len(p.attributes):
                            attr = p.attributes[idx]
                            row.append(attr.normalized_value or attr.raw_value)
                        else:
                            row.append("")
                    except Exception:
                        row.append("")
                elif col_upper.startswith("ATTR_UOM_") or col_upper.startswith("ATTRIBUTE_UOM_"):
                    try:
                        idx = int(col_upper.split("_")[-1]) - 1
                        row.append(p.attributes[idx].uom if idx < len(p.attributes) else "")
                    except Exception:
                        row.append("")
                else:
                    row.append("")
            writer.writerow(row)

        csv_content = output_buffer.getvalue()
        object_key = f"outputs/unilog_export_delivery_{len(products)}_skus.csv"
        storage_adapter.save_csv(csv_content, object_key)
        return csv_content

export_service = ExportService()
