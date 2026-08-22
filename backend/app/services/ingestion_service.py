import pandas as pd
import io
import os
import uuid
from typing import Dict, Any, List, Tuple
from app.storage.ibm_object_storage import storage_adapter
from app.core.exceptions import InvalidInputDataError
from app.core.logging import logger

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".pdf", ".png", ".jpg", ".jpeg"}

PLACEHOLDERS = {
    "-- UNBRANDED --", "-- NO UNILOG BRAND --", "-- NO DIB BRAND --",
    "UNKNOWN", "N/A", "NONE", "NULL", "NAN", "--", ""
}

COLUMN_MAPS = {
    "mpn": ["mfg_part_num", "mpn", "part_number", "part_num", "sku", "item_code", "product_code"],
    "desc": ["part_desc", "description", "part_description", "product_description", "title", "name", "product_name"],
    "manuf": ["part_manuf", "manufacturer", "manufacturer_name", "mfr", "part_manufacturer", "vendor"],
    "brand": ["unilog_brand", "e1_brand", "dib_brand", "brand", "brand_name", "trade_name"]
}

class IngestionService:
    def process_import(self, file_name: str, content_bytes: bytes) -> Tuple[str, int, List[Dict[str, Any]]]:
        ext = os.path.splitext(file_name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise InvalidInputDataError(f"Unsupported file type '{ext}'. Please upload CSV, XLSX, PDF or image files.")

        if len(content_bytes) > 50 * 1024 * 1024:
            raise InvalidInputDataError("File size exceeds maximum allowed limit of 50 MB.")

        # 1. Store original file in storage
        safe_name = os.path.basename(file_name)
        import_id = f"import-{uuid.uuid4().hex[:8]}"
        object_key = f"inputs/{import_id}_{safe_name}"
        
        scratch_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "scratch"))
        os.makedirs(scratch_dir, exist_ok=True)
        temp_path = os.path.join(scratch_dir, f"{import_id}_{safe_name}")
        with open(temp_path, "wb") as f:
            f.write(content_bytes)

        storage_adapter.upload_file(temp_path, object_key)
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


        # 2. Parse File Content
        candidates = []
        if ext in [".csv", ".xlsx", ".xls"]:
            df = None
            if ext == ".csv":
                for encoding in ["utf-8", "utf-8-sig", "latin1", "cp1252"]:
                    try:
                        df = pd.read_csv(io.BytesIO(content_bytes), dtype=str, encoding=encoding)
                        break
                    except Exception:
                        continue
                if df is None:
                    raise InvalidInputDataError("Failed to parse CSV file content with standard encodings.")
            else:
                try:
                    df = pd.read_excel(io.BytesIO(content_bytes), dtype=str)
                except Exception as e:
                    raise InvalidInputDataError(f"Failed to parse Excel file content: {e}")

            df = df.fillna("")
            cols_lower = {str(c).strip().lower(): str(c).strip() for c in df.columns}

            # Flexible column resolution
            mpn_col = next((cols_lower[k] for k in COLUMN_MAPS["mpn"] if k in cols_lower), None)
            desc_col = next((cols_lower[k] for k in COLUMN_MAPS["desc"] if k in cols_lower), None)
            manuf_col = next((cols_lower[k] for k in COLUMN_MAPS["manuf"] if k in cols_lower), None)
            brand_col = next((cols_lower[k] for k in COLUMN_MAPS["brand"] if k in cols_lower), None)

            # Fallbacks if strict map fails
            if not mpn_col and len(df.columns) > 0:
                mpn_col = str(df.columns[0])
            if not desc_col and len(df.columns) > 1:
                desc_col = str(df.columns[1])

            for idx, row in df.iterrows():
                mpn = str(row.get(mpn_col, "")).strip() if mpn_col else ""
                desc = str(row.get(desc_col, "")).strip() if desc_col else ""
                part_manuf = str(row.get(manuf_col, "")).strip() if manuf_col else ""
                brand_val = str(row.get(brand_col, "")).strip() if brand_col else ""

                if not mpn and not desc:
                    continue  # skip completely blank rows

                brand_clean = brand_val if brand_val.upper() not in PLACEHOLDERS else ""

                candidates.append({
                    "source_row_id": idx + 1,
                    "mpn": mpn,
                    "description": desc,
                    "e1_brand": brand_clean,
                    "unilog_brand": brand_clean,
                    "dib_brand": brand_clean,
                    "part_manuf": part_manuf,
                    "raw_row": row.to_dict()
                })
        else:
            # Document / Image file (PDF / PNG / JPG)
            doc_name = os.path.splitext(file_name)[0]
            candidates.append({
                "source_row_id": 1,
                "mpn": f"DOC-{doc_name.upper()[:16]}",
                "description": f"Extracted specification document from {file_name}",
                "e1_brand": "",
                "unilog_brand": "",
                "dib_brand": "",
                "part_manuf": "Document Ingestion",
                "raw_row": {"file_name": file_name, "file_type": ext}
            })

        logger.info(f"Ingestion complete for import '{import_id}': {len(candidates)} records created from {file_name}.")
        return import_id, len(candidates), candidates

ingestion_service = IngestionService()
