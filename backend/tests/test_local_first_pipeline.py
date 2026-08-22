import sys
import os
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.services.local_cleaner import local_cleaner
from app.ai.semantic_decision_service import semantic_decision_service
from app.ml.taxonomy_classifier import local_ml_classifier
from app.session.session_models import ProcessingSession

class TestLocalFirstPipeline(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    def test_local_cleaner_service(self):
        # 1. Fraction Normalization
        text = "Hex Bolt 1/2 in x 3/4 in"
        normalized = local_cleaner.normalize_fractions(text)
        self.assertIn("0.5", normalized)
        self.assertIn("0.75", normalized)

        # 2. UOM Normalization
        uom = local_cleaner.normalize_uom("INCHES")
        self.assertEqual(uom, "IN")

        # 3. Brand Normalization
        brand, status, conf = local_cleaner.resolve_brand("WHIRLPOOL")
        self.assertEqual(brand, "Whirlpool®")
        self.assertEqual(status, "NORMALIZED")

        # 4. Manufacturer Normalization
        mfr, mfr_status, mfr_conf = local_cleaner.resolve_manufacturer("WHIRLPOOL CORP (2890)")
        self.assertEqual(mfr, "Whirlpool Corporation")
        self.assertEqual(mfr_status, "NORMALIZED")

    def test_semantic_decision_service_gate(self):
        # Exact mfr + brand + Dishwasher keyword -> Should compute locally first
        should_ai, reason, ctx = semantic_decision_service.evaluate_enrichment_need(
            "WDTS7024RZ", "Built-In Dishwasher 24 in Stainless Steel", "WHIRLPOOL CORP (2890)", "WHIRLPOOL"
        )
        self.assertFalse(should_ai)
        self.assertIn("Local deterministic intelligence confident", reason)

        # Ambiguous raw mfr + unknown brand -> Should require AI
        should_ai_2, reason_2, _ = semantic_decision_service.evaluate_enrichment_need(
            "UNK-99", "Ambiguous industrial part xyz", "UNKNOWN VENDOR X", "NO BRAND 99"
        )
        self.assertTrue(should_ai_2)
        self.assertIn("AI required", reason_2)

    def test_local_ml_classifier(self):
        self.assertTrue(local_ml_classifier.is_loaded)
        pred = local_ml_classifier.predict("Built-In Dishwasher 24 in Stainless Steel")
        self.assertIsNotNone(pred)
        class_dict, conf = pred
        self.assertIn("Dishwashers", class_dict["classpath"])
        self.assertGreater(conf, 0.0)

    def test_session_local_intelligence_metrics(self):
        session = ProcessingSession(session_id="test-metrics-sess")
        session.record_local_decision()
        session.record_local_decision()
        session.record_local_decision()
        session.record_local_decision() # 4 local decisions
        session.record_ai_call("Gemini") # 1 AI call

        analytics = session.calculate_analytics()
        self.assertEqual(analytics["local_decisions_count"], 4)
        self.assertEqual(analytics["ai_requests_count"], 1)
        self.assertEqual(analytics["local_intelligence_ratio"], 80.0)
        self.assertEqual(analytics["ai_dependency_rate"], 20.0)

    def test_health_endpoint_extended(self):
        res = self.client.get("/api/v1/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("ai_status", data)
        self.assertIn("providers", data)
        self.assertIn("gemini", data["providers"])
        self.assertIn("watsonx", data["providers"])
        self.assertIn("local_ml", data)
        self.assertEqual(data["local_ml"]["status"], "AVAILABLE")

if __name__ == "__main__":
    unittest.main()
