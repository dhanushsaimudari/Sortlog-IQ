export interface ReviewItem {
  review_id: string;
  product_id: string;
  mfg_part_num: string;
  product_name: string;
  field_name: string;
  field?: string;
  issue_type: string;
  severity: 'WARNING' | 'ERROR' | 'CRITICAL';
  current_value: string;
  suggested_value: string;
  reason: string;
  quality_score: number;
  status: 'OPEN' | 'APPROVED' | 'REJECTED' | 'FIXED';
  assigned_to?: string;
  reviewed_at?: string;
  is_demo_data?: boolean;
}
