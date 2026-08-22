from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import uuid
import re

from app.schemas.product import ProductSchema
from app.schemas.review import ReviewItemSchema
from app.schemas.evaluation import EvaluationResultSchema

class AuditEvent(BaseModel):
    id: str = Field(default_factory=lambda: f"evt-{uuid.uuid4().hex[:8]}")
    product_id: str
    event_type: str
    field: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    description: str
    actor: str = "SYSTEM"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProcessingSession:
    def __init__(self, session_id: Optional[str] = None):
        self.session_id: str = session_id or f"sess-{uuid.uuid4().hex[:12]}"
        self.created_at: datetime = datetime.now(timezone.utc)
        self.last_accessed_at: datetime = datetime.now(timezone.utc)
        self.status: str = "ACTIVE"
        
        self.products: Dict[str, ProductSchema] = {}
        self.reviews: Dict[str, ReviewItemSchema] = {}
        self.evaluation: Optional[EvaluationResultSchema] = None
        self.audit_events: List[AuditEvent] = []
        self.temporary_files: List[str] = []

        # AI Session Usage & Competitive Metrics
        self.ai_requests_count: int = 0
        self.local_decisions_count: int = 0
        self.ai_fallbacks_count: int = 0
        self.max_ai_requests: int = 500
        self.ai_budget_exhausted: bool = False

    def touch(self) -> None:
        self.last_accessed_at = datetime.now(timezone.utc)

    def is_expired(self, timeout_minutes: int = 120) -> bool:
        elapsed_seconds = (datetime.now(timezone.utc) - self.last_accessed_at).total_seconds()
        return elapsed_seconds > (timeout_minutes * 60)

    def extend_session(self, additional_minutes: int = 120) -> None:
        self.touch()

    def record_ai_call(self, provider_name: str = "Gemini") -> None:
        self.touch()
        self.ai_requests_count += 1
        if self.ai_requests_count >= self.max_ai_requests:
            self.ai_budget_exhausted = True

    def record_local_decision(self) -> None:
        self.touch()
        self.local_decisions_count += 1

    def record_ai_fallback(self) -> None:
        self.touch()
        self.ai_fallbacks_count += 1

    # --- PRODUCT METHODS ---
    def add_product(self, product: ProductSchema) -> ProductSchema:
        self.touch()
        self.products[product.id] = product
        return product

    def get_product(self, product_id: str) -> Optional[ProductSchema]:
        self.touch()
        return self.products.get(product_id)

    def list_products(
        self,
        search: Optional[str] = None,
        status: Optional[str] = None,
        requires_review: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[ProductSchema], int]:
        self.touch()
        items = list(self.products.values())

        if status:
            items = [p for p in items if p.quality and p.quality.status == status]

        if requires_review is not None:
            items = [p for p in items if p.requires_review == requires_review]

        if search:
            s_lower = search.lower()
            filtered = []
            for p in items:
                mpn = p.identity.mfg_part_num.lower() if p.identity and p.identity.mfg_part_num else ""
                name = p.content.product_name.lower() if p.content and p.content.product_name else ""
                mfr = p.identity.manufacturer.canonical_value.lower() if p.identity and p.identity.manufacturer else ""
                brand = p.identity.brand.canonical_value.lower() if p.identity and p.identity.brand else ""
                classpath = p.classification.classpath.lower() if p.classification and p.classification.classpath else ""
                
                if (s_lower in mpn or s_lower in name or s_lower in mfr or s_lower in brand or s_lower in classpath):
                    filtered.append(p)
            items = filtered

        total = len(items)
        paginated_items = items[skip:skip + limit]
        return paginated_items, total

    # --- REVIEW METHODS ---
    def add_review(self, review: ReviewItemSchema) -> ReviewItemSchema:
        self.touch()
        self.reviews[review.review_id] = review
        return review

    def get_review(self, review_id: str) -> Optional[ReviewItemSchema]:
        self.touch()
        return self.reviews.get(review_id)

    def list_reviews(self, status: Optional[str] = "PENDING") -> List[ReviewItemSchema]:
        self.touch()
        if not status:
            return list(self.reviews.values())
        return [r for r in self.reviews.values() if r.status == status]

    def update_review_status(self, review_id: str, new_status: str) -> Optional[ReviewItemSchema]:
        self.touch()
        review = self.reviews.get(review_id)
        if not review:
            return None
        review.status = new_status
        return review

    # --- AUDIT EVENT METHODS ---
    def log_event(
        self,
        product_id: str,
        event_type: str,
        description: str,
        field: Optional[str] = None,
        old_value: Optional[str] = None,
        new_value: Optional[str] = None,
        actor: str = "SYSTEM"
    ) -> AuditEvent:
        self.touch()
        evt = AuditEvent(
            product_id=product_id,
            event_type=event_type,
            field=field,
            old_value=old_value,
            new_value=new_value,
            description=description,
            actor=actor
        )
        self.audit_events.append(evt)
        return evt

    def get_audit_events_for_product(self, product_id: str) -> List[Dict[str, Any]]:
        self.touch()
        return [e.model_dump() for e in self.audit_events if e.product_id == product_id]

    # --- ANALYTICS ---
    def calculate_analytics(self) -> Dict[str, Any]:
        self.touch()
        products_list = list(self.products.values())
        total_prods = len(products_list)

        total_decisions = self.local_decisions_count + self.ai_requests_count
        local_ratio = round((self.local_decisions_count / max(1, total_decisions)) * 100.0, 1) if total_decisions > 0 else 100.0
        ai_dependency = round((self.ai_requests_count / max(1, total_decisions)) * 100.0, 1) if total_decisions > 0 else 0.0

        if total_prods == 0:
            return {
                "overall_quality_score": 0.0,
                "total_products_processed": 0,
                "total_attributes_generated": 0,
                "pending_review_count": 0,
                "blocked_count": 0,
                "auto_fixed_count": 0,
                "evaluation_accuracy": self.evaluation.overall_accuracy if self.evaluation else 0.0,
                "local_intelligence_ratio": local_ratio,
                "ai_dependency_rate": ai_dependency,
                "ai_requests_count": self.ai_requests_count,
                "local_decisions_count": self.local_decisions_count,
                "ai_fallbacks_count": self.ai_fallbacks_count,
                "ai_budget_exhausted": self.ai_budget_exhausted,
                "quality_domain_scores": {
                    "classification": 0.0,
                    "manufacturer": 0.0,
                    "brand": 0.0,
                    "lov_values": 0.0,
                    "uom_format": 0.0,
                    "descriptions": 0.0
                }
            }

        avg_quality = round(sum(p.quality.overall_score for p in products_list if p.quality) / total_prods, 1)
        blocked_count = sum(1 for p in products_list if p.quality and p.quality.status == "CRITICAL")
        total_attrs = sum(len(p.attributes) for p in products_list if p.attributes)
        pending_reviews = len(self.list_reviews(status="PENDING"))
        auto_fixed_count = sum(1 for r in self.reviews.values() if r.status == "AUTO_FIXED") + \
                           sum(1 for e in self.audit_events if e.event_type == "AUTO_FIX_APPLIED")

        eval_accuracy = self.evaluation.overall_accuracy if self.evaluation else avg_quality

        # Calculate domain scores dynamically from actual products
        class_score = round(sum(1 for p in products_list if p.classification and p.classification.classpath) / total_prods * 100.0, 1)
        mfr_score = round(sum(1 for p in products_list if p.identity and p.identity.manufacturer and p.identity.manufacturer.canonical_value) / total_prods * 100.0, 1)
        brand_score = round(sum(1 for p in products_list if p.identity and p.identity.brand and p.identity.brand.canonical_value) / total_prods * 100.0, 1)
        
        all_attrs = [a for p in products_list if p.attributes for a in p.attributes]
        total_a_count = max(1, len(all_attrs))
        lov_score = round(sum(1 for a in all_attrs if a.lov_matched) / total_a_count * 100.0, 1) if all_attrs else 100.0
        uom_score = round(sum(1 for a in all_attrs if a.uom) / total_a_count * 100.0, 1) if all_attrs else 100.0
        desc_score = round(sum(1 for p in products_list if p.content and p.content.short_desc) / total_prods * 100.0, 1)

        return {
            "overall_quality_score": avg_quality,
            "total_products_processed": total_prods,
            "total_attributes_generated": total_attrs,
            "pending_review_count": pending_reviews,
            "blocked_count": blocked_count,
            "auto_fixed_count": auto_fixed_count,
            "evaluation_accuracy": eval_accuracy,
            "local_intelligence_ratio": local_ratio,
            "ai_dependency_rate": ai_dependency,
            "ai_requests_count": self.ai_requests_count,
            "local_decisions_count": self.local_decisions_count,
            "ai_fallbacks_count": self.ai_fallbacks_count,
            "ai_budget_exhausted": self.ai_budget_exhausted,
            "quality_domain_scores": {
                "classification": class_score,
                "manufacturer": mfr_score,
                "brand": brand_score,
                "lov_values": lov_score,
                "uom_format": uom_score,
                "descriptions": desc_score
            }
        }
