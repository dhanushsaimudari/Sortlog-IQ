import { getActiveSessionId } from '../session';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

export async function triggerEvaluationRun(): Promise<any> {
  try {
    const sessionId = getActiveSessionId();
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/evaluation/run`, { method: 'POST' });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('[API Error] evaluation API call failed:', e);
  }

  return null;
}

export async function fetchEvaluationResults(): Promise<any> {
  try {
    const sessionId = getActiveSessionId();
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/evaluation`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('[API Error] evaluation API call failed:', e);
  }

  return null;
}

export const runEvaluationApi = triggerEvaluationRun;
export const fetchLatestEvaluationApi = fetchEvaluationResults;
