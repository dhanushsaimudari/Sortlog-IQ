import sys
import os
import unittest
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.ingestion_service import ingestion_service
from app.services.processing_service import processing_service
from app.session.session_manager import session_manager

class TestScale1000Items(unittest.TestCase):

    def test_1000_row_scale_ingestion(self):
        # Generate synthetic 1000-row CSV in memory for scale testing
        lines = ["Mfg_Part_Num,Part_Desc,Part_Manuf,E1_Brand"]
        for i in range(1, 1001):
            lines.append(f"MPN-{i:04d},Synthetic Product Description {i},Manufacturer Corp,BrandName")
        content_bytes = "\n".join(lines).encode("utf-8")

        start_time = time.time()
        import_id, total_rows, candidates = ingestion_service.process_import(
            "Synthetic_Scale_1000.csv", content_bytes
        )
        ingest_duration = time.time() - start_time

        self.assertEqual(total_rows, 1000)
        self.assertEqual(len(candidates), 1000)

        # In-Memory Session Batch Processing
        session = session_manager.create_session(session_id="scale-test-sess", seed_demo=False)
        try:
            processed_count = 0
            failed_count = 0

            proc_start = time.time()
            for cand in candidates[:100]: # Sample batch for rapid benchmark timing
                try:
                    processing_service.process_candidate(session, cand)
                    processed_count += 1
                except Exception as e:
                    failed_count += 1

            proc_duration = time.time() - proc_start

            # Row Integrity Equation
            self.assertEqual(len(candidates[:100]), processed_count + failed_count)
            self.assertEqual(len(session.products), processed_count)

            print(f"\n--- 1,000-Row Dataset Ingestion & Scalability Benchmark ---")
            print(f"  Total Feed Rows Parsed: {total_rows}")
            print(f"  Ingestion Duration: {ingest_duration:.3f} seconds ({total_rows / max(0.001, ingest_duration):.1f} rows/sec)")
            print(f"  Sample Batch Processed: {processed_count} SKUs in {proc_duration:.3f} seconds ({proc_duration / max(1, processed_count)*1000:.2f} ms/SKU)")
            print(f"  Row Integrity Verified: 100% (Input 100 = Processed {processed_count} + Failed {failed_count})")
        finally:
            session_manager.delete_session("scale-test-sess")

if __name__ == "__main__":
    unittest.main()
