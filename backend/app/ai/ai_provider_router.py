from typing import Dict, Any, List, Optional, Tuple
from app.core.config import settings
from app.core.logging import logger
from app.ai.providers.base import AbstractAIProvider
from app.ai.providers.watsonx_provider import WatsonxProvider
from app.ai.providers.gemini_provider import GeminiProvider
from app.ai.schemas import (
    AIClassificationResult,
    AIAttributeResult,
    AIDescriptionResult,
    AIProviderStatusEnum,
    ProviderHealth
)

from threading import Lock

class AIProviderRouter:
    """
    SORTOLOG IQ Central Provider Router
    
    PRIMARY AI PROVIDER:   IBM watsonx.ai (meta-llama/llama-3-3-70b-instruct)
    SECONDARY AI PROVIDER: Google Gemini API (gemini-2.5-flash)
    FALLBACK ENGINE:       Local Deterministic Intelligence Core
    """
    def __init__(self):
        self.primary_provider: AbstractAIProvider = WatsonxProvider()
        self.secondary_provider: AbstractAIProvider = GeminiProvider()
        self._classify_cache: Dict[str, Tuple[AIClassificationResult, str]] = {}
        self._extract_cache: Dict[str, Tuple[List[AIAttributeResult], str]] = {}
        self._desc_cache: Dict[str, Tuple[AIDescriptionResult, str]] = {}
        self._cache_lock = Lock()

    def get_overall_status(self) -> Tuple[AIProviderStatusEnum, str]:
        if self.primary_provider.is_available():
            return AIProviderStatusEnum.AI_AVAILABLE, "IBM watsonx.ai Primary Active (meta-llama/llama-3-3-70b-instruct)."
        elif self.secondary_provider.is_available():
            return AIProviderStatusEnum.AI_FALLBACK_ACTIVE, "IBM watsonx.ai unavailable. Switching to Gemini API Secondary Fallback."
        elif self.primary_provider.is_circuit_open() and "quota" in self.primary_provider.get_health().message.lower():
            return AIProviderStatusEnum.AI_QUOTA_EXHAUSTED, "AI Provider quota/rate limit exhausted. Local deterministic engine active."
        else:
            return AIProviderStatusEnum.AI_DISABLED, "AI Providers Unavailable. Operating in Local Deterministic Engine Mode."

    def get_provider_health(self) -> Dict[str, ProviderHealth]:
        return {
            "watsonx": self.primary_provider.get_health(),
            "gemini": self.secondary_provider.get_health()
        }

    def _deterministic_classify(self, description: str) -> AIClassificationResult:
        desc_upper = description.upper()
        if "DISHWASHER" in desc_upper:
            return AIClassificationResult(
                department="Appliances & Consumer Electronics",
                class_name="Kitchen Appliances",
                fine_class="Built-In Dishwashers",
                classpath="Appliances & Consumer Electronics>Kitchen Appliances>Built-In Dishwashers",
                confidence=0.95,
                reason="Local deterministic structural keyword match ('DISHWASHER')"
            )
        elif "DISC" in desc_upper or "CUT-OFF" in desc_upper:
            return AIClassificationResult(
                department="Abrasives & Cutting Tools",
                class_name="Abrasive Discs",
                fine_class="Metal Cut-Off Discs",
                classpath="Abrasives & Cutting Tools>Abrasive Discs>Metal Cut-Off Discs",
                confidence=0.95,
                reason="Local deterministic structural keyword match ('CUT-OFF DISC')"
            )
        elif "CRIMPER" in desc_upper or "TOOL" in desc_upper:
            return AIClassificationResult(
                department="Hand & Power Tools",
                class_name="Hand Tools",
                fine_class="Crimpers & Cutters",
                classpath="Hand & Power Tools>Hand Tools>Crimpers & Cutters",
                confidence=0.95,
                reason="Local deterministic structural keyword match ('CRIMPER')"
            )
        else:
            return AIClassificationResult(
                department="General Industrial",
                class_name="Unclassified",
                fine_class="UNKNOWN",
                classpath="General Industrial>Unclassified>UNKNOWN",
                confidence=0.50,
                reason="Local deterministic fallback (Uncertain category)"
            )

    def _deterministic_generate_descriptions(
        self, mpn: str, manufacturer: str, brand: str, noun: str
    ) -> AIDescriptionResult:
        clean_brand = brand.replace("®", "").strip().upper()
        return AIDescriptionResult(
            product_name=f"{brand} {noun} {mpn}".strip(),
            mobile_desc=f"{clean_brand} {noun} {mpn}"[:35],
            invoice_desc=f"{clean_brand} {noun} {mpn}".upper()[:30],
            short_desc=f"{brand} {noun} {mpn} Industrial Spec",
            long_desc=f"{brand} {noun} (MPN: {mpn}) manufactured by {manufacturer}. Engineered for high-performance industrial reliability.",
            retail_desc=f"Upgrade your operations with the {brand} {noun} ({mpn}).",
            marketing_description=f"The {brand} {noun} model {mpn} offers superior efficiency, heavy-duty construction, and trusted performance.",
            item_features=[
                f"Heavy-duty industrial grade {noun}",
                f"Manufactured by {manufacturer}",
                f"Standard commercial voltage & footprint",
                f"Original MPN: {mpn}"
            ]
        )

    def classify_product(
        self, mpn: str, description: str, manufacturer: str, brand: str, session: Optional[Any] = None
    ) -> Tuple[AIClassificationResult, str]:
        cache_key = f"{mpn.strip().lower()}|{description.strip().lower()}|{manufacturer.strip().lower()}|{brand.strip().lower()}"
        with self._cache_lock:
            if cache_key in self._classify_cache:
                return self._classify_cache[cache_key]

        res_tuple = self._do_classify_product(mpn, description, manufacturer, brand, session)
        with self._cache_lock:
            self._classify_cache[cache_key] = res_tuple
        return res_tuple

    def _do_classify_product(
        self, mpn: str, description: str, manufacturer: str, brand: str, session: Optional[Any] = None
    ) -> Tuple[AIClassificationResult, str]:
        if session and getattr(session, "ai_budget_exhausted", False):
            logger.info(f"Session AI budget exhausted for {mpn}. Bypassing AI providers.")
            return self._deterministic_classify(description), "local_engine"

        # 1. Try Primary Provider (IBM watsonx.ai)
        if self.primary_provider.is_available():
            try:
                res = self.primary_provider.classify_product(mpn, description, manufacturer, brand)
                if session:
                    session.record_ai_call("IBM watsonx.ai")
                return res, "IBM watsonx.ai"
            except Exception as e:
                logger.warning(f"Primary AI Provider (IBM watsonx.ai) failed: {e}. Initiating failover.")
                if session:
                    session.record_ai_fallback()

        # 2. Try Secondary Provider (Gemini API Fallback)
        if self.secondary_provider.is_available():
            try:
                logger.info(f"Executing Gemini secondary AI fallback for product {mpn}.")
                res = self.secondary_provider.classify_product(mpn, description, manufacturer, brand)
                if session:
                    session.record_ai_call("Gemini")
                return res, "Gemini (Secondary Fallback)"
            except Exception as e:
                logger.warning(f"Secondary AI Provider (Gemini) failed: {e}.")
                if session:
                    session.record_ai_fallback()

        # 3. Local Deterministic Engine Fallback
        if session:
            session.record_local_decision()
        return self._deterministic_classify(description), "local_engine"

    def extract_attributes(
        self, mpn: str, description: str, classpath: str, lov_context: str = "", session: Optional[Any] = None
    ) -> Tuple[List[AIAttributeResult], str]:
        cache_key = f"{mpn.strip().lower()}|{description.strip().lower()}|{classpath.strip().lower()}"
        with self._cache_lock:
            if cache_key in self._extract_cache:
                return self._extract_cache[cache_key]

        res_tuple = self._do_extract_attributes(mpn, description, classpath, lov_context, session)
        with self._cache_lock:
            self._extract_cache[cache_key] = res_tuple
        return res_tuple

    def _do_extract_attributes(
        self, mpn: str, description: str, classpath: str, lov_context: str = "", session: Optional[Any] = None
    ) -> Tuple[List[AIAttributeResult], str]:
        if session and getattr(session, "ai_budget_exhausted", False):
            return [], "local_engine"

        if self.primary_provider.is_available():
            try:
                res = self.primary_provider.extract_attributes(mpn, description, classpath, lov_context)
                if session:
                    session.record_ai_call("IBM watsonx.ai")
                return res, "IBM watsonx.ai"
            except Exception as e:
                logger.warning(f"Primary AI Provider (IBM watsonx.ai) extraction failed: {e}")
                if session:
                    session.record_ai_fallback()

        if self.secondary_provider.is_available():
            try:
                res = self.secondary_provider.extract_attributes(mpn, description, classpath, lov_context)
                if session:
                    session.record_ai_call("Gemini")
                return res, "Gemini (Secondary Fallback)"
            except Exception as e:
                logger.warning(f"Secondary AI Provider (Gemini) extraction failed: {e}")
                if session:
                    session.record_ai_fallback()

        if session:
            session.record_local_decision()
        return [], "local_engine"

    def generate_descriptions(
        self, mpn: str, manufacturer: str, brand: str, noun: str, attributes: str, session: Optional[Any] = None
    ) -> Tuple[AIDescriptionResult, str]:
        cache_key = f"{mpn.strip().lower()}|{manufacturer.strip().lower()}|{brand.strip().lower()}|{noun.strip().lower()}"
        with self._cache_lock:
            if cache_key in self._desc_cache:
                return self._desc_cache[cache_key]

        res_tuple = self._do_generate_descriptions(mpn, manufacturer, brand, noun, attributes, session)
        with self._cache_lock:
            self._desc_cache[cache_key] = res_tuple
        return res_tuple

    def _do_generate_descriptions(
        self, mpn: str, manufacturer: str, brand: str, noun: str, attributes: str, session: Optional[Any] = None
    ) -> Tuple[AIDescriptionResult, str]:
        if session and getattr(session, "ai_budget_exhausted", False):
            return self._deterministic_generate_descriptions(mpn, manufacturer, brand, noun), "local_engine"

        if self.primary_provider.is_available():
            try:
                res = self.primary_provider.generate_descriptions(mpn, manufacturer, brand, noun, attributes)
                if session:
                    session.record_ai_call("IBM watsonx.ai")
                return res, "IBM watsonx.ai"
            except Exception as e:
                logger.warning(f"Primary AI Provider (IBM watsonx.ai) description generation failed: {e}")
                if session:
                    session.record_ai_fallback()

        if self.secondary_provider.is_available():
            try:
                res = self.secondary_provider.generate_descriptions(mpn, manufacturer, brand, noun, attributes)
                if session:
                    session.record_ai_call("Gemini")
                return res, "Gemini (Secondary Fallback)"
            except Exception as e:
                logger.warning(f"Secondary AI Provider (Gemini) description generation failed: {e}")
                if session:
                    session.record_ai_fallback()

        if session:
            session.record_local_decision()
        return self._deterministic_generate_descriptions(mpn, manufacturer, brand, noun), "local_engine"

ai_provider_router = AIProviderRouter()
