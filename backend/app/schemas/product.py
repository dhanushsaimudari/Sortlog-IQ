from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from .attributes import ProductAttributeSchema
from .validation import ValidationResultSchema
from .evidence import EvidenceSchema

class SourceDataSchema(BaseModel):
    mfg_part_num: str
    part_desc: str
    e1_brand: str
    unilog_brand: str
    dib_brand: str
    part_manuf: str
    raw_columns: Dict[str, Any] = Field(default_factory=dict)

class ValueMatchSchema(BaseModel):
    raw_value: str
    canonical_value: str
    confidence: float
    status: str  # MATCHED, NORMALIZED, UNKNOWN, MISMATCH

class ProductIdentitySchema(BaseModel):
    mfg_part_num: str
    manufacturer: ValueMatchSchema
    brand: ValueMatchSchema

class ClassificationDataSchema(BaseModel):
    department: str
    class_name: str
    fine_class: str
    classpath: str
    confidence: float
    reason: str

class ProductContentSchema(BaseModel):
    product_name: str
    mobile_desc: str
    invoice_desc: str
    short_desc: str
    long_desc: str
    retail_desc: str
    marketing_description: str
    item_features: List[str] = Field(default_factory=list)

class ComponentScoreSchema(BaseModel):
    brand_normalization: float
    classification: float
    attributes: float
    descriptions: float
    digital_assets: float
    evidence: float

class QualityScoreSchema(BaseModel):
    overall_score: float
    status: str  # EXCELLENT, PASS, NEEDS_REVIEW, CRITICAL
    sub_scores: ComponentScoreSchema
    breakdown: Dict[str, float] = Field(default_factory=dict)
    breakdown_notes: List[str] = Field(default_factory=list)

class AuditTrailSchema(BaseModel):
    timestamp: str
    actor: str
    event_type: str
    description: str

class ProductSchema(BaseModel):
    id: str
    source_row_id: int
    source_data: SourceDataSchema
    identity: ProductIdentitySchema
    classification: ClassificationDataSchema
    content: ProductContentSchema
    attributes: List[ProductAttributeSchema] = Field(default_factory=list)
    quality: QualityScoreSchema
    validations: List[ValidationResultSchema] = Field(default_factory=list)
    evidence: List[EvidenceSchema] = Field(default_factory=list)
    requires_review: bool = False
    status: str = "PROCESSED"
    audit_trail: List[AuditTrailSchema] = Field(default_factory=list)
    created_at: str
    updated_at: str
