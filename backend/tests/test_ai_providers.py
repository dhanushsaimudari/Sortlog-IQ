import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ai.providers.gemini_provider import GeminiProvider
from app.ai.providers.watsonx_provider import WatsonxProvider
from app.ai.ai_provider_router import AIProviderRouter
from app.ai.schemas import AIProviderStatusEnum

class TestAIProviders(unittest.TestCase):

    def test_gemini_provider_init_and_health(self):
        provider = GeminiProvider()
        self.assertEqual(provider.provider_name, "Gemini")
        health = provider.get_health()
        self.assertIn(health.status, ["AVAILABLE", "QUOTA_EXHAUSTED", "UNAVAILABLE"])
        self.assertEqual(health.provider_name, "Gemini")

    def test_watsonx_provider_init_and_health(self):
        provider = WatsonxProvider()
        self.assertEqual(provider.provider_name, "IBM watsonx.ai")
        health = provider.get_health()
        self.assertIn(health.status, ["AVAILABLE", "UNAVAILABLE"])
        self.assertEqual(health.provider_name, "IBM watsonx.ai")
        self.assertEqual(provider.model_id, "meta-llama/llama-3-3-70b-instruct")

    def test_ai_provider_router_primary_watsonx_and_gemini_fallback(self):
        router = AIProviderRouter()
        status_enum, message = router.get_overall_status()
        self.assertIsInstance(status_enum, AIProviderStatusEnum)

        # 1. Primary Provider is IBM watsonx.ai
        self.assertEqual(router.primary_provider.provider_name, "IBM watsonx.ai")
        # 2. Secondary Provider is Gemini
        self.assertEqual(router.secondary_provider.provider_name, "Gemini")

        # Simulate Watsonx circuit open
        router.primary_provider.circuit_open = True
        router.primary_provider.circuit_reason = "Simulated watsonx offline"

        # Simulate Gemini circuit open
        router.secondary_provider.circuit_open = True
        router.secondary_provider.circuit_reason = "Simulated 429 quota exhaustion"

        # Should fall back cleanly to local deterministic classification without crashing
        res, provider_used = router.classify_product("MPN-123", "Built-In Dishwasher 24 in Stainless Steel", "Whirlpool Corporation", "Whirlpool®")
        self.assertEqual(provider_used, "local_engine")
        self.assertEqual(res.fine_class, "Built-In Dishwashers")
        self.assertGreaterEqual(res.confidence, 0.90)

    def test_ai_provider_router_descriptions_fallback(self):
        router = AIProviderRouter()
        router.primary_provider.circuit_open = True
        router.secondary_provider.circuit_open = True

        desc_res, provider = router.generate_descriptions("WDTS7024RZ", "Whirlpool Corporation", "Whirlpool®", "Dishwashers", "[]")
        self.assertEqual(provider, "local_engine")
        self.assertIn("Whirlpool®", desc_res.product_name)
        self.assertIn("Dishwashers", desc_res.product_name)

if __name__ == "__main__":
    unittest.main()
