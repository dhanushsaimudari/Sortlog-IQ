import time
from typing import Optional, Dict, Any, List
from app.core.config import settings
from app.core.logging import logger
from app.ai.providers.base import AbstractAIProvider
from app.ai.schemas import (
    AIClassificationResult,
    AIAttributeResult,
    AIDescriptionResult,
    ProviderHealth
)
from app.ai.response_parser import parse_json_response
from app.ai.prompts.classification import CLASSIFICATION_PROMPT_TEMPLATE
from app.ai.prompts.extraction import EXTRACTION_PROMPT_TEMPLATE
from app.ai.prompts.description import DESCRIPTION_PROMPT_TEMPLATE

class GeminiProvider(AbstractAIProvider):
    def __init__(self):
        raw_key = settings.GEMINI_API_KEY
        self.api_key = raw_key.strip() if raw_key else None
        self.client = None
        self.circuit_open = False
        self.circuit_reason = ""

        is_valid_format = bool(self.api_key and not self.api_key.startswith("your_") and len(self.api_key) > 10)
        if is_valid_format:
            try:
                from google import genai
                from google.genai.types import HttpOptions
                self.client = genai.Client(
                    api_key=self.api_key,
                    http_options=HttpOptions(timeout=30000),
                )
                masked = self.api_key[:5] + "..." if self.api_key else "None"
                logger.info(f"GeminiProvider initialized. Model: {settings.GEMINI_MODEL}, Key: {masked}")
            except Exception as e:
                logger.warning(f"Could not initialize Google GenAI SDK: {e}")
                self.circuit_open = True
                self.circuit_reason = f"GenAI SDK init failed: {e}"
        else:
            self.circuit_open = True
            self.circuit_reason = "Gemini API key is unconfigured or invalid format."

    @property
    def provider_name(self) -> str:
        return "Gemini"

    def is_available(self) -> bool:
        return self.client is not None and not self.circuit_open

    def is_circuit_open(self) -> bool:
        return self.circuit_open

    def get_health(self) -> ProviderHealth:
        if self.is_available():
            return ProviderHealth(
                provider_name=self.provider_name,
                status="AVAILABLE",
                circuit_open=False,
                message=f"Gemini API operational (model={settings.GEMINI_MODEL})"
            )
        else:
            status_code = "QUOTA_EXHAUSTED" if "429" in self.circuit_reason or "quota" in self.circuit_reason.lower() else "UNAVAILABLE"
            return ProviderHealth(
                provider_name=self.provider_name,
                status=status_code,
                circuit_open=True,
                message=self.circuit_reason or "Gemini API circuit is open."
            )

    def _generate(self, prompt: str, max_retries: int = 1) -> str:
        if not self.is_available():
            raise RuntimeError(f"GeminiProvider unavailable: {self.circuit_reason}")

        candidate_models = [settings.GEMINI_MODEL, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
        # Deduplicate while preserving order
        candidate_models = list(dict.fromkeys([m for m in candidate_models if m]))

        last_error = None
        for target_model in candidate_models:
            for attempt in range(max_retries + 1):
                try:
                    response = self.client.models.generate_content(
                        model=target_model,
                        contents=prompt
                    )
                    return response.text
                except Exception as e:
                    last_error = e
                    err_str = str(e)
                    logger.warning(f"GeminiProvider API attempt (model={target_model}) {attempt + 1}/{max_retries + 1} failed: {e}")
                    if any(k in err_str for k in ["404", "NOT_FOUND", "not found"]):
                        # Try next candidate model
                        break
                    if any(k in err_str for k in ["429", "RESOURCE_EXHAUSTED", "Quota exceeded", "getaddrinfo failed", "ConnectionError"]):
                        self.circuit_open = True
                        self.circuit_reason = f"Circuit open due to Gemini error: {e}"
                        logger.warning(f"Tripped Gemini circuit breaker: {self.circuit_reason}")
                        raise last_error
                    if attempt < max_retries:
                        time.sleep(1.0)
        
        self.circuit_open = True
        self.circuit_reason = f"Circuit open due to Gemini model error: {last_error}"
        raise last_error

    def classify_product(
        self, mpn: str, description: str, manufacturer: str, brand: str
    ) -> AIClassificationResult:
        prompt = CLASSIFICATION_PROMPT_TEMPLATE.format(
            mpn=mpn, description=description, manufacturer=manufacturer, brand=brand
        )
        raw_text = self._generate(prompt)
        parsed = parse_json_response(raw_text)
        return AIClassificationResult(
            department=parsed.get("department", "General Industrial"),
            class_name=parsed.get("class_name", "Unclassified"),
            fine_class=parsed.get("fine_class", "UNKNOWN"),
            classpath=parsed.get("classpath", "General Industrial>Unclassified>UNKNOWN"),
            confidence=parsed.get("confidence", 0.50),
            reason=parsed.get("reason", "Gemini taxonomy classification")
        )

    def extract_attributes(
        self, mpn: str, description: str, classpath: str, lov_context: str = ""
    ) -> List[AIAttributeResult]:
        prompt = EXTRACTION_PROMPT_TEMPLATE.format(
            mpn=mpn, description=description, classpath=classpath, lov_context=lov_context
        )
        raw_text = self._generate(prompt)
        parsed = parse_json_response(raw_text)
        results = []
        if isinstance(parsed, list):
            for seq, item in enumerate(parsed, 1):
                if isinstance(item, dict):
                    results.append(
                        AIAttributeResult(
                            sequence=seq,
                            label=str(item.get("label", item.get("attribute", f"PARAM_{seq}"))).upper(),
                            raw_value=str(item.get("value", item.get("raw_value", ""))),
                            normalized_value=str(item.get("normalized_value", item.get("value", ""))),
                            uom=str(item.get("uom", "")),
                            confidence=0.92
                        )
                    )
        return results

    def generate_descriptions(
        self, mpn: str, manufacturer: str, brand: str, noun: str, attributes: str
    ) -> AIDescriptionResult:
        prompt = DESCRIPTION_PROMPT_TEMPLATE.format(
            mpn=mpn, manufacturer=manufacturer, brand=brand, noun=noun, attributes=attributes
        )
        raw_text = self._generate(prompt)
        parsed = parse_json_response(raw_text)
        return AIDescriptionResult(
            product_name=parsed.get("product_name", f"{brand} {noun} {mpn}"),
            mobile_desc=parsed.get("mobile_desc", f"{brand} {noun} {mpn}"[:35]),
            invoice_desc=parsed.get("invoice_desc", f"{brand} {noun} {mpn}".upper()[:30]),
            short_desc=parsed.get("short_desc", f"{brand} {noun} {mpn} Industrial Spec"),
            long_desc=parsed.get("long_desc", f"{brand} {noun} (MPN: {mpn}) by {manufacturer}"),
            retail_desc=parsed.get("retail_desc", f"High grade {brand} {noun}"),
            marketing_description=parsed.get("marketing_description", f"Commercial {brand} {noun}"),
            item_features=parsed.get("item_features", [f"Heavy-duty {noun}", f"Mfr: {manufacturer}"])
        )
