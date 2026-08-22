import sys
import os
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

class TestFastAPIEndpoints(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health_endpoint(self):
        res = self.client.get("/api/v1/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "ok")
        print("  [PASS] GET /api/v1/health -> 200 OK")

    def test_02_create_and_get_session(self):
        res_create = self.client.post("/api/v1/sessions")
        self.assertEqual(res_create.status_code, 200)
        sess_data = res_create.json()
        self.assertIn("session_id", sess_data)
        
        sess_id = sess_data["session_id"]
        res_get = self.client.get(f"/api/v1/sessions/{sess_id}")
        self.assertEqual(res_get.status_code, 200)
        print(f"  [PASS] POST /api/v1/sessions & GET /api/v1/sessions/{sess_id} -> 200 OK")

    def test_03_import_and_products_list_endpoint(self):
        # Test real CSV file upload
        csv_data = "Mfg_Part_Num,Part_Desc,Part_Manuf,E1_Brand\nPDSH4816AF,Dishwasher SS,Appliance CO,Frigidaire\n"
        res_import = self.client.post(
            "/api/v1/import",
            files={"file": ("test_catalog.csv", csv_data.encode("utf-8"), "text/csv")}
        )
        self.assertEqual(res_import.status_code, 200)
        import_res = res_import.json()
        self.assertEqual(import_res["total_rows"], 1)

        res = self.client.get("/api/v1/products")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("items", data)
        self.assertGreater(data["total"], 0)
        print(f"  [PASS] POST /api/v1/import & GET /api/v1/products -> 200 OK ({data['total']} items)")

    def test_04_analytics_dashboard_endpoint(self):
        res = self.client.get("/api/v1/analytics/dashboard")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("overall_quality_score", data)
        print(f"  [PASS] GET /api/v1/analytics/dashboard -> 200 OK")

    def test_05_evaluation_runs_endpoint(self):
        res = self.client.post("/api/v1/evaluation/run")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("overall_accuracy", data)
        print("  [PASS] POST /api/v1/evaluation/run -> 200 OK")

    def test_06_reviews_list_endpoint(self):
        res = self.client.get("/api/v1/reviews?status=PENDING")
        self.assertEqual(res.status_code, 200)
        print("  [PASS] GET /api/v1/reviews -> 200 OK")

    def test_07_export_csv_endpoint(self):
        res = self.client.post("/api/v1/export")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers["content-type"], "text/csv; charset=utf-8")
        print("  [PASS] POST /api/v1/export -> 200 OK (CSV Download)")

if __name__ == "__main__":
    unittest.main()
