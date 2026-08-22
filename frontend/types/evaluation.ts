export interface DiscrepancyItem {
  product_id: string;
  mpn: string;
  field_name: string;
  category: 'EXACT' | 'NORM' | 'FMT_MISMATCH' | 'MFR_MISMATCH' | 'BRAND_MISMATCH' | 'CLASS_MISMATCH' | 'UOM_MISMATCH' | 'MISSING' | 'EXTRA' | 'WRONG';
  expected_value: string;
  predicted_value: string;
  fix_available: boolean;
  status: string;
}

export interface DomainScores {
  identifiers: number;
  brand_normalization: number;
  taxonomy_classification: number;
  attribute_extraction: number;
  description_generation: number;
  digital_assets: number;
}

export interface MetricCategoryBreakdown {
  EXACT: number;
  NORM: number;
  FMT_MISMATCH: number;
  MFR_MISMATCH: number;
  BRAND_MISMATCH: number;
  CLASS_MISMATCH: number;
  UOM_MISMATCH: number;
  MISSING: number;
  EXTRA: number;
  WRONG: number;
}

export interface EvaluationResult {
  eval_id: string;
  timestamp: string;
  products_evaluated: number;
  total_evaluated: number;
  overall_accuracy: number;
  precision_score: number;
  recall_score: number;
  f1_score: number;
  rouge_l_score: number;
  lov_compliance_rate: number;
  uom_compliance_rate: number;
  character_compliance_rate: number;
  classification_accuracy: number;
  completeness_rate: number;
  autofix_success_rate: number;
  auto_fix_success_rate?: number;
  domain_scores: DomainScores;
  category_counts: MetricCategoryBreakdown;
  discrepancies: DiscrepancyItem[];
  is_demo_data?: boolean;
}
