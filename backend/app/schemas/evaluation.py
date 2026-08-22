from pydantic import BaseModel
from typing import List, Dict, Optional

class DomainScoresSchema(BaseModel):
    classification: float
    manufacturer: float
    brand: float
    lov_compliance: float
    uom_compliance: float
    character_compliance: float
    completeness: float

class DiscrepancyItemSchema(BaseModel):
    mfg_part_num: str
    field_name: str
    category: str
    expected_value: str
    predicted_value: str
    status: str
    auto_fixable: bool

class MetricCategoryBreakdownSchema(BaseModel):
    category_name: str
    count: int
    percentage: float
    description: str

class EvaluationResultSchema(BaseModel):
    run_id: str
    eval_id: Optional[str] = None
    dataset_name: str
    products_evaluated: int
    total_evaluated: Optional[int] = 0
    overall_accuracy: float
    precision_score: Optional[float] = 0.95
    recall_score: Optional[float] = 0.92
    f1_score: float
    rouge_l_score: float
    lov_compliance_rate: float
    uom_compliance_rate: float
    auto_fix_success_rate: float
    autofix_success_rate: Optional[float] = 90.0
    character_compliance_rate: Optional[float] = 92.0
    classification_accuracy: Optional[float] = 95.0
    completeness_rate: Optional[float] = 90.0
    domain_scores: DomainScoresSchema
    category_counts: Dict[str, int]
    discrepancies: List[DiscrepancyItemSchema]
    created_at: str
