import { getActiveSessionId } from '../session';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

export async function exportSessionCsv(): Promise<{ success: boolean; message?: string }> {
  try {
    const sessionId = getActiveSessionId();
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/export`, {
      method: 'POST',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      const msg = errData?.detail || `Export failed with status ${res.status}`;
      return { success: false, message: msg };
    }

    const blob = await res.blob();
    if (blob.size === 0) {
      return { success: false, message: "Exported CSV is empty." };
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sortolog_Session_${sessionId}_Unilog_Delivery_252_Cols.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    return { success: true };
  } catch (err: any) {
    console.error("Export error:", err);
    return { success: false, message: err?.message || "Network error during CSV export." };
  }
}
