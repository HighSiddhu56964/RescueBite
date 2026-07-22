import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmergency } from '../context/EmergencyContext';
import { getGuidance, SYMPTOM_CATALOG, getYoutubeEmbedUrl } from '../utils/guidanceEngine';
import SymptomSelector from '../components/SymptomSelector';

export default function GuidancePage() {
  const navigate = useNavigate();
  const {
    riskLevel, symptoms: contextSymptoms, snakeType, confidence, detectionDone,
    venomous, isSnakebite, selectedSymptoms: ctxSelectedSymptoms, updateEmergency,
  } = useEmergency();

  const [activeTab, setActiveTab] = useState('guidance');
  const [showSOSPopup, setShowSOSPopup] = useState(false);
  const [guidanceResult, setGuidanceResult] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSymptomSelector, setShowSymptomSelector] = useState(false);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  useEffect(() => {
    const hasSymptoms = (ctxSelectedSymptoms && ctxSelectedSymptoms.length > 0) || (contextSymptoms && contextSymptoms.trim().length > 0);
    if (detectionDone) {
      const labels = ctxSelectedSymptoms?.length > 0 ? ctxSelectedSymptoms : hasSymptoms ? extractSymptomsFromText(contextSymptoms) : [];
      resolveGuidance(labels); return;
    }
    if (hasSymptoms) resolveGuidance(ctxSelectedSymptoms || extractSymptomsFromText(contextSymptoms));
    else setShowSymptomSelector(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (guidanceResult?.severity === 'HIGH') {
      const timer = setTimeout(() => setShowSOSPopup(true), 600);
      return () => clearTimeout(timer);
    }
  }, [guidanceResult]);

  function extractSymptomsFromText(text) {
    if (!text) return [];
    const normalized = text.toLowerCase();
    return SYMPTOM_CATALOG.filter((s) => normalized.includes(s.label.toLowerCase()) || normalized.includes(s.id.replace(/_/g, ' '))).map((s) => s.label);
  }

  function resolveGuidance(symptomLabels) {
    const result = getGuidance({ symptoms: symptomLabels || [], risk_level: riskLevel || 'LOW', prediction: { isSnakebite: isSnakebite ?? false, venomous: venomous ?? null } });
    setGuidanceResult(result); setShowSymptomSelector(false);
    updateEmergency({ selectedSymptoms: symptomLabels || [] });
  }

  function handleSymptomSubmit(labels) { resolveGuidance(labels); }

  const severityConfig = guidanceResult
    ? {
        HIGH: { color: '#DC2626', bg: 'bg-red-50', border: 'border-red-200', icon: '🚨', label: 'CRITICAL' },
        MEDIUM: { color: '#F59E0B', bg: 'bg-amber-50', border: 'border-amber-200', icon: '⚠️', label: 'MODERATE' },
        LOW: { color: '#10B981', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '✅', label: 'LOW RISK' },
      }[guidanceResult.severity] || { color: '#10B981', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '✅', label: 'LOW RISK' }
    : { color: '#10B981', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '✅', label: 'ASSESS' };

  const accentColor = severityConfig.color;

  // ── Symptom Selection View ──
  if (showSymptomSelector && !guidanceResult) {
    return (
      <div id="guidance-page" className="fixed inset-0 bg-zg-bg overflow-y-auto pb-24">
        <div className="px-5 pt-14 pb-4 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-0.5" style={{ color: accentColor }}>Medical Guidance</p>
              <h1 className="text-2xl font-extrabold text-zg-text leading-tight">
                Emergency <span style={{ color: accentColor }}>Guide</span>
              </h1>
            </div>
            <button onClick={() => navigate('/sos')}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-2 transition-all active:scale-[0.95] bg-red-50 border border-red-200">
              <span className="text-sm">🚨</span>
              <span className="text-[10px] font-bold text-zg-emergency uppercase tracking-wider">SOS</span>
            </button>
          </div>
          {detectionDone && (
            <div className="mt-3 rounded-2xl px-4 py-2.5" style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}25` }}>
              <p className="text-zg-text-secondary text-xs">
                <span className="text-zg-text font-semibold">AI Detection: </span>
                <span style={{ color: accentColor, fontWeight: 700 }}>{snakeType || 'Unknown'}</span>
                {' '}({Math.round((confidence || 0) * 100)}% confidence)
              </p>
            </div>
          )}
        </div>
        <div className="px-5"><SymptomSelector onSubmit={handleSymptomSubmit} riskLevel={riskLevel || 'LOW'} /></div>
      </div>
    );
  }

  if (!guidanceResult) return null;

  const { guidance_text, dos, donts, severity, video, video_id, condition, matchScore, summary } = guidanceResult;
  const youtubeEmbedSrc = getYoutubeEmbedUrl(video_id ?? video?.id);
  const iframeTitle = (video?.title && String(video.title).slice(0, 120)) || 'First Aid Video';

  function renderFirstAidYoutubeIframe() {
    if (!isOnline) {
      return (
        <div className="rounded-2xl border border-zg-border bg-zg-bg px-4 py-8 text-center">
          <p className="text-zg-text text-sm font-semibold mb-1">Video unavailable</p>
          <p className="text-zg-text-secondary text-xs leading-relaxed">Follow the written instructions above, or connect to the internet to watch the guide.</p>
        </div>
      );
    }
    return (
      <iframe width="100%" height="200" src={youtubeEmbedSrc} title={iframeTitle} frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen referrerPolicy="strict-origin-when-cross-origin"
        className="w-full rounded-xl bg-black border border-zg-border" />
    );
  }

  return (
    <div id="guidance-page" className="fixed inset-0 bg-zg-bg overflow-y-auto pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 animate-fade-in-up">
        <button onClick={() => navigate('/home')} className="flex items-center gap-2 text-zg-text-secondary hover:text-zg-text text-sm font-bold mb-4 bg-white px-3 py-1.5 rounded-full shadow-sm w-max border border-zg-border">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Back to Home
        </button>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-0.5" style={{ color: accentColor }}>Medical Guidance</p>
            <h1 className="text-2xl font-extrabold text-zg-text leading-tight">Emergency <span style={{ color: accentColor }}>Guide</span></h1>
          </div>
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}40` }}>
            <span className="text-sm">{severityConfig.icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>{severityConfig.label}</span>
          </div>
        </div>

        {detectionDone && (
          <div className="mt-3 rounded-2xl px-4 py-2.5" style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}25` }}>
            <p className="text-zg-text-secondary text-xs">
              <span className="text-zg-text font-semibold">AI Detection: </span>
              <span style={{ color: accentColor, fontWeight: 700 }}>{snakeType || 'Unknown'}</span>
              {' '}({Math.round((confidence || 0) * 100)}% confidence)
            </p>
            {ctxSelectedSymptoms && ctxSelectedSymptoms.length > 0 && (
              <p className="text-zg-text-secondary text-[11px] mt-1 truncate">Symptoms: {ctxSelectedSymptoms.join(', ').slice(0, 80)}</p>
            )}
          </div>
        )}
      </div>

      {/* SOS + Re-assess */}
      <div className="px-5 mb-4 animate-fade-in-up">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/sos')}
            className="relative flex flex-col items-center justify-center gap-2 py-5 rounded-3xl font-bold text-sm transition-all active:scale-[0.96] overflow-hidden"
            style={{
              background: severity === 'HIGH' ? 'linear-gradient(135deg, #DC2626, #F97316)' : 'rgba(220,38,38,0.08)',
              border: severity === 'HIGH' ? '2px solid rgba(255,255,255,0.2)' : '2px solid rgba(220,38,38,0.3)',
              boxShadow: severity === 'HIGH' ? '0 0 30px rgba(220,38,38,0.4)' : 'none',
              color: severity === 'HIGH' ? '#fff' : '#DC2626',
            }}>
            {severity === 'HIGH' && <div className="absolute inset-0 bg-red-600/20 animate-ping pointer-events-none rounded-3xl" />}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="relative z-10">🚨 Send SOS</span>
          </button>

          <button onClick={() => { setShowSymptomSelector(true); setGuidanceResult(null); }}
            className="flex flex-col items-center justify-center gap-2 py-5 rounded-3xl font-bold text-sm transition-all active:scale-[0.96] bg-zg-card border-2 border-zg-border text-zg-text-secondary shadow-float">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>
            <span>Re-assess</span>
          </button>
        </div>
      </div>

      {/* Immediate Alert for HIGH */}
      {severity === 'HIGH' && (
        <div className="px-5 mb-4 animate-fade-in-up">
          <div className="rounded-3xl px-4 py-3.5 flex items-center gap-3 bg-red-50 border-2 border-red-200" style={{ animation: 'guidanceAlertPulse 2s ease-in-out infinite' }}>
            <span className="text-2xl flex-shrink-0" style={{ animation: 'guidanceSOSPulse 1s infinite' }}>🚨</span>
            <div>
              <p className="text-zg-emergency text-sm font-black">Immediate medical attention required</p>
              <p className="text-zg-emergency/70 text-xs mt-0.5">Call 112 or get to a hospital NOW</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Selector */}
      <div className="px-5 mb-4">
        <div className="flex bg-zg-card border border-zg-border rounded-2xl p-1 gap-1 shadow-float">
          {[
            { key: 'guidance', label: '🏥 First Aid' },
            { key: 'video', label: '🎬 Video' },
            { key: 'dosdonts', label: "📋 Do's & Don'ts" },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: activeTab === tab.key ? `${accentColor}15` : 'transparent',
                color: activeTab === tab.key ? accentColor : '#94A3B8',
                border: activeTab === tab.key ? `1px solid ${accentColor}30` : '1px solid transparent',
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="px-5 animate-fade-in-up">
        {/* GUIDANCE TAB */}
        {activeTab === 'guidance' && (
          <div className="space-y-4">
            <div className="rounded-3xl p-4" style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}>
              <p className="text-zg-text-secondary text-sm leading-relaxed">{severityConfig.icon} {summary}</p>
              <div className="flex items-center gap-3 mt-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}30` }}>
                  Severity: {severity}
                </span>
                <span className="text-zg-text-secondary text-[10px]">Condition: {condition.replace(/_/g, ' ')}</span>
              </div>
            </div>

            <div className="bg-zg-card rounded-3xl border border-zg-border p-4 shadow-float">
              <h3 className="text-zg-text text-sm font-bold mb-3 flex items-center gap-2"><span>🏥</span> Step-by-Step First Aid</h3>
              <div className="space-y-2.5">
                {guidance_text.map((item) => (
                  <div key={item.step} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black" style={{ background: `${accentColor}20`, color: accentColor }}>{item.step}</div>
                    <p className="text-zg-text-secondary text-[13px] leading-snug pt-1">{item.text}</p>
                  </div>
                ))}
              </div>
              {severity === 'HIGH' && (
                <button onClick={() => { window.location.href = 'tel:112'; }}
                  className="w-full mt-4 py-3.5 rounded-2xl gradient-emergency text-white font-black text-sm shadow-float-red transition-all active:scale-[0.96]" style={{ animation: 'guidanceSOSPulse 1.5s ease-in-out infinite' }}>
                  🆘 Call 112 — Emergency
                </button>
              )}
            </div>

            <div className="bg-zg-card rounded-3xl border border-zg-border overflow-hidden p-4 shadow-float">
              <h3 className="text-zg-text text-sm font-bold mb-2 flex items-center gap-2"><span>🎬</span> Watch First Aid Guide</h3>
              <p className="text-zg-text-secondary text-xs mb-3">Short clip matched to your risk level.</p>
              {renderFirstAidYoutubeIframe()}
              {isOnline && video?.title && <p className="text-zg-text-secondary text-[11px] mt-2 leading-snug">{video.title}</p>}
            </div>
          </div>
        )}

        {/* VIDEO TAB */}
        {activeTab === 'video' && (
          <div className="space-y-4">
            <div className="rounded-3xl p-4" style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}>
              <h3 className="text-zg-text text-sm font-bold flex items-center gap-2 mb-1"><span>🎬</span> Watch First Aid Guide</h3>
              <p className="text-zg-text-secondary text-xs">Short educational video matched to your condition</p>
            </div>
            {isOnline ? (
              <div className="bg-zg-card rounded-3xl border border-zg-border overflow-hidden p-4 shadow-float">
                {renderFirstAidYoutubeIframe()}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${accentColor}15`, color: accentColor }}>{condition.replace(/_/g, ' ')}</span>
                    <span className="text-zg-text-secondary text-[10px]">{video?.channel}</span>
                  </div>
                  <p className="text-zg-text text-sm font-semibold mt-1">{video?.title}</p>
                </div>
              </div>
            ) : (
              <div className="bg-zg-card rounded-3xl border border-zg-border p-6 text-center shadow-float">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-zg-bg flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="1" y1="1" x2="23" y2="23" /><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" /><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" /><path d="M10.71 5.05A16 16 0 0 1 22.56 9" /><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
                  </svg>
                </div>
                <p className="text-zg-text text-sm font-semibold mb-1">Video unavailable</p>
                <p className="text-zg-text-secondary text-xs leading-relaxed">Connect to the internet to watch the guide.</p>
              </div>
            )}
          </div>
        )}

        {/* DO'S & DON'TS TAB */}
        {activeTab === 'dosdonts' && (
          <div className="space-y-4">
            <div className="bg-emerald-50 rounded-3xl border border-emerald-200 p-4">
              <h3 className="text-zg-success text-sm font-bold mb-3 flex items-center gap-2"><span>✅</span> DO's</h3>
              <div className="space-y-2">
                {dos.map((item, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <span className="text-zg-success text-xs mt-0.5 flex-shrink-0">✓</span>
                    <p className="text-zg-text-secondary text-[13px] leading-snug">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-red-50 rounded-3xl border border-red-200 p-4">
              <h3 className="text-zg-emergency text-sm font-bold mb-3 flex items-center gap-2"><span>🚫</span> DON'Ts</h3>
              <div className="space-y-2">
                {donts.map((item, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <span className="text-zg-emergency text-xs mt-0.5 flex-shrink-0">✗</span>
                    <p className="text-zg-text-secondary text-[13px] leading-snug">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            {(severity === 'HIGH' || severity === 'MEDIUM') && (
              <div className="bg-red-50 border border-red-200 rounded-3xl p-4 text-center">
                <p className="text-zg-emergency text-sm font-bold mb-2">🚨 Need immediate help?</p>
                <button onClick={() => navigate('/sos')}
                  className="w-full py-3.5 rounded-2xl gradient-emergency text-white font-black text-sm shadow-float-red transition-all active:scale-[0.96]">
                  TRIGGER SOS NOW
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CRITICAL SOS POPUP */}
      {showSOSPopup && severity === 'HIGH' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
          <div className="w-full max-w-sm rounded-3xl p-6 text-center bg-zg-card border-2 border-red-200 shadow-float-red" style={{ animation: 'guidancePopupIn 0.3s ease-out' }}>
            <div className="text-5xl mb-4" style={{ animation: 'guidanceSOSPulse 1s infinite' }}>🚨</div>
            <h2 className="text-xl font-black text-zg-emergency mb-2">CRITICAL — IMMEDIATE SOS</h2>
            <p className="text-zg-text-secondary text-sm mb-2 leading-relaxed">
              High-risk venomous snakebite detected. <strong className="text-zg-text">Send emergency SOS now</strong> and get to the nearest hospital with antivenom.
            </p>
            {detectionDone && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-2.5 mt-3 mb-4 text-left">
                <p className="text-[11px] text-zg-text-secondary"><span className="text-zg-text font-semibold">Detection:</span> <span className="text-zg-emergency font-bold">{snakeType}</span> ({Math.round((confidence || 0) * 100)}%)</p>
                {ctxSelectedSymptoms && ctxSelectedSymptoms.length > 0 && (
                  <p className="text-[11px] text-zg-text-secondary mt-1"><span className="text-zg-text font-semibold">Symptoms:</span> {ctxSelectedSymptoms.join(', ').slice(0, 60)}</p>
                )}
              </div>
            )}
            <button onClick={() => { setShowSOSPopup(false); navigate('/sos'); }}
              className="w-full py-4 rounded-2xl gradient-emergency text-white font-black text-base transition-all active:scale-[0.96] shadow-float-red">
              🚨 SEND SOS NOW
            </button>
            <button onClick={() => setShowSOSPopup(false)}
              className="w-full py-3 mt-3 rounded-2xl text-zg-text-secondary font-semibold text-sm border border-zg-border transition-all active:scale-[0.97]">
              View Guidance First
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes guidanceSOSPulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220,38,38,0.5); } 50% { transform: scale(1.03); box-shadow: 0 0 30px rgba(220,38,38,0.3); } }
        @keyframes guidancePopupIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes guidanceAlertPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.3); } 50% { box-shadow: 0 0 20px rgba(220,38,38,0.15); } }
      `}</style>
    </div>
  );
}
