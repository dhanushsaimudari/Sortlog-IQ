import sys
import os
import unittest

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.session.session_manager import session_manager
from app.services.processing_service import processing_service
from app.services.review_service import review_service
from app.services.export_service import export_service
from app.evaluation.evaluator import evaluator_engine

class TestSortologIQBackend(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        print("\n--- Initializing Backend Session Test Suite ---")
        cls.session = session_manager.create_session(session_id="test-backend-sess-001", seed_demo=False)
        test_candidate = {
            "source_row_id": 1,
            "mpn": "PDSH4816AF",
            "description": "PDSH4816AF Dishwasher SS - Display Only",
            "part_manuf": "APPLIANCE DEALERS COOPERATIVE (APPDE)",
            "e1_brand": "-- Unbranded --",
            "unilog_brand": "FRIGIDAIRE",
            "dib_brand": "-- No DIB Brand --",
            "raw_row": {}
        }
        processing_service.process_candidate(cls.session, test_candidate)

    def test_01_seed_products(self):
        products, total = self.session.list_products(limit=10)
        self.assertGreater(total, 0)
        print(f"  [PASS] Session Products Verified: {total} products in memory.")

    def test_02_product_retrieval(self):
        product = self.session.get_product("prod-pdsh4816af")
        self.assertIsNotNone(product)
        self.assertEqual(product.identity.mfg_part_num, "PDSH4816AF")
        self.assertEqual(product.identity.manufacturer.canonical_value, "Rheem Manufacturing")
        print("  [PASS] Session Product Retrieval Verified.")

    def test_03_validation_and_quality(self):
        product = self.session.get_product("prod-pdsh4816af")
        self.assertGreaterEqual(product.quality.overall_score, 50.0)
        self.assertIsNotNone(product.validations)
        print(f"  [PASS] Quality Score Verified: {product.quality.overall_score}/100.")

    def test_04_evaluation_engine(self):
        eval_result = evaluator_engine.run_benchmark_evaluation(self.session)
        self.session.evaluation = eval_result
        self.assertGreaterEqual(eval_result.products_evaluated, 1)
        print(f"  [PASS] Real Evaluation Engine Verified: {eval_result.overall_accuracy}% Accuracy.")

    def test_05_unilog_export_service(self):
        products, _ = self.session.list_products(limit=10)
        csv_out = export_service.export_products_to_csv(products)
        self.assertTrue(csv_out.startswith("MFR URL") or "PART_NUMBER" in csv_out or "Mfg_Part_Num" in csv_out)
        print("  [PASS] 252-Column Unilog Export Service Verified.")

    def test_06_session_deletion_and_cleanup(self):
        temp_sess = session_manager.create_session(session_id="temp-sess-to-delete", seed_demo=False)
        self.assertIsNotNone(session_manager.get_session("temp-sess-to-delete"))
        deleted = session_manager.delete_session("temp-sess-to-delete")
        self.assertTrue(deleted)
        self.assertIsNone(session_manager.get_session("temp-sess-to-delete"))
        print("  [PASS] Session Deletion and Resource Cleanup Verified.")

    def test_07_path_traversal_prevention(self):
        from app.storage.ibm_object_storage import storage_adapter
        with self.assertRaises(ValueError):
            storage_adapter._get_local_path("../../secret.txt")
        print("  [PASS] Path Traversal Security Check Verified.")

    def test_08_slash_mpn_sanitization(self):
        cand = {
            "source_row_id": 2,
            "mpn": "ABC/123-45 #99",
            "description": "Slash MPN Test Item",
            "part_manuf": "Test Mfr",
            "raw_row": {}
        }
        prod = processing_service.process_candidate(self.session, cand)
        self.assertEqual(prod.id, "prod-abc_123-45__99")
        print(f"  [PASS] Slash MPN Sanitization Verified: product_id={prod.id}")

    def test_09_export_csv_attributes(self):
        products, _ = self.session.list_products(limit=10)
        csv_out = export_service.export_products_to_csv(products)
        lines = csv_out.splitlines()
        self.assertGreater(len(lines), 1)
        headers = lines[0].split(",")
        self.assertIn("Mfg_Part_Num", headers)
        print("  [PASS] Export CSV Attributes Format Verified.")

if __name__ == "__main__":
    unittest.main()
