import { ReviewItem } from '../../types/review';
import { getActiveSessionId } from '../session';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

export async function fetchReviewItems(): Promise<ReviewItem[]> {
  try {
    const sessionId = getActiveSessionId();
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/reviews?status=PENDING`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (e) {
    console.error('[API Error] reviews API call failed:', e);
  }

  return [];
}

export async function approveReviewItem(reviewId: string): Promise<ReviewItem | null> {
  try {
    const sessionId = getActiveSessionId();
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/reviews/${reviewId}/approve`, { method: 'POST' });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('[API Error] reviews API call failed:', e);
  }

  return null;
}

export async function rejectReviewItem(reviewId: string): Promise<ReviewItem | null> {
  try {
    const sessionId = getActiveSessionId();
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/reviews/${reviewId}/reject`, { method: 'POST' });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('[API Error] reviews API call failed:', e);
  }

  return null;
}

export async function autofixReviewItem(reviewId: string): Promise<ReviewItem | null> {
  try {
    const sessionId = getActiveSessionId();
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/reviews/${reviewId}/autofix`, { method: 'POST' });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('[API Error] reviews API call failed:', e);
  }

  return null;
}
