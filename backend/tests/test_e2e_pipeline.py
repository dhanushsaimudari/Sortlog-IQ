import sys
import os
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

class TestE2EPipeline(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_e2e_complete_workflow(self):
        print("\n--- Running Full End-to-End Session Pipeline Test ---")

        # 0. CREATE SESSIONS
        res_sess = self.client.post("/api/v1/sessions?seed_demo=false")
        self.assertEqual(res_sess.status_code, 200)
        session_id = res_sess.json()["session_id"]
        print(f"  0. Active Session Created ({session_id}): PASS")

        # 1. IMPORT INTO SESSION
        csv_data = (
            "Mfg_Part_Num,Part_Desc,E1_Brand,Unilog_Brand,DIB_Brand,Part_Manuf\n"
            "PDSH4816AF,PDSH4816AF Dishwasher SS - Display Only,-- Unbranded --,FRIGIDAIRE,-- No DIB Brand --,APPLIANCE DEALERS COOPERATIVE (APPDE)\n"
            "WDTS7024RZ,WDTS7024RZ Built-In Dishwasher 24 in Stainless Steel,-- Unbranded --,WHIRLPOOL,-- No DIB Brand --,WHIRLPOOL CORP (2890)\n"
        )
        files = {"file": ("test_feed.csv", csv_data.encode("utf-8"), "text/csv")}
        res_import = self.client.post(f"/api/v1/sessions/{session_id}/import", files=files)
        self.assertEqual(res_import.status_code, 200)
        import_json = res_import.json()
        self.assertEqual(import_json["status"], "QUEUED")
        job_id = import_json["job_id"]
        res_job = self.client.get(f"/api/v1/sessions/{session_id}/imports/{job_id}")
        self.assertEqual(res_job.status_code, 200)
        job_data = res_job.json()
        self.assertEqual(job_data["total_rows"], 2)
        print("  1. Import & Candidate Ingestion into Session: PASS")

        # 2. RETRIEVE SESSION PRODUCTS
        res_list = self.client.get(f"/api/v1/sessions/{session_id}/products")
        self.assertEqual(res_list.status_code, 200)
        products = res_list.json()["items"]
        self.assertEqual(len(products), 2)
        print(f"  2. Session Products Listing: PASS ({len(products)} items retrieved)")

        # 3. INSPECT SINGLE PRODUCT ENRICHMENT
        prod_id = products[0]["id"]
        res_prod = self.client.get(f"/api/v1/sessions/{session_id}/products/{prod_id}")
        self.assertEqual(res_prod.status_code, 200)
        prod = res_prod.json()
        self.assertIn("identity", prod)
        self.assertIn("content", prod)
        self.assertIn("quality", prod)
        print(f"  3. Product Enrichment Canvas Retrieval ({prod_id}): PASS")

        # 4. REVIEW QUEUE & ACTION
        res_rev = self.client.get(f"/api/v1/sessions/{session_id}/reviews?status=PENDING")
        self.assertEqual(res_rev.status_code, 200)
        reviews = res_rev.json()
        if len(reviews) > 0:
            rev_id = reviews[0]["review_id"]
            res_approve = self.client.post(f"/api/v1/sessions/{session_id}/reviews/{rev_id}/approve")
            self.assertEqual(res_approve.status_code, 200)
            print(f"  4. Session Review Action (Approved {rev_id}): PASS")

        # 5. GROUND TRUTH EVALUATION
        res_eval = self.client.post(f"/api/v1/sessions/{session_id}/evaluation/run")
        self.assertEqual(res_eval.status_code, 200)
        eval_data = res_eval.json()
        self.assertGreaterEqual(eval_data["overall_accuracy"], 50.0)
        print(f"  5. Session Self-Evaluation Execution ({eval_data['overall_accuracy']}% Accuracy): PASS")

        # 6. EXPORT 252-COLUMN UNILOG CSV
        res_export = self.client.post(f"/api/v1/sessions/{session_id}/export")
        self.assertEqual(res_export.status_code, 200)
        self.assertEqual(res_export.headers["content-type"], "text/csv; charset=utf-8")
        self.assertTrue(res_export.text.startswith("MFR URL") or "PART_NUMBER" in res_export.text or "Mfg_Part_Num" in res_export.text)
        print("  6. 252-Column Unilog Session CSV Export: PASS")

        # 7. DELETE SESSION AND VERIFY CLEANUP
        res_del = self.client.delete(f"/api/v1/sessions/{session_id}")
        self.assertEqual(res_del.status_code, 200)
        res_verify = self.client.get(f"/api/v1/sessions/{session_id}")
        self.assertEqual(res_verify.status_code, 404)
        print("  7. Session Deletion & Memory Cleanup: PASS")

if __name__ == "__main__":
    unittest.main()
