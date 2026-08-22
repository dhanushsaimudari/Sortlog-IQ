from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from app.ai.schemas import (
    AIClassificationResult,
    AIAttributeResult,
    AIDescriptionResult,
    ProviderHealth
)

class AbstractAIProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Returns True if the provider is initialized and circuit breaker is closed."""
        pass

    @abstractmethod
    def is_circuit_open(self) -> bool:
        """Returns True if the provider circuit breaker was tripped (e.g. 429 quota exhausted)."""
        pass

    @abstractmethod
    def get_health(self) -> ProviderHealth:
        """Returns provider health diagnostics."""
        pass

    @abstractmethod
    def classify_product(
        self, mpn: str, description: str, manufacturer: str, brand: str
    ) -> AIClassificationResult:
        pass

    @abstractmethod
    def extract_attributes(
        self, mpn: str, description: str, classpath: str, lov_context: str = ""
    ) -> List[AIAttributeResult]:
        pass

    @abstractmethod
    def generate_descriptions(
        self, mpn: str, manufacturer: str, brand: str, noun: str, attributes: str
    ) -> AIDescriptionResult:
        pass
