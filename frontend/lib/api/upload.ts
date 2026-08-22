import { UploadJobResponse } from '../../types/api';
import { getActiveSessionId } from '../session';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

export async function uploadCatalogFile(
  file: File,
  onProgress?: (status: UploadJobResponse) => void,
): Promise<UploadJobResponse> {
  const sessionId = getActiveSessionId();
  const formData = new FormData();
  formData.append('file', file);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/sessions/${sessionId}/import`, {
      method: 'POST',
      body: formData,
    });
  } catch (err: any) {
    throw new Error("Backend unavailable. Please make sure the SORTOLOG IQ backend API is running.");
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(errorData.detail || errorData.message || `Upload failed with HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.job_id) throw new Error('Backend did not return an import job ID.');

  for (; ;) {
    const status = await checkUploadProgress(data.job_id);
    onProgress?.(status);
    if (status.status === 'COMPLETED' || status.status === 'FAILED') return status;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

export async function checkUploadProgress(jobId: string): Promise<UploadJobResponse> {
  const sessionId = getActiveSessionId();
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/imports/${jobId}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `Could not read import status (HTTP ${res.status})`);
  return {
    ...data,
    total_records: data.total_rows || 0,
    processed_records: data.processed_rows || 0,
    failed_records: data.error_count || 0,
  };
}
