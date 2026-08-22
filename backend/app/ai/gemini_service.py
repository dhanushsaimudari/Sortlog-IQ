import time
import json
from typing import Optional, Dict, Any
from app.core.config import settings
from app.core.logging import logger
from app.ai.response_parser import parse_json_response
from app.ai.prompts.classification import CLASSIFICATION_PROMPT_TEMPLATE
from app.ai.prompts.extraction import EXTRACTION_PROMPT_TEMPLATE
from app.ai.prompts.description import DESCRIPTION_PROMPT_TEMPLATE

class GeminiService:
    def __init__(self):
        raw_key = settings.GEMINI_API_KEY
        self.api_key = raw_key.strip() if raw_key else None
        self.client = None
        self.quota_exhausted = False
        
        is_valid_format = bool(self.api_key and not self.api_key.startswith("your_") and len(self.api_key) > 10)
        if is_valid_format:
            try:
                from google import genai
                from google.genai.types import HttpOptions
                self.client = genai.Client(
                    api_key=self.api_key,
                    http_options=HttpOptions(timeout=30000),
                )
                masked_prefix = self.api_key[:5] + "..." if self.api_key else "None"
                logger.info(f"Google Gemini API client initialized. GEMINI_API_KEY loaded: true (model={settings.GEMINI_MODEL}, prefix={masked_prefix})")
            except Exception as e:
                logger.warning(f"Could not initialize Google GenAI SDK: {e}")
        else:
            logger.info("GEMINI_API_KEY loaded: false. Operating in deterministic engine mode.")

    def is_configured(self) -> bool:
        return self.client is not None and not self.quota_exhausted

    def reset_quota_state(self):
        self.quota_exhausted = False

    def _generate_candidate(self, prompt: str, max_retries: int = 2) -> str:
        if not self.client or self.quota_exhausted:
            raise RuntimeError("Gemini API key is not configured or quota is exhausted.")
        
        last_exception = None
        for attempt in range(max_retries + 1):
            try:
                response = self.client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt,
                )
                return response.text
            except Exception as e:
                last_exception = e
                logger.warning(f"Gemini API call attempt {attempt + 1}/{max_retries + 1} failed: {e}")
                err_str = str(e)
                if any(k in err_str for k in ["429", "RESOURCE_EXHAUSTED", "getaddrinfo failed", "Quota exceeded", "ConnectionError"]):
                    logger.warning(f"Gemini API unavailable or quota exhausted ({e}). Activating circuit breaker for local deterministic engine mode.")
                    self.quota_exhausted = True
                    break
                if attempt < max_retries:
                    time.sleep(1.0 * (attempt + 1))
        raise last_exception

    def _heuristic_classify(self, description: str) -> Dict[str, Any]:
        desc_upper = description.upper()
        if "DISHWASHER" in desc_upper:
            return {
                "department": "Appliances & Consumer Electronics",
                "class_name": "Kitchen Appliances",
                "fine_class": "Built-In Dishwashers",
                "classpath": "Appliances & Consumer Electronics>Kitchen Appliances>Built-In Dishwashers",
                "confidence": 0.95,
                "reason": "Deterministic classification heuristic derived from keyword 'DISHWASHER'"
            }
        elif "DISC" in desc_upper or "CUT-OFF" in desc_upper:
            return {
                "department": "Abrasives & Cutting Tools",
                "class_name": "Abrasive Discs",
                "fine_class": "Metal Cut-Off Discs",
                "classpath": "Abrasives & Cutting Tools>Abrasive Discs>Metal Cut-Off Discs",
                "confidence": 0.95,
                "reason": "Deterministic classification heuristic derived from keyword 'CUT-OFF DISC'"
            }
        elif "CRIMPER" in desc_upper or "TOOL" in desc_upper:
            return {
                "department": "Hand & Power Tools",
                "class_name": "Hand Tools",
                "fine_class": "Crimpers & Cutters",
                "classpath": "Hand & Power Tools>Hand Tools>Crimpers & Cutters",
                "confidence": 0.95,
                "reason": "Deterministic classification heuristic derived from keyword 'CRIMPER'"
            }
        else:
            return {
                "department": "General Industrial",
                "class_name": "Hardware & Supplies",
                "fine_class": "General Fasteners",
                "classpath": "General Industrial>Hardware & Supplies>General Fasteners",
                "confidence": 0.80,
                "reason": "General industrial default taxonomy candidate"
            }

    def _deterministic_generate_descriptions(self, mpn: str, manufacturer: str, brand: str, noun: str) -> Dict[str, Any]:
        clean_brand = brand.replace("®", "").strip().upper()
        return {
            "product_name": f"{brand} {noun} {mpn}".strip(),
            "mobile_desc": f"{clean_brand} {noun} {mpn}"[:35],
            "invoice_desc": f"{clean_brand} {noun} {mpn}".upper()[:30],
            "short_desc": f"{brand} {noun} {mpn} Industrial Spec",
            "long_desc": f"{brand} {noun} (MPN: {mpn}) manufactured by {manufacturer}. Engineered for high-performance industrial reliability.",
            "retail_desc": f"Upgrade your operations with the {brand} {noun} ({mpn}).",
            "marketing_description": f"The {brand} {noun} model {mpn} offers superior efficiency, heavy-duty construction, and trusted performance.",
            "item_features": [
                f"Heavy-duty industrial grade {noun}",
                f"Manufactured by {manufacturer}",
                f"Standard commercial voltage & footprint",
                f"Original MPN: {mpn}"
            ]
        }

    def classify_product(self, mpn: str, description: str, manufacturer: str, brand: str) -> Dict[str, Any]:
        prompt = CLASSIFICATION_PROMPT_TEMPLATE.format(
            mpn=mpn,
            description=description,
            manufacturer=manufacturer,
            brand=brand
        )
        
        if not self.client or self.quota_exhausted:
            return self._heuristic_classify(description)
                
        try:
            raw_text = self._generate_candidate(prompt)
            return parse_json_response(raw_text)
        except Exception as e:
            logger.warning(f"Gemini classification error ({e}). Falling back to deterministic heuristic.")
            return self._heuristic_classify(description)

    def extract_attributes(self, mpn: str, description: str, classpath: str, lov_context: str = "") -> list:
        prompt = EXTRACTION_PROMPT_TEMPLATE.format(
            mpn=mpn,
            description=description,
            classpath=classpath,
            lov_context=lov_context
        )
        if not self.client or self.quota_exhausted:
            return []
        try:
            raw_text = self._generate_candidate(prompt)
            parsed = parse_json_response(raw_text)
            return parsed if isinstance(parsed, list) else []
        except Exception as e:
            logger.warning(f"Gemini attribute extraction error ({e}). Returning empty list.")
            return []

    def generate_descriptions(
        self,
        mpn: str,
        manufacturer: str,
        brand: str,
        noun: str,
        attributes: str
    ) -> Dict[str, Any]:
        prompt = DESCRIPTION_PROMPT_TEMPLATE.format(
            mpn=mpn,
            manufacturer=manufacturer,
            brand=brand,
            noun=noun,
            attributes=attributes
        )
        if not self.client or self.quota_exhausted:
            return self._deterministic_generate_descriptions(mpn, manufacturer, brand, noun)

        try:
            raw_text = self._generate_candidate(prompt)
            return parse_json_response(raw_text)
        except Exception as e:
            logger.warning(f"Gemini description generation error ({e}). Falling back to deterministic generator.")
            return self._deterministic_generate_descriptions(mpn, manufacturer, brand, noun)

gemini_service = GeminiService()
