from app.schemas.review import ReviewItemSchema
from app.session.session_models import ProcessingSession
from typing import Optional

class ReviewService:
    def approve_review(self, session: ProcessingSession, review_id: str) -> Optional[ReviewItemSchema]:
        review = session.get_review(review_id)
        if not review:
            return None
        
        updated_review = session.update_review_status(review_id, "APPROVED")
        
        product = session.get_product(review.product_id)
        if product:
            product.requires_review = False
            if product.quality:
                product.quality.status = "PASS"
            session.add_product(product)

            session.log_event(
                product_id=product.id,
                event_type="HUMAN_APPROVAL",
                description=f"Approved review item '{review.field}' value '{review.suggested_value}'.",
                field=review.field,
                old_value=review.current_value,
                new_value=review.suggested_value,
                actor="HUMAN_REVIEWER"
            )

        return updated_review

    def reject_review(self, session: ProcessingSession, review_id: str) -> Optional[ReviewItemSchema]:
        review = session.get_review(review_id)
        if not review:
            return None
        
        updated_review = session.update_review_status(review_id, "REJECTED")
        
        product = session.get_product(review.product_id)
        if product:
            session.log_event(
                product_id=product.id,
                event_type="HUMAN_REJECTION",
                description=f"Rejected suggestion for field '{review.field}'. Kept current value '{review.current_value}'.",
                field=review.field,
                old_value=review.current_value,
                new_value=review.current_value,
                actor="HUMAN_REVIEWER"
            )

        return updated_review

    def autofix_review(self, session: ProcessingSession, review_id: str) -> Optional[ReviewItemSchema]:
        review = session.get_review(review_id)
        if not review:
            return None
        
        updated_review = session.update_review_status(review_id, "AUTO_FIXED")
        
        product = session.get_product(review.product_id)
        if product:
            product.requires_review = False
            session.add_product(product)

            session.log_event(
                product_id=product.id,
                event_type="AUTO_FIX_APPLIED",
                description=f"Deterministic auto-fix applied to field '{review.field}'. Updated to '{review.suggested_value}'.",
                field=review.field,
                old_value=review.current_value,
                new_value=review.suggested_value,
                actor="AUTO_FIX_ENGINE"
            )

        return updated_review

review_service = ReviewService()
