import { supabase } from '../lib/supabase';

/**
 * Upload an image to Supabase Storage.
 * Only called when detection = true.
 * @param {File|Blob} file - image file
 * @param {string|number} userId
 * @returns {Promise<string|null>} public URL or null on failure
 */
export async function uploadImage(file, userId) {
  const uid = userId || 'anonymous';
  const timestamp = Date.now();
  const ext = file.type?.includes('png') ? 'png' : 'jpg';
  const path = `${uid}/${timestamp}.${ext}`;

  console.log('[ReportService] Image upload starting:', { path, type: file.type, size: file.size });

  try {
    const { data, error } = await supabase.storage
      .from('report-images')
      .upload(path, file, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('[ReportService] ❌ Upload error:', error.message, error);
      return null;
    }

    console.log('[ReportService] ✅ Upload success:', data?.path || path);

    const { data: urlData } = supabase.storage
      .from('report-images')
      .getPublicUrl(path);

    const publicUrl = urlData?.publicUrl || null;
    console.log('[ReportService] Public URL:', publicUrl);
    return publicUrl;
  } catch (err) {
    console.error('[ReportService] ❌ Upload exception:', err.message);
    return null;
  }
}

/**
 * Save a report to the `reports` table.
 * ALWAYS saves — even if some fields are missing.
 *
 * @param {Object} data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function saveReport(data) {
  // Validate user_id
  if (!data.user_id) {
    console.warn('[ReportService] ⚠️ No user_id provided — report will save without user link');
  }

  const row = {
    detected: !!data.detected,
    snake_type: data.detected ? (data.snake_type || null) : null,
    confidence: data.detected ? (data.confidence || null) : null,
    risk_level: data.detected ? (data.risk_level || 'NONE') : 'NONE',
    image_url: data.detected ? (data.image_url || null) : null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    location_name: data.location_name || '',
    source: data.source || 'detection',
    symptoms: data.symptoms || '',
    severity: data.severity || 'LOW',
    user_id: data.user_id || null,
    created_at: new Date().toISOString(),
  };

  console.log('[ReportService] Inserting report:', {
    source: row.source,
    detected: row.detected,
    user_id: row.user_id,
    lat: row.latitude,
    lng: row.longitude,
    image_url: row.image_url ? '✅ has URL' : '❌ no URL',
  });

  try {
    const { data: insertedData, error } = await supabase
      .from('reports')
      .insert([row])
      .select();

    if (error) {
      console.error('[ReportService] ❌ Insert FAILED:', error.message, error.details, error.hint);
      return { success: false, error: error.message };
    }

    console.log('[ReportService] ✅ Report saved. ID:', insertedData?.[0]?.id);
    return { success: true, data: insertedData?.[0] };
  } catch (err) {
    console.error('[ReportService] ❌ Insert exception:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch all reports (for heatmap).
 * @param {number|null} userId - if provided, filter by user
 * @returns {Promise<Array>}
 */
export async function fetchReports(userId = null) {
  let query = supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[ReportService] Fetch error:', error);
    return [];
  }
  return data || [];
}

/**
 * Fetch user stats for profile.
 * @param {number} userId
 * @returns {Promise<{detections: number, sos: number}>}
 */
export async function fetchUserReportStats(userId) {
  const { data: det } = await supabase
    .from('reports')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('source', 'detection');

  const { data: sos } = await supabase
    .from('reports')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('source', 'sos');

  return {
    detections: det?.length || 0,
    sos: sos?.length || 0,
  };
}
