import { getActiveSessionId } from '../session';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

export async function fetchEvidenceByProduct(productId: string): Promise<any[]> {
  try {
    const sessionId = getActiveSessionId();
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/products/${productId}/evidence`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}

  return [];
}
