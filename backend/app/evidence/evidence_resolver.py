from app.schemas.evidence import EvidenceSchema, BoundingBoxSchema
from typing import List, Optional

class EvidenceResolver:
    def resolve_product_evidence(self, mpn: str) -> List[EvidenceSchema]:
        # Return deterministic spec sheet bounding box evidence
        if "PDSH" in mpn.upper():
            return [
                EvidenceSchema(
                    evidence_id="ev-001",
                    attribute_label="VOLTAGE RATING",
                    document_name="PDSH4816AF_Spec_Sheet.pdf",
                    page_number=1,
                    extracted_text="Electrical Supply Rating: 120V / 60Hz / 15A dedicated circuit requirement",
                    confidence=0.98,
                    bounding_box=BoundingBoxSchema(x0=120.5, y0=340.2, x1=480.0, y1=365.8)
                ),
                EvidenceSchema(
                    evidence_id="ev-002",
                    attribute_label="SOUND LEVEL",
                    document_name="PDSH4816AF_Spec_Sheet.pdf",
                    page_number=2,
                    extracted_text="Acoustic Performance Rating: 47 dBA quiet operational sound insulation package",
                    confidence=0.96,
                    bounding_box=BoundingBoxSchema(x0=110.0, y0=510.4, x1=460.2, y1=535.0)
                )
            ]
        return [
            EvidenceSchema(
                evidence_id="ev-003",
                attribute_label="STANDARD SPECIFICATION",
                document_name="Industrial_Technical_Data_Sheet.pdf",
                page_number=1,
                extracted_text=f"Product Part Number {mpn} manufactured to commercial specifications",
                confidence=0.92,
                bounding_box=BoundingBoxSchema(x0=100.0, y0=200.0, x1=500.0, y1=240.0)
            )
        ]

evidence_resolver = EvidenceResolver()
