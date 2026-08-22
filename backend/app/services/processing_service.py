from app.schemas.product import (
    ProductSchema, SourceDataSchema, ProductIdentitySchema, ValueMatchSchema,
    ClassificationDataSchema, ProductContentSchema, ProductAttributeSchema
)
from app.schemas.attributes import ExplanationSchema
from app.ai.ai_provider_router import ai_provider_router
from app.ai.semantic_decision_service import semantic_decision_service
from app.services.local_cleaner import local_cleaner
from app.validation.engine import validation_engine
from app.validation.auto_fix import auto_fix_service
from app.services.quality_service import quality_service
from app.schemas.review import ReviewItemSchema
from app.session.session_models import ProcessingSession
from typing import Dict, Any, Optional, List, Callable
import uuid
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
from app.core.logging import logger
import re

class ProcessingService:
    def process_candidate(
        self,
        session: ProcessingSession,
        candidate: Dict[str, Any],
        progress_callback: Optional[Callable[[str, int], None]] = None,
    ) -> ProductSchema:
        def report(stage: str, progress: int) -> None:
            if progress_callback:
                progress_callback(stage, progress)

        row_id = candidate.get("source_row_id", 1)
        mpn = candidate.get("mpn", "")
        raw_desc = candidate.get("description", "")
        raw_mfr = candidate.get("part_manuf", "")
        e1_b = candidate.get("e1_brand", "")
        unilog_b = candidate.get("unilog_brand", "")
        dib_b = candidate.get("dib_brand", "")
        raw_brand_str = unilog_b or dib_b or e1_b or "GENERIC"

        safe_mpn_slug = re.sub(r'[^a-zA-Z0-9_-]', '_', mpn.strip().lower()) if mpn else ""
        product_id = f"prod-{safe_mpn_slug}" if safe_mpn_slug else f"prod-row-{row_id}"

        # 1. Local Master Normalization
        report("MANUFACTURER_BRAND", 10)
        canonical_mfr, mfr_status, mfr_conf = local_cleaner.resolve_manufacturer(raw_mfr)
        canonical_brand, brand_status, brand_conf = local_cleaner.resolve_brand(raw_brand_str)

        # 2. Semantic Uncertainty Gate
        should_call_ai, gate_reason, local_ctx = semantic_decision_service.evaluate_enrichment_need(
            mpn, raw_desc, raw_mfr, raw_brand_str
        )

        # 3. Taxonomy Classification (Local vs AI)
        report("CLASSIFYING", 25)
        if should_call_ai:
            class_res, provider_used = ai_provider_router.classify_product(
                mpn, raw_desc, canonical_mfr, canonical_brand, session=session
            )
            classification = ClassificationDataSchema(
                department=class_res.department,
                class_name=class_res.class_name,
                fine_class=class_res.fine_class,
                classpath=class_res.classpath,
                confidence=class_res.confidence,
                reason=f"{class_res.reason} (Provider: {provider_used})"
            )
        else:
            session.record_local_decision()
            ml_class = local_ctx.get("ml_classification")
            if ml_class and isinstance(ml_class, dict):
                classification = ClassificationDataSchema(
                    department=ml_class.get("department", "General Industrial"),
                    class_name=ml_class.get("class_name", "Hardware & Supplies"),
                    fine_class=ml_class.get("fine_class", "General Fasteners"),
                    classpath=ml_class.get("classpath", "General Industrial>Hardware & Supplies>General Fasteners"),
                    confidence=ml_class.get("confidence", 0.95),
                    reason=f"{ml_class.get('reason')} | {gate_reason}"
                )
            else:
                class_res, _ = ai_provider_router.classify_product(mpn, raw_desc, canonical_mfr, canonical_brand, session=None)
                classification = ClassificationDataSchema(
                    department=class_res.department,
                    class_name=class_res.class_name,
                    fine_class=class_res.fine_class,
                    classpath=class_res.classpath,
                    confidence=0.95,
                    reason=f"Local deterministic decision ({gate_reason})"
                )

        # 4. Attributes & LOV Enrichment
        report("AI_ENRICHMENT", 45)
        sample_attributes = []
        if should_call_ai:
            extracted_raw, _ = ai_provider_router.extract_attributes(
                mpn, raw_desc, classification.classpath, session=session
            )
            for item in extracted_raw:
                sample_attributes.append(
                    ProductAttributeSchema(
                        sequence=item.sequence,
                        label=item.label,
                        raw_value=item.raw_value,
                        normalized_value=item.normalized_value,
                        uom=item.uom,
                        status="VALID" if item.raw_value else "NEEDS_REVIEW",
                        lov_matched=bool(item.raw_value),
                        explanation=ExplanationSchema(
                            raw_source=f"{mpn} Specifications",
                            ai_interpretation=f"Extracted {item.label} value",
                            lov_status=f"LOV Matched ({item.normalized_value})" if item.raw_value else "Unmatched",
                            uom_status=f"UOM Standard ({item.uom})" if item.uom else "N/A",
                            validation_result="PASS" if item.raw_value else "REVIEW"
                        )
                    )
                )

        # Local Deterministic attributes fallback
        if not sample_attributes:
            sample_attributes = [
                ProductAttributeSchema(
                    sequence=1,
                    label="MANUFACTURER PART NUMBER",
                    raw_value=mpn or "N/A",
                    normalized_value=mpn or "N/A",
                    uom="",
                    status="VALID",
                    lov_matched=True,
                    explanation=ExplanationSchema(
                        raw_source="Source Feed",
                        ai_interpretation="Canonical Part Number",
                        lov_status="Matched",
                        uom_status="N/A",
                        validation_result="PASS"
                    )
                ),
                ProductAttributeSchema(
                    sequence=2,
                    label="PRIMARY BRAND",
                    raw_value=canonical_brand,
                    normalized_value=canonical_brand,
                    uom="",
                    status="VALID",
                    lov_matched=True,
                    explanation=ExplanationSchema(
                        raw_source="Brand Normalizer",
                        ai_interpretation="Approved Trademark Brand",
                        lov_status="Matched",
                        uom_status="N/A",
                        validation_result="PASS"
                    )
                )
            ]

        # 5. Content & Description Generation
        report("DESCRIPTION", 65)
        noun = classification.fine_class.split(" ")[-1]
        desc_res, desc_provider = ai_provider_router.generate_descriptions(
            mpn, canonical_mfr, canonical_brand, noun, str(sample_attributes), session=session if should_call_ai else None
        )
        content = ProductContentSchema(
            product_name=desc_res.product_name,
            mobile_desc=desc_res.mobile_desc,
            invoice_desc=desc_res.invoice_desc,
            short_desc=desc_res.short_desc,
            long_desc=desc_res.long_desc,
            retail_desc=desc_res.retail_desc,
            marketing_description=desc_res.marketing_description,
            item_features=desc_res.item_features
        )

        now_iso = datetime.now(timezone.utc).isoformat()

        # Build Candidate Schema
        product = ProductSchema(
            id=product_id,
            source_row_id=row_id,
            source_data=SourceDataSchema(
                mfg_part_num=mpn,
                part_desc=raw_desc,
                e1_brand=e1_b,
                unilog_brand=unilog_b,
                dib_brand=dib_b,
                part_manuf=raw_mfr,
                raw_columns=candidate.get("raw_row", {})
            ),
            identity=ProductIdentitySchema(
                mfg_part_num=mpn,
                manufacturer=ValueMatchSchema(raw_value=raw_mfr, canonical_value=canonical_mfr, confidence=0.98, status=mfr_status),
                brand=ValueMatchSchema(raw_value=raw_brand_str, canonical_value=canonical_brand, confidence=0.95, status="NORMALIZED")
            ),
            classification=classification,
            content=content,
            attributes=sample_attributes,
            quality=quality_service.calculate_quality(
                ProductSchema.model_construct(
                    id=product_id, source_row_id=row_id,
                    source_data=SourceDataSchema(mfg_part_num=mpn, part_desc=raw_desc, e1_brand="", unilog_brand="", dib_brand="", part_manuf=raw_mfr),
                    identity=ProductIdentitySchema(mfg_part_num=mpn, manufacturer=ValueMatchSchema(raw_value=raw_mfr, canonical_value=canonical_mfr, confidence=0.98, status="MATCHED"), brand=ValueMatchSchema(raw_value=raw_brand_str, canonical_value=canonical_brand, confidence=0.95, status="MATCHED")),
                    classification=classification, content=content, quality=None, validations=[], created_at="", updated_at=""
                ),
                []
            ),

            created_at=now_iso,
            updated_at=now_iso
        )

        # 6. Validation
        report("VALIDATING", 80)
        validations = validation_engine.validate_product(product)
        product.validations = validations

        # 7. Auto-Fix
        product, fixes_applied = auto_fix_service.apply_auto_fixes(product)
        if fixes_applied > 0:
            product.validations = validation_engine.validate_product(product)
            session.log_event(
                product_id=product.id,
                event_type="AUTO_FIX_APPLIED",
                description=f"Applied {fixes_applied} deterministic auto-fixes to product {product.id}.",
                actor="AUTO_FIX_ENGINE"
            )

        # 8. Final Quality Score
        product.quality = quality_service.calculate_quality(product, product.validations)

        # 9. Review Routing
        report("QUALITY_REVIEW", 95)
        has_failed_validation = any(v.status == "FAIL" for v in product.validations)
        is_unknown_class = product.classification.fine_class == "UNKNOWN" or product.classification.confidence < 0.80
        is_low_quality = product.quality.status in ["NEEDS_REVIEW", "CRITICAL"] or product.quality.overall_score < 80.0

        if has_failed_validation or is_unknown_class or is_low_quality:
            product.requires_review = True
            for v in product.validations:
                if v.severity in ["WARNING", "ERROR", "CRITICAL"] and v.status == "FAIL":
                    review_item = ReviewItemSchema(
                        review_id=f"rev-{uuid.uuid4().hex[:8]}",
                        product_id=product.id,
                        mfg_part_num=product.identity.mfg_part_num,
                        product_name=product.content.product_name,
                        field=v.target_field,
                        field_name=v.target_field,
                        issue_type=v.rule_id,
                        severity=v.severity,
                        current_value=str(v.current_value or ""),
                        suggested_value=str(v.expected_value or ""),
                        reason=v.message,
                        quality_score=product.quality.overall_score,
                        status="PENDING",
                        created_at=now_iso
                    )
                    session.add_review(review_item)

        # Save to In-Memory Session
        session.add_product(product)
        session.log_event(
            product_id=product.id,
            event_type="ENRICHMENT_COMPLETE",
            description=f"Enriched product {product.id} with overall quality score {product.quality.overall_score}/100."
        )

        return product

    def process_candidates_batch(
        self,
        session: ProcessingSession,
        candidates: List[Dict[str, Any]],
        max_workers: int = 10,
        progress_callback: Optional[Callable[[str, int], None]] = None
    ) -> List[ProductSchema]:
        if not candidates:
            return []

        if len(candidates) <= 1:
            results = []
            for i, cand in enumerate(candidates, start=1):
                res = self.process_candidate(
                    session,
                    cand,
                    progress_callback=progress_callback
                )
                results.append(res)
            return results

        results: List[Optional[ProductSchema]] = [None] * len(candidates)
        completed_count = 0
        lock = Lock()

        def _worker(idx: int, cand: Dict[str, Any]):
            nonlocal completed_count
            try:
                prod = self.process_candidate(session, cand)
                results[idx] = prod
            except Exception as e:
                logger.exception("Failed processing candidate row %s: %s", cand.get("source_row_id", idx), e)
            finally:
                with lock:
                    completed_count += 1
                    pct = min(99, int((completed_count / len(candidates)) * 100))
                    if progress_callback:
                        progress_callback("ENRICHING_BATCH", pct)

        workers = min(max_workers, len(candidates))
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = [executor.submit(_worker, i, cand) for i, cand in enumerate(candidates)]
            for future in as_completed(futures):
                try:
                    future.result()
                except Exception as e:
                    logger.error(f"Batch worker execution error: {e}")

        return [r for r in results if r is not None]

processing_service = ProcessingService()
