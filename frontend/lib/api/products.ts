import { Product } from '../../types/product';
import { getActiveSessionId } from '../session';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

export async function fetchProducts(params?: {
  search?: string;
  quality_status?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: Product[]; total: number }> {
  try {
    const sessionId = getActiveSessionId();
    const query = new URLSearchParams();
    query.append('session_id', sessionId);
    if (params?.search) query.append('search', params.search);
    if (params?.quality_status) query.append('status', params.quality_status);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/sessions/${sessionId}/products?${query.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.items) {
        return data;
      }
    }
  } catch (e) {
    console.error('[API Error] fetchProducts failed:', e);
  }

  return { items: [], total: 0 };
}

export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const sessionId = getActiveSessionId();
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/products/${id}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('[API Error] fetchProducts failed:', e);
  }

  return null;
}

export async function reprocessProduct(id: string): Promise<Product | null> {
  try {
    const sessionId = getActiveSessionId();
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/products/${id}/process`, { method: 'POST' });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('[API Error] fetchProducts failed:', e);
  }

  return null;
}
