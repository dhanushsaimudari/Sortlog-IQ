const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';


let memorySessionId: string | null = null;

export function getActiveSessionId(): string {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('sortolog_session_id');
    if (stored) return stored;
  }
  return memorySessionId || 'sess-active';
}

export function setActiveSessionId(sessionId: string): void {
  const previous = memorySessionId;
  memorySessionId = sessionId;
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('sortolog_session_id', sessionId);
    if (previous !== sessionId) {
      window.dispatchEvent(new CustomEvent('session-changed', { detail: { sessionId } }));
    }
  }
}

export function notifyCatalogUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('catalog-updated', { detail: { sessionId: getActiveSessionId() } }));
  }
}

export async function initSession(): Promise<string> {
  try {
    const current = getActiveSessionId();
    const res = await fetch(`${API_BASE}/sessions/${current}`);
    if (res.ok) {
      const data = await res.json();
      setActiveSessionId(data.session_id);
      return data.session_id;
    }
  } catch (e) {}

  try {
    const res = await fetch(`${API_BASE}/sessions`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setActiveSessionId(data.session_id);
      return data.session_id;
    }
  } catch (e) {}

  return getActiveSessionId();
}

export async function createNewSession(seedDemo: boolean = false): Promise<string> {
  try {
    const current = getActiveSessionId();
    if (current) {
      await fetch(`${API_BASE}/sessions/${current}`, { method: 'DELETE' }).catch(() => {});
    }
    const res = await fetch(`${API_BASE}/sessions?seed_demo=${seedDemo}`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setActiveSessionId(data.session_id);
      return data.session_id;
    }
  } catch (e) {}

  const newId = `sess-${Math.random().toString(36).substring(2, 11)}`;
  setActiveSessionId(newId);
  return newId;
}

export async function clearCurrentSession(): Promise<void> {
  try {
    const current = getActiveSessionId();
    if (current) {
      await fetch(`${API_BASE}/sessions/${current}`, { method: 'DELETE' }).catch(() => {});
    }
  } catch (e) {}
  
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('sortolog_session_id');
  }
  memorySessionId = null;
  await createNewSession(false);
}
