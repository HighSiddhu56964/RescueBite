import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useEmergency } from '../context/EmergencyContext';
import { supabase } from '../lib/supabase';
import { haversineKm, findNearest } from '../utils/haversine';
import { queueSOS } from '../utils/offlineQueue';
import { saveReport, fetchReports } from '../utils/reportService';
import { useAuth } from '../context/AuthContext';
import { fetchHospitalsDynamic, getAntivenomStatus } from '../utils/hospitalService';
import { useTranslation } from 'react-i18next';

export default function SOSPage() {
  const { t } = useTranslation();
  const { symptoms, severity, riskLevel, snakeType, confidence, resetEmergency } = useEmergency();
  const { user } = useAuth();
  const reactLocation = useLocation();
  const autoTriggerRef = useRef(false);

  const [location, setLocation] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [nearestFacility, setNearestFacility] = useState(null);
  const [recentDetection, setRecentDetection] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(reactLocation.search);
    if (params.get('auto') === 'true' && !autoTriggerRef.current) {
      autoTriggerRef.current = true;
      setShowConfirm(true); 
      // Auto-click the button after a slight delay to allow UI to visually render for the user
      setTimeout(() => {
        const btn = document.getElementById('btn-confirm');
        if (btn && !btn.disabled) btn.click();
      }, 1000);
    }
  }, [reactLocation.search]);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setGpsError('Geolocation not supported'); return; }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }); setGpsError(null); },
      (err) => { setGpsError(err.code === 1 ? 'Location access denied' : 'Unable to get location'); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (!location) return;
    const finalRiskLevel = riskLevel !== 'LOW' ? riskLevel : (recentDetection?.risk_level || 'LOW');
    fetchHospitalsDynamic(location.lat, location.lng, finalRiskLevel)
      .then(({ hospitals }) => {
        if (hospitals.length > 0) {
          const verified = hospitals.filter(h => getAntivenomStatus(h.tags?.name).color === '#22C55E');
          const targetHospitals = verified.length > 0 ? verified : hospitals;
          const result = findNearest(location.lat, location.lng, targetHospitals);
          if (result) {
            setNearestFacility({ name: result.item.tags?.name || (result.item.isManual ? 'Manual Hospital' : 'Nearest Facility'), lat: result.item.lat, lon: result.item.lon, distanceKm: result.distanceKm });
          }
        }
      })
      .catch((err) => { console.error("SOS fetch hospital error:", err); });
  }, [location, riskLevel, recentDetection]);

  useEffect(() => {
    async function getRecentDetection() {
      if (!user?.id) return;
      try {
        const reports = await fetchReports(user.id);
        const lastDetection = reports.find(r => r.detected === true && new Date(r.created_at).getTime() > Date.now() - 2 * 60 * 60 * 1000);
        if (lastDetection) setRecentDetection(lastDetection);
      } catch (err) { console.error("Failed to fetch recent detection for SOS", err); }
    }
    getRecentDetection();
  }, [user]);

  const openSMS = (lat, lng) => {
    const mapLink = lat != null ? `https://www.google.com/maps?q=${lat},${lng}` : 'Location unavailable';
    const severityText = severity !== 'LOW' ? `\nSeverity: ${severity}` : '';
    const phoneText = user?.phone ? `\nVictim Phone: ${user.phone}` : '';
    const symptomText = symptoms ? `\nSymptoms: ${symptoms.slice(0, 100)}` : '';
    const smsMessage = `🚨 Snakebite Emergency!\nLocation: ${mapLink}${phoneText}${severityText}${symptomText}\nNeed immediate help!`;
    window.location.href = `sms:?body=${encodeURIComponent(smsMessage)}`;
  };

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    const sendSOS = async (lat, lng) => {
      const finalSymptoms = symptoms || recentDetection?.symptoms || "";
      const finalSeverity = severity !== "LOW" ? severity : (recentDetection?.severity || "LOW");
      const finalRiskLevel = riskLevel !== "LOW" ? riskLevel : (recentDetection?.risk_level || "LOW");
      const finalSnakeType = snakeType || recentDetection?.snake_type || "Unknown";
      const data = { user_id: user?.id || null, user_phone: user?.phone || null, latitude: lat, longitude: lng, message: `Snakebite Emergency (Type: ${finalSnakeType})`, symptoms: finalSymptoms, severity: finalSeverity, risk_level: finalRiskLevel, assigned_facility: nearestFacility?.name || "Unknown", status: "pending", created_at: new Date().toISOString() };
      if (navigator.onLine) {
        try {
          const { error } = await supabase.from('emergencies').insert([data]);
          if (error) { console.error(error); alert("Failed to send SOS"); }
          else {
            try {
              const rptResult = await saveReport({ detected: true, snake_type: finalSnakeType === 'Unknown' ? null : finalSnakeType, confidence: confidence || recentDetection?.confidence || null, risk_level: finalRiskLevel, latitude: lat, longitude: lng, location_name: '', source: 'sos', symptoms: finalSymptoms, severity: finalSeverity, user_id: user?.id || null });
              if (rptResult.success) console.log('[SOS] ✅ Report also saved');
              else console.error('[SOS] ❌ Report save failed:', rptResult.error);
            } catch (rptErr) { console.error('[SOS] Report save exception:', rptErr); }
            setShowSuccess(true);
          }
        } catch (error) { console.error(error); alert("Failed to send SOS"); }
      } else { queueSOS(data); setShowSuccess(true); }
      setLoading(false);
      setShowConfirm(false);
      setTimeout(() => { openSMS(lat, lng); }, 500);
    };
    if (location) { await sendSOS(location.lat, location.lng); }
    else { navigator.geolocation.getCurrentPosition(async (pos) => await sendSOS(pos.coords.latitude, pos.coords.longitude), async () => await sendSOS(null, null), { enableHighAccuracy: true, timeout: 8000 }); }
  }, [location, symptoms, severity, riskLevel, nearestFacility]);

  const riskColor = {
    HIGH: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-zg-emergency' },
    MEDIUM: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600' },
    LOW: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-zg-success' },
  }[riskLevel] || { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-zg-success' };

  return (
    <div id="sos-page" className="fixed inset-0 flex flex-col items-center justify-center bg-zg-bg overflow-hidden">
      <button onClick={() => window.location.href = '/home'} className="absolute top-12 left-4 z-50 flex items-center gap-2 text-zg-text-secondary hover:text-zg-text text-sm font-bold bg-white px-3 py-1.5 rounded-full shadow-sm border border-zg-border">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        {t('app.back')}
      </button>
      {/* Animated radial pulse rings */}
      <div className="absolute w-[340px] h-[340px] rounded-full border-2 border-zg-emergency/10 animate-ping pointer-events-none" />
      <div className="absolute w-[260px] h-[260px] rounded-full bg-zg-emergency/5 blur-3xl pointer-events-none" />

      {/* Network status */}
      {!isOnline && (
        <div className="absolute top-4 left-4 right-4 z-40 animate-fade-in-up">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
            <span className="block w-2.5 h-2.5 rounded-full bg-zg-warning flex-shrink-0" />
            <p className="text-amber-700 text-xs font-semibold">{t('sos.noInternet')}</p>
          </div>
        </div>
      )}

      {/* Risk Level + Symptoms */}
      {(symptoms || riskLevel !== 'LOW') && (
        <div className="absolute top-16 left-4 right-4 z-30 animate-fade-in-up">
          <div className={`${riskColor.bg} border ${riskColor.border} rounded-2xl px-4 py-3`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-bold uppercase tracking-wider ${riskColor.text}`}>⚠ {t('sos.riskLevel')}: {riskLevel}</span>
              {nearestFacility && <span className="text-zg-text-secondary text-[10px]">🏥 ~{nearestFacility.distanceKm.toFixed(1)} km</span>}
            </div>
            {symptoms && <p className="text-zg-text-secondary text-[11px] leading-snug truncate mt-1">{t('sos.symptoms')}: {symptoms.slice(0, 80)}…</p>}
            {nearestFacility && <p className="text-zg-text-secondary text-[11px] mt-1">🏥 {t('sos.hospitalAssigned')}: {nearestFacility.name}</p>}
          </div>
        </div>
      )}

      {/* Header */}
      <p className="text-zg-emergency text-xs font-bold tracking-[0.3em] uppercase mb-8 animate-fade-in-up">
        {t('sos.emergencyMode')}
      </p>

      {/* SOS Button */}
      <button
        id="btn-sos"
        onClick={() => setShowConfirm(true)}
        className="relative w-48 h-48 rounded-full gradient-emergency text-white font-black text-2xl tracking-wide animate-sos-pulse transition-transform duration-150 active:scale-90 shadow-[0_0_60px_rgba(220,38,38,0.4)] flex items-center justify-center select-none border-4 border-white/20"
      >
        {t('sos.btnText')}
      </button>

      <p className="text-zg-text-muted text-xs mt-6 font-medium animate-fade-in-up">
        {t('sos.btnSub')}
      </p>

      {/* GPS Location Card */}
      <div className="absolute bottom-24 left-4 right-4 animate-fade-in-up">
        <div className="glass-strong rounded-2xl px-4 py-3 flex items-center gap-3 shadow-float">
          <div className="relative flex-shrink-0">
            <span className={`block w-3 h-3 rounded-full ${location ? 'bg-zg-success' : gpsError ? 'bg-zg-emergency' : 'bg-zg-warning'}`} />
            {location && <span className="absolute inset-0 w-3 h-3 rounded-full bg-zg-success animate-ping" />}
          </div>
          <div className="min-w-0 flex-1">
            {location ? (
              <>
                <p className="text-zg-text text-xs font-semibold">{t('sos.gpsLocked')}</p>
                <p className="text-zg-text-secondary text-[11px] font-mono truncate">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  <span className="text-zg-text-muted ml-1.5">±{Math.round(location.accuracy)}m</span>
                </p>
              </>
            ) : gpsError ? (
              <>
                <p className="text-zg-emergency text-xs font-semibold">{t('sos.gpsUnavailable')}</p>
                <p className="text-zg-text-secondary text-[11px]">{gpsError}</p>
              </>
            ) : (
              <>
                <p className="text-zg-warning text-xs font-semibold">{t('sos.gpsAcquiring')}</p>
                <p className="text-zg-text-secondary text-[11px]">{t('sos.gpsWaiting')}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6 animate-scale-in">
          <div className="w-full max-w-sm bg-zg-card rounded-3xl border border-zg-emergency/20 p-6 shadow-float-red text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-zg-emergency mb-1 tracking-wide">
              ⚠ {riskLevel !== 'LOW' ? `${riskLevel} RISK` : ''} 
            </h2>
            <p className="text-zg-text text-base font-semibold mb-1">{t('sos.confirmBtn')}</p>
            <p className="text-zg-text-secondary text-sm mb-2">{t('sos.confirmDesc')}</p>

            {(symptoms || nearestFacility) && (
              <div className="bg-zg-bg rounded-2xl p-3 mb-4 text-left space-y-1 border border-zg-border">
                {symptoms && <p className="text-zg-text-secondary text-[11px]"><span className="text-zg-text font-semibold">{t('sos.symptoms')}:</span> {symptoms.slice(0, 60)}…</p>}
                <p className="text-zg-text-secondary text-[11px]"><span className="text-zg-text font-semibold">Severity:</span> {severity}</p>
                {nearestFacility && <p className="text-zg-text-secondary text-[11px]"><span className="text-zg-text font-semibold">{t('sos.hospital')}:</span> {nearestFacility.name} (~{nearestFacility.distanceKm.toFixed(1)} km)</p>}
              </div>
            )}

            <div className="flex gap-3">
              <button id="btn-cancel" onClick={() => setShowConfirm(false)} disabled={loading}
                className="flex-1 py-3.5 rounded-2xl bg-zg-bg border border-zg-border text-zg-text-secondary font-semibold text-sm transition-all active:scale-[0.97]">
                {t('sos.cancel')}
              </button>
              <button id="btn-confirm" onClick={handleConfirm} disabled={loading}
                className="flex-1 py-3.5 rounded-2xl gradient-emergency text-white font-bold text-sm transition-all active:scale-[0.97] disabled:opacity-60 flex items-center justify-center gap-2 shadow-float-red">
                {loading ? (<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('sos.sending')}</>) : t('sos.yes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md px-6 animate-scale-in">
          <div className="w-full max-w-sm text-center animate-slide-up">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-zg-success/20 animate-ping" />
              <div className="relative w-24 h-24 rounded-full bg-emerald-50 border-2 border-zg-success flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-black text-zg-text mb-2">{t('sos.sentSuccess')}</h2>
            <p className="text-zg-success text-base font-semibold mb-2">{t('sos.helpOnWay')}</p>

            {nearestFacility && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2.5 mt-2 mb-2">
                <p className="text-zg-success text-xs font-semibold">🏥 {t('sos.hospitalAssigned')}: {nearestFacility.name}</p>
                <p className="text-zg-text-secondary text-[11px] mt-0.5">~{nearestFacility.distanceKm.toFixed(1)} km away</p>
              </div>
            )}

            {!isOnline && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 mt-4 mb-4">
                <p className="text-amber-700 text-xs font-semibold">{t('sos.offlineMode')}</p>
                <p className="text-zg-text-secondary text-[11px] mt-0.5">{t('sos.dataSync')}</p>
              </div>
            )}

            <p className="text-zg-text-secondary text-sm mt-3 mb-8">{t('sos.stayCalm')}</p>
            <button id="btn-close-success" onClick={() => { setShowSuccess(false); resetEmergency(); }}
              className="w-full py-3.5 rounded-2xl bg-zg-card border border-zg-border text-zg-text font-semibold text-sm transition-all active:scale-[0.97] shadow-float">
              {t('sos.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
