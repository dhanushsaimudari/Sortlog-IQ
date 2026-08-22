export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  items: T[];
}

export interface UploadJobResponse {
  job_id: string;
  filename?: string;
  status: 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  stage?: string;
  progress?: number;
  total_rows?: number;
  processed_rows?: number;
  error_count?: number;
  error?: string | null;
  total_records: number;
  processed_records: number;
  failed_records: number;
  started_at?: string;
  is_demo_data?: boolean;
}

export interface ExportResponse {
  export_id: string;
  file_name: string;
  total_exported: number;
  download_url: string;
}
