export type StatusType = 'VALID' | 'REVIEW' | 'BLOCKED' | 'UNKNOWN' | 'INFO';

export interface SourceData {
  source_row_id: number;
  mfg_part_num: string;
  part_desc: string;
  e1_brand: string;
  unilog_brand: string;
  dib_brand: string;
  part_manuf: string;
}

export interface EntityMatchInfo {
  raw_input?: string;
  raw_value: string;
  canonical_value: string;
  match_status?: 'MATCHED' | 'UNMATCHED' | 'AMBIGUOUS';
  status?: string;
  confidence?: number;
  confidence_score?: number;
  master_id?: string;
}

export interface ProductIdentity {
  internal_id?: string;
  part_number?: string;
  sku_my_part_number?: string;
  mfg_part_num: string;
  manufacturer_part_number?: string;
  alternate_part_number?: string;
  manufacturer: EntityMatchInfo;
  brand: EntityMatchInfo;
  trade_name?: string;
}

export interface ClassificationData {
  department: string;
  class?: string;
  class_name?: string;
  fine?: string;
  fine_class?: string;
  classpath: string;
  confidence?: number;
  confidence_score?: number;
  reason?: string;
}

export interface ProductContent {
  product_name: string;
  mobile_desc?: string;
  invoice_desc?: string;
  short_desc?: string;
  long_desc?: string;
  long_desc1?: string;
  retail_desc?: string;
  marketing_description?: string;
  item_features?: string[];
}

export interface ProductAttribute {
  sequence: number;
  label: string;
  raw_value?: string;
  normalized_value?: string;
  uom?: string;
  status: StatusType;
  source?: 'EXTRACTED' | 'INFERRED' | 'ENRICHED';
  lov_matched: boolean;
  evidence_id?: string;
  explanation?: {
    raw_source: string;
    ai_interpretation: string;
    lov_status: string;
    uom_status: string;
    validation_result: string;
  };
}

export interface CommerceData {
  upc?: string;
  ean?: string;
  gtin?: string;
  unspsc?: string;
  warranty?: string;
  list_price?: number;
  selling_qty?: number;
  selling_uom?: string;
  packaging_info?: string;
}

export interface DimensionValue {
  value?: number;
  uom?: string;
  normalized_value?: number;
}

export interface PackageDimensions {
  length: DimensionValue;
  height: DimensionValue;
  width: DimensionValue;
  weight: DimensionValue;
  volume: DimensionValue;
}

export interface DigitalAsset {
  asset_id: string;
  type: 'IMAGE' | 'SPEC_SHEET' | 'SDS' | 'MANUAL' | 'DRAWING';
  url?: string;
  object_key?: string;
  source: string;
  status: 'AVAILABLE' | 'MISSING';
}

export interface QualityBreakdown {
  classification: number;
  manufacturer: number;
  brand: number;
  lov: number;
  uom: number;
  descriptions: number;
  completeness: number;
  evidence: number;
}

export interface QualityScore {
  overall_score: number;
  breakdown?: QualityBreakdown;
  sub_scores?: Record<string, number>;
  status: 'EXCELLENT' | 'PASS' | 'NEEDS_REVIEW' | 'CRITICAL';
}

export interface ValidationRuleResult {
  rule_id: string;
  rule_name: string;
  target_field: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  status: 'PASS' | 'FAIL' | 'FIXED' | 'REVIEW';
  message: string;
  current_value?: string;
  expected_value?: string;
  auto_fix_available: boolean;
  auto_fix_result?: string;
}

export interface SourceEvidence {
  evidence_id: string;
  attribute_label: string;
  source_type: 'PDF_MANUAL' | 'MFR_WEBPAGE';
  source_url?: string;
  document_name?: string;
  page_number?: number;
  extracted_text: string;
  bounding_box?: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  confidence: number;
}

export interface AuditEventLog {
  timestamp: string;
  event_type: string;
  actor: string;
  description: string;
}

export interface Product {
  id: string;
  source: SourceData;
  source_data: SourceData;
  identity: ProductIdentity;
  classification: ClassificationData;
  content: ProductContent;
  features: string[];
  attributes: ProductAttribute[];
  commerce: CommerceData;
  dimensions: PackageDimensions;
  assets: DigitalAsset[];
  quality: QualityScore;
  validations: ValidationRuleResult[];
  evidence: SourceEvidence[];
  requires_review: boolean;
  is_demo_data?: boolean;
  audit_trail: AuditEventLog[];
}
