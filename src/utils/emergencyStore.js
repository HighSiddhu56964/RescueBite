/** Local SOS persistence when Supabase is unavailable or insert fails (demo / offline). */
const KEY = 'snakesafe_local_emergencies';

export function saveLocalEmergency(record) {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const row = {
    ...record,
    id,
    _localOnly: true,
    created_at: record.created_at || new Date().toISOString(),
  };
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    list.unshift(row);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200)));
    window.dispatchEvent(new CustomEvent('snakesafe-local-sos', { detail: row }));
  } catch (e) {
    console.error('saveLocalEmergency:', e);
  }
  return row;
}

export function updateLocalEmergency(id, updates) {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates };
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function getLocalEmergencies() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

/** Merge remote rows with local-only rows (dedupe by id). */
export function mergeEmergencies(remote, local) {
  const remoteArr = Array.isArray(remote) ? remote : [];
  const localArr = Array.isArray(local) ? local : [];
  const ids = new Set(remoteArr.map((r) => r.id).filter(Boolean));
  const merged = [...remoteArr];
  for (const l of localArr) {
    if (l?.id && !ids.has(l.id)) {
      merged.push(l);
      ids.add(l.id);
    }
  }
  return merged.sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );
}
