import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { saveLocalEmergency } from './emergencyStore';

function buildFullPayload(row) {
  return {
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    message: row.message || 'Snakebite Emergency',
    symptoms: row.symptoms || null,
    severity: row.severity || 'LOW',
    risk_level: row.risk_level || 'LOW',
    snake_type: row.snake_type || null,
    confidence:
      row.confidence === undefined || row.confidence === null
        ? null
        : Number(row.confidence),
    assigned_facility: row.assigned_facility || null,
    status: row.status || 'pending',
  };
}

function buildMinimalPayload(row) {
  const p = buildFullPayload(row);
  const messageParts = [
    p.message,
    p.symptoms && `Symptoms: ${p.symptoms}`,
    p.risk_level && `Risk: ${p.risk_level}`,
    p.snake_type && `Snake: ${p.snake_type}`,
    p.severity && p.severity !== 'LOW' && `Severity: ${p.severity}`,
  ].filter(Boolean);
  return {
    latitude: p.latitude,
    longitude: p.longitude,
    message: messageParts.join(' — ') || 'Snakebite Emergency',
    status: 'pending',
  };
}

/**
 * Submit SOS to Supabase; on failure fall back to localStorage so dashboard/map can still show it.
 * Omits client-side created_at (let DB default) to avoid conflicts.
 */
export async function submitEmergency(row) {
  const payload = buildFullPayload(row);

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('emergencies')
      .insert([payload])
      .select('id')
      .maybeSingle();

    if (!error) {
      return { ok: true, source: 'remote', id: data?.id };
    }

    console.error('Supabase insert (full) failed:', error.message, error);

    const minimal = buildMinimalPayload(row);
    const r2 = await supabase
      .from('emergencies')
      .insert([minimal])
      .select('id')
      .maybeSingle();

    if (!r2.error) {
      return { ok: true, source: 'remote', id: r2.data?.id };
    }

    console.error('Supabase insert (minimal) failed:', r2.error.message, r2.error);
  } else {
    console.warn('Supabase not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Using local SOS store.');
  }

  const localRow = saveLocalEmergency({
    ...payload,
    created_at: new Date().toISOString(),
  });
  return {
    ok: true,
    source: 'local',
    id: localRow.id,
    usedLocalFallback: true,
  };
}
