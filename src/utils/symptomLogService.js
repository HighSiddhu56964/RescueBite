import { supabase } from '../lib/supabase';

/**
 * Save a symptom checker session log.
 * @param {Object} data
 * @param {number} data.user_id
 * @param {Array} data.messages - chat message array [{role, content}]
 * @param {string} data.result - summary/diagnosis
 * @param {string} data.severity
 * @param {string} data.risk_level
 */
export async function saveSymptomLog(data) {
  if (!data.user_id) {
    console.warn('[SymptomLog] ⚠️ No user_id — skipping save');
    return { success: false, error: 'No user_id' };
  }

  const row = {
    user_id: data.user_id,
    messages: JSON.stringify(data.messages || []),
    result: data.result || '',
    severity: data.severity || 'LOW',
    risk_level: data.risk_level || 'LOW',
    created_at: new Date().toISOString(),
  };

  console.log('[SymptomLog] Saving log:', { user_id: row.user_id, msgCount: data.messages?.length });

  try {
    const { data: inserted, error } = await supabase
      .from('symptom_logs')
      .insert([row])
      .select();

    if (error) {
      console.error('[SymptomLog] ❌ Insert error:', error.message, error.details, error.hint);
      return { success: false, error: error.message };
    }

    console.log('[SymptomLog] ✅ Saved. ID:', inserted?.[0]?.id);
    return { success: true };
  } catch (err) {
    console.error('[SymptomLog] ❌ Exception:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch symptom logs for a specific user.
 * @param {number} userId
 * @returns {Promise<Array>}
 */
export async function fetchSymptomLogs(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('symptom_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[SymptomLog] Fetch error:', error);
    return [];
  }
  return data || [];
}
