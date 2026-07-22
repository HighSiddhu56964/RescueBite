import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmergency } from '../context/EmergencyContext';
import { useSnakeDetection } from '../utils/useSnakeDetection';
import { useLocation } from '../utils/useLocation';
import { saveReport, uploadImage } from '../utils/reportService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useTranslation } from 'react-i18next';

const FIRST_AID = {
  HIGH: {
    title: '🚨 EMERGENCY — Venomous Bite Protocol',
    titleColor: 'text-zg-emergency',
    borderColor: 'border-red-200',
    bgColor: 'bg-red-50',
    steps: ['Keep the person CALM and STILL — movement spreads venom faster','Immobilize the bitten limb at or BELOW heart level','Remove watches, rings, tight clothing near bite','Mark the edge of swelling with a pen and note the time','Do NOT cut, suck, apply tourniquet, or use ice','Call 112 immediately and transport to nearest hospital with antivenom'],
  },
  MEDIUM: {
    title: '⚠️ Caution — Possible Venomous Bite',
    titleColor: 'text-amber-600',
    borderColor: 'border-amber-200',
    bgColor: 'bg-amber-50',
    steps: ['Treat as venomous until confirmed otherwise','Keep the person calm and the limb immobilized','Do NOT wait for symptoms — seek hospital care now','Bring a photo of the snake if possible (do not catch it)'],
  },
  LOW: {
    title: '✅ Non-Venomous Bite — Low Risk',
    titleColor: 'text-zg-success',
    borderColor: 'border-emerald-200',
    bgColor: 'bg-emerald-50',
    steps: ['Wash wound thoroughly with soap and water for 5 minutes','Apply antiseptic and cover with clean bandage','Monitor for signs of infection over 24–48 hours','Visit a doctor for tetanus shot if not updated in 5 years'],
  },
};

export default function DetectPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updateEmergency } = useEmergency();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { location: gpsLocation, locationName } = useLocation();
  const { modelReady, loading: modelLoading, loadingMsg, error: modelError, loadModel, predict } = useSnakeDetection();

  const [appState, setAppState] = useState('LOADING');
  const [result, setResult] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [error, setError] = useState('');
  const [inputKey, setInputKey] = useState(0);
  const [analyzeMsg, setAnalyzeMsg] = useState('Analyzing image…');
  const [reportSaved, setReportSaved] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);
  const lastFileRef = useRef(null);

  useEffect(() => { loadModel(); return () => stopCamera(); }, [loadModel]);
  useEffect(() => {
    if (modelReady && appState === 'LOADING') setAppState('READY');
    if (modelError && appState === 'LOADING') { setError(modelError); setAppState('ERROR'); }
  }, [modelReady, modelError, appState]);

  const pushToContext = useCallback(async (res, imageFile) => {
    const snakeType = res.venomous === true ? 'Venomous' : res.venomous === false ? 'Non-Venomous' : null;
    updateEmergency({ isSnakebite: res.is_snakebite, venomous: res.venomous, riskLevel: res.risk_level, severity: res.risk_level, confidence: res.confidence, snakeType, rawClass: res.raw_class, detectionDone: true });
    let imageUrl = null;
    if (res.is_snakebite && imageFile) { imageUrl = await uploadImage(imageFile, user?.id || 'anon'); }
    const reportResult = await saveReport({ detected: res.is_snakebite, snake_type: res.raw_class || snakeType, confidence: res.confidence, risk_level: res.risk_level, image_url: imageUrl, latitude: gpsLocation?.lat || null, longitude: gpsLocation?.lng || null, location_name: locationName || '', source: 'detection', user_id: user?.id || null });
    setReportSaved(true);
    return reportResult;
  }, [updateEmergency, gpsLocation, locationName, user]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file (JPEG, PNG, WebP).'); setAppState('ERROR'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('File too large. Max 10 MB.'); setAppState('ERROR'); return; }
    const objectURL = URL.createObjectURL(file);
    setPreviewSrc(objectURL); setAppState('ANALYZING'); setAnalyzeMsg('Analyzing image…');
    try {
      const res = await new Promise((resolve, reject) => { const img = new Image(); img.onload = async () => { try { resolve(await predict(img)); } catch (err) { reject(err); } }; img.onerror = () => reject(new Error('Failed to load image')); img.src = objectURL; });
      setResult(res); const rpt = await pushToContext(res, file);
      if (rpt?.success) showToast('✅ Report saved successfully'); else if (rpt?.error) showToast('❌ ' + rpt.error, 'error');
      setAppState('RESULTS');
    } catch (err) { console.error('Analysis failed:', err); setError('Analysis failed: ' + (err.message || 'Unknown error')); setAppState('ERROR'); }
    setInputKey((k) => k + 1);
  }

  async function startCamera() {
    setAppState('CAMERA');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } });
      streamRef.current = stream;
      requestAnimationFrame(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(console.error); } });
    } catch (err) { setError(`Camera error: ${err.message}`); setAppState('ERROR'); }
  }

  function stopCamera() { if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; } if (videoRef.current) videoRef.current.srcObject = null; }

  async function captureFromCamera() {
    const video = videoRef.current;
    if (!video || video.readyState < 2) { setError('Camera not ready.'); return; }
    setAppState('ANALYZING'); setAnalyzeMsg('Analyzing capture…');
    try { const c = document.createElement('canvas'); c.width = video.videoWidth; c.height = video.videoHeight; c.getContext('2d').drawImage(video, 0, 0); setPreviewSrc(c.toDataURL('image/jpeg', 0.8)); } catch (_) {}
    try {
      const res = await predict(video); stopCamera(); setResult(res);
      let captureBlob = null;
      if (res.is_snakebite) { try { const c2 = document.createElement('canvas'); c2.width = video.videoWidth; c2.height = video.videoHeight; c2.getContext('2d').drawImage(video, 0, 0); captureBlob = await new Promise(r => c2.toBlob(r, 'image/jpeg', 0.8)); } catch (_) {} }
      await pushToContext(res, captureBlob); showToast('✅ Report saved successfully'); setAppState('RESULTS');
    } catch (err) { console.error('Capture failed:', err); setError('Capture failed: ' + err.message); setAppState('ERROR'); }
  }

  function resetAll() { setResult(null); setPreviewSrc(null); setError(''); stopCamera(); setAppState('READY'); }
  function goToSOS() { navigate('/sos'); }
  function goToSymptoms() { navigate('/symptoms'); }
  function goToGuidance() { navigate('/guidance'); }

  /* ── Render States ── */
  function renderLoading() {
    return (
      <div className="flex flex-col items-center justify-center gap-5 pt-32 animate-fade-in-up">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 border-2 border-zg-indigo/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-transparent border-t-zg-indigo rounded-full animate-spin" />
        </div>
        <p className="text-zg-text text-sm font-medium">{loadingMsg || 'Initializing AI…'}</p>
        <p className="text-zg-text-secondary text-xs">This may take a moment on first load</p>
      </div>
    );
  }

  function renderReady() {
    return (
      <div className="animate-fade-in-up flex flex-col gap-3 pt-0 relative z-10 w-full max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-4">
          <button onClick={startCamera}
            className="relative overflow-hidden flex flex-col items-center justify-center gap-2 py-6 rounded-[28px] bg-[#295b36] shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-4px_10px_rgba(0,0,0,0.3),0_15px_30px_rgba(41,91,54,0.4)] border border-[#1b4332]/50 group transition-transform active:scale-95">
            {/* Texture overlay */}
            <div className="absolute inset-0 opacity-[0.25] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'}}></div>
            {/* Glassy Camera Icon Ring */}
            <div className="w-[52px] h-[40px] rounded-xl border-t-2 border-l-2 border-white/40 bg-white/10 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2),0_4px_10px_rgba(0,0,0,0.2)] backdrop-blur-md flex items-center justify-center relative z-10 mb-1 pointer-events-none">
               <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
            </div>
            <span className="relative z-10 font-bold text-sm tracking-wide text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">{t('detect.camera')}</span>
          </button>
          
          <label className="relative overflow-hidden flex flex-col items-center justify-center gap-2 py-6 rounded-[28px] bg-[#f4f7f5] shadow-[inset_0_2px_8px_rgba(255,255,255,1),inset_0_-4px_10px_rgba(0,0,0,0.05),0_15px_30px_rgba(0,0,0,0.05)] border border-white group cursor-pointer transition-transform active:scale-95">
            {/* Texture overlay */}
            <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'}}></div>
            {/* Glassy Upload Icon Ring */}
            <div className="w-[52px] h-[40px] rounded-xl border-t-2 border-l-2 border-white bg-black/5 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.05),0_4px_10px_rgba(0,0,0,0.05)] flex items-center justify-center relative z-10 mb-1 pointer-events-none">
               <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9d8665" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            </div>
            <span className="relative z-10 font-bold text-sm tracking-wide text-[#11311b]/80">{t('detect.upload')}</span>
            <input key={inputKey} ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
          </label>
        </div>

        <p className="text-[#11311b]/70 text-[13px] font-medium text-center drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] mt-1 mb-0.5">{t('detect.captureText')}</p>

        <div className="relative overflow-hidden rounded-[32px] border-t-2 border-l-2 border-white/60 bg-white/30 backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.05)] px-4 py-3 z-10 mb-28">
          {/* Subtle audio waveform background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
             <svg width="100%" height="80" viewBox="0 0 300 80" preserveAspectRatio="none">
                <path d="M0,40 Q15,10 30,40 T60,40 T90,40 T120,40 T150,40 T180,40 T210,40 T240,40 T270,40 T300,40" fill="none" stroke="white" strokeWidth="2" className="animate-pulse" />
                <path d="M0,40 Q15,70 30,40 T60,40 T90,40 T120,40 T150,40 T180,40 T210,40 T240,40 T270,40 T300,40" fill="none" stroke="white" strokeWidth="1.5" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
             </svg>
          </div>
          
          <div className="relative z-10 flex flex-col gap-2.5">
            {[
              { icon: '🐍', label: t('detect.biteDet'), desc: "Identify if it's a snakebite" },
              { icon: '⚠️', label: t('detect.venomDet'), desc: 'Venomous vs non-venomous classification' },
              { icon: '💊', label: t('detect.firstAid'), desc: 'Risk-specific treatment steps' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/50 backdrop-blur-md border border-white/70 rounded-[20px] px-5 py-4 shadow-[inset_0_2px_5px_rgba(255,255,255,0.8),0_4px_10px_rgba(0,0,0,0.02)] transition-colors relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div>
                {/* Image-based 3D emoji representations (using standard emoji but styled to look embossed) */}
                <span className="text-2xl flex-shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)] relative z-10">{item.icon}</span>
                <div className="min-w-0 relative z-10">
                  <p className="text-[#11311b] text-[15px] font-black tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">{item.label}</p>
                  <p className="text-[#11311b]/70 text-[12px] font-medium leading-tight mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderCamera() {
    return (
      <div className="animate-fade-in-up space-y-3 pt-4">
        <div className="relative rounded-3xl overflow-hidden border-2 border-zg-indigo bg-black shadow-float-indigo">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-[300px] object-cover block bg-black" />
          <div className="detect-scan-line" />
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => {
            const [v, h] = pos.split('-');
            return (<div key={pos} className="absolute w-7 h-7" style={{ [v]: 12, [h]: 12, [`border${v.charAt(0).toUpperCase() + v.slice(1)}`]: '3px solid #6366F1', [`border${h.charAt(0).toUpperCase() + h.slice(1)}`]: '3px solid #6366F1' }} />);
          })}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-zg-indigo px-3 py-1 rounded-full text-[11px] font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zg-indigo detect-live-pulse" />LIVE FEED
          </div>
        </div>
        <button onClick={captureFromCamera} className="w-full py-4 rounded-2xl gradient-indigo text-white font-bold text-base flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] shadow-float-indigo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="22" y1="12" x2="18" y2="12" /><line x1="6" y1="12" x2="2" y2="12" /><line x1="12" y1="6" x2="12" y2="2" /><line x1="12" y1="22" x2="12" y2="18" /></svg>
          Capture & Analyze
        </button>
        <button onClick={() => { stopCamera(); setAppState('READY'); }} className="w-full py-3 rounded-2xl bg-zg-card border border-zg-border text-zg-text-secondary font-semibold text-sm transition-all active:scale-[0.97]">
          Cancel
        </button>
      </div>
    );
  }

  function renderAnalyzing() {
    return (
      <div className="animate-fade-in-up flex flex-col items-center gap-5 pt-6">
        {previewSrc ? (
          <div className="relative w-full max-w-[340px] rounded-3xl overflow-hidden border border-zg-border shadow-float">
            <img src={previewSrc} alt="Preview" className="w-full aspect-[4/3] object-cover block opacity-50" />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zg-bg/70 backdrop-blur-md">
              <div className="relative w-11 h-11 mb-3">
                <div className="absolute inset-0 border-2 border-zg-indigo/20 rounded-full" />
                <div className="absolute inset-0 border-2 border-transparent border-t-zg-indigo rounded-full animate-spin" />
              </div>
              <p className="text-zg-text text-sm font-medium">{analyzeMsg}</p>
            </div>
          </div>
        ) : (
          <div className="pt-24 flex flex-col items-center gap-3">
            <div className="relative w-11 h-11">
              <div className="absolute inset-0 border-2 border-zg-indigo/20 rounded-full" />
              <div className="absolute inset-0 border-2 border-transparent border-t-zg-indigo rounded-full animate-spin" />
            </div>
            <p className="text-zg-text text-sm font-medium">{analyzeMsg}</p>
          </div>
        )}
      </div>
    );
  }

  function renderResults() {
    if (!result) return null;
    const { is_snakebite, venomous, risk_level, confidence, raw_class, all } = result;
    const pct = (confidence * 100).toFixed(1);

    const riskAccent = {
      HIGH: { text: 'text-zg-emergency', bg: 'bg-zg-emergency', bar: 'from-red-500 to-red-400', border: 'border-red-200' },
      MEDIUM: { text: 'text-amber-500', bg: 'bg-zg-warning', bar: 'from-amber-500 to-amber-300', border: 'border-amber-200' },
      LOW: { text: 'text-zg-success', bg: 'bg-zg-success', bar: 'from-emerald-500 to-emerald-300', border: 'border-emerald-200' },
      NONE: { text: 'text-zg-indigo', bg: 'bg-zg-indigo', bar: 'from-indigo-400 to-blue-300', border: 'border-indigo-200' },
    }[risk_level] || { text: 'text-zg-text-secondary', bg: 'bg-zg-text-secondary', bar: 'from-gray-400 to-gray-300', border: 'border-zg-border' };

    const headerEmoji = risk_level === 'HIGH' ? '🚨' : risk_level === 'MEDIUM' ? '⚠️' : risk_level === 'LOW' ? '🟢' : is_snakebite === false ? '✅' : '❓';
    const headerTitle = risk_level === 'HIGH' ? 'VENOMOUS BITE DETECTED' : risk_level === 'MEDIUM' ? 'POSSIBLE VENOMOUS BITE' : risk_level === 'LOW' ? 'Non-Venomous Bite' : is_snakebite === false ? 'Not a Snakebite' : 'Unable to Determine';
    const firstAid = FIRST_AID[risk_level];

    return (
      <div className="animate-slide-up space-y-4 pt-4 pb-8">
        {previewSrc && (
          <div className="rounded-3xl overflow-hidden border border-zg-border shadow-float">
            <img src={previewSrc} alt="Analyzed" className="w-full aspect-[4/3] object-cover block" />
          </div>
        )}

        <div className="bg-zg-card border border-zg-border rounded-3xl p-5 shadow-float">
          <div className="text-center mb-5">
            <div className="text-4xl mb-2">{headerEmoji}</div>
            <h2 className="text-zg-text text-xl font-black">{headerTitle}</h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mb-4">
            {[
              { label: 'Snakebite', value: is_snakebite === true ? 'YES' : is_snakebite === false ? 'NO' : 'UNCLEAR', color: is_snakebite === true ? 'text-zg-emergency' : is_snakebite === false ? 'text-zg-success' : 'text-amber-500', border: is_snakebite === true ? 'border-red-200' : 'border-emerald-200' },
              { label: 'Venomous', value: venomous === true ? 'YES' : venomous === false ? 'NO' : 'N/A', color: venomous === true ? 'text-zg-emergency' : venomous === false ? 'text-zg-success' : 'text-zg-text-secondary', border: venomous === true ? 'border-red-200' : 'border-emerald-200' },
              { label: 'Risk Level', value: risk_level, color: riskAccent.text, border: riskAccent.border },
              { label: 'Confidence', value: `${pct}%`, color: confidence >= 0.75 ? 'text-zg-success' : confidence >= 0.5 ? 'text-amber-500' : 'text-zg-emergency', border: confidence >= 0.75 ? 'border-emerald-200' : 'border-amber-200' },
            ].map(({ label, value, color, border }) => (
              <div key={label} className={`bg-zg-bg rounded-2xl px-3.5 py-3 border ${border}`}>
                <p className="text-zg-text-secondary text-[10px] uppercase tracking-wider font-medium">{label}</p>
                <p className={`text-lg font-black mt-1 ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <div className="h-2 bg-zg-bg rounded-full overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${riskAccent.bar} transition-all duration-700`} style={{ width: `${confidence * 100}%` }} />
            </div>
          </div>

          <div className="mb-4">
            <p className="text-zg-text-secondary text-[10px] uppercase tracking-wider font-bold mb-2">Class Probabilities</p>
            {all.map((p) => (
              <div key={p.className} className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className={p.className === raw_class ? 'text-zg-text font-bold' : 'text-zg-text-secondary'}>{p.className}</span>
                  <span className="text-zg-text-secondary">{(p.probability * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1 bg-zg-bg rounded-full">
                  <div className={`h-full rounded-full transition-all duration-500 ${p.className === raw_class ? 'bg-zg-indigo' : 'bg-zg-border'}`} style={{ width: `${p.probability * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          {firstAid && (
            <div className={`${firstAid.bgColor} border-l-[3px] ${firstAid.borderColor} border ${firstAid.borderColor} rounded-2xl p-4 mb-4`}>
              <p className={`font-bold text-sm mb-3 ${firstAid.titleColor}`}>{firstAid.title}</p>
              {firstAid.steps.map((step, i) => (
                <div key={i} className="flex gap-2 mb-1.5 text-[13px] text-zg-text-secondary leading-snug">
                  <span className={`flex-shrink-0 font-semibold ${firstAid.titleColor}`}>{i + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
              {(risk_level === 'HIGH' || risk_level === 'MEDIUM') && (
                <button onClick={() => { window.location.href = 'tel:112'; }}
                  className="w-full mt-3 py-3 rounded-2xl gradient-emergency text-white font-black text-sm shadow-float-red detect-sos-pulse transition-all active:scale-[0.96]">
                  🆘 Call 112 — Emergency
                </button>
              )}
            </div>
          )}

          <div className="space-y-2.5">
            {is_snakebite && (
              <>
                <button onClick={goToSymptoms} className="w-full py-3.5 rounded-2xl gradient-indigo text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] shadow-float-indigo">
                  🩺 Check Symptoms <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
                <button onClick={goToSOS} className="w-full py-3.5 rounded-2xl bg-red-50 border border-red-200 text-zg-emergency font-bold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.97]">
                  🚨 Send SOS <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </>
            )}
            {is_snakebite && (
              <button onClick={goToGuidance} className="w-full py-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-zg-success font-bold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.97]">
                📖 Get Medical Guidance <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            )}
            <button onClick={resetAll} className="w-full py-3 rounded-2xl bg-zg-card border border-zg-border text-zg-text-secondary font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97] shadow-float">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>
              Analyze Another Image
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderError() {
    return (
      <div className="animate-fade-in-up flex flex-col items-center gap-4 pt-24">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-zg-emergency">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </div>
        <div className="text-center max-w-[300px]">
          <h3 className="text-zg-text text-base font-bold mb-2">Something went wrong</h3>
          <p className="text-zg-text-secondary text-sm leading-relaxed">{error}</p>
        </div>
        <button onClick={() => { setError(''); modelReady ? resetAll() : loadModel(); }}
          className="px-6 py-3 rounded-2xl bg-zg-card border border-zg-border text-zg-text font-semibold text-sm flex items-center gap-2 transition-all active:scale-[0.97] shadow-float">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>
          Try Again
        </button>
      </div>
    );
  }

  const views = { LOADING: renderLoading, READY: renderReady, CAMERA: renderCamera, ANALYZING: renderAnalyzing, RESULTS: renderResults, ERROR: renderError };

  return (
    <div id="detect-page" className="fixed inset-0 overflow-y-auto pb-[100px]" style={{ backgroundColor: '#e4ebe6', backgroundImage: 'radial-gradient(#c5d1c8 1px, transparent 1px)', backgroundSize: '6px 6px' }}>
      
      {/* Hero 3D Anaconda placeholder asset */}
      <div className="fixed bottom-[30px] left-1/2 -translate-x-1/2 w-[110%] max-w-[360px] pointer-events-none z-0 mix-blend-multiply flex justify-center items-end opacity-95 pb-8">
          <div className="relative w-full aspect-square flex justify-center items-end">
             {/* Red glowing hotspot representing bite impact */}
             <div className="absolute top-[40%] right-[30%] translate-x-1/2 -translate-y-1/2 w-[80px] h-[80px] bg-[#E05A5A] rounded-full blur-[30px] opacity-[0.85] mix-blend-normal pointer-events-none z-0"></div>
             {/* The user's specific Anaconda from the mockup. Loaded directly from the local public folder for perfect deployment rendering */}
             <img src="/anaconda-mesh.png" alt="Anaconda Reference" className="w-full h-auto object-contain object-bottom relative z-10" onError={(e) => { 
                e.target.onerror = null; 
                e.target.style.display='none'; 
                e.target.nextSibling.style.display='block'; 
              }}/>
              {/* Fallback inline SVG if image is missing */}
             <svg width="100%" height="100%" viewBox="0 0 200 200" style={{display: 'none'}} className="relative z-10 text-[#5f7a68] opacity-60">
                <path d="M100 40 C140 40 160 70 160 110 C160 150 140 180 100 180 C60 180 40 150 40 110 C40 70 60 40 100 40 Z" fill="none" stroke="currentColor" strokeWidth="2" className="drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"/>
                <path d="M75 90 A5 15 0 1 1 85 90 A5 15 0 1 1 75 90" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M115 90 A5 15 0 1 1 125 90 A5 15 0 1 1 115 90" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M60 140 Q100 120 140 140" fill="none" stroke="currentColor" strokeWidth="2"/>
                <path d="M140 90 Q160 110 140 130" fill="none" stroke="currentColor" strokeWidth="1"/>
             </svg>
          </div>
      </div>

      <div className="relative z-10 px-5 pt-8 pb-1 w-full max-w-md mx-auto">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate('/home')} className="flex items-center gap-1.5 bg-white/30 backdrop-blur-md border border-[#1b4332]/40 px-4 py-1.5 rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_4px_10px_rgba(0,0,0,0.05)] text-[#1b4332] hover:bg-white/50 text-[13px] font-bold transition-all active:scale-95">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back to Home
          </button>
        </div>

        <div className="flex flex-row items-start justify-between">
          <div className="flex-1">
            <p className="text-[#11311b]/80 text-[10px] font-black tracking-[0.15em] uppercase mb-0.5">{t('detect.header')}</p>
            <h1 className="text-3xl font-extrabold text-[#11311b] leading-none tracking-tight font-sans drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] pr-2">
              {t('detect.title').split(' ')[0]} <span className="text-[#366847]">{t('detect.title').split(' ')[1] || ''}</span>
            </h1>
          </div>
          
          <div className="flex items-center shrink-0 mt-0.5 gap-1.5 bg-white/20 backdrop-blur-md border border-white/60 rounded-full px-2.5 py-1.5 shadow-[inset_0_2px_10px_rgba(255,255,255,0.6),0_0_15px_rgba(134,239,172,0.6)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80] animate-pulse drop-shadow-[0_0_4px_rgba(74,222,128,1)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)]" />
            <span className="text-[#11311b] text-[9px] font-black uppercase tracking-widest pl-0.5">AI Ready</span>
          </div>
        </div>
      </div>

      <div className="px-5 relative z-10">{(views[appState] || renderLoading)()}</div>

      {/* Persistent Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50">         
         <div className="relative bg-[#ebf2ed]/90 backdrop-blur-3xl border-t border-white shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex justify-around items-center h-[80px] px-2 pb-safe max-w-md mx-auto">
            {/* Nav Item 1: Home */}
            <button className="p-3 text-[#11311b]/40 hover:text-[#11311b]" onClick={() => navigate('/home')}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
            </button>
            {/* Nav Item 2: Search/Detect (Active) */}
            <button className="p-3 text-[#295b36]">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"><path d="M22 6L12 11l-10-5" /><path d="M12 22V11" /><path d="M22 18V6" /><path d="M2 18V6" /></svg>
            </button>
            
            {/* Center SOS Trigger */}
            <div className="relative -top-7 px-2">
                <div className="absolute inset-0 bg-[#E05A5A]/30 blur-[25px] rounded-full scale-[1.5]"></div>
                <button onClick={() => navigate('/sos')} className="relative w-[76px] h-[76px] rounded-full bg-gradient-to-b from-[#dc2626] to-[#991b1b] text-white flex items-center justify-center shadow-[inset_0_2px_6px_rgba(255,255,255,0.4),0_10px_20px_rgba(153,27,27,0.4)] border-[6px] border-[#ebf2ed] transition-transform hover:scale-105 active:scale-95">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </button>
            </div>

            {/* Nav Item 3: History */}
            <button className="p-3 text-[#11311b]/40 hover:text-[#11311b]">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            </button>
            {/* Nav Item 4: Profile */}
            <button className="p-3 text-[#11311b]/40 hover:text-[#11311b]">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </button>
         </div>
      </div>

      <style>{`
        .detect-scan-line { position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, transparent, #6366F1, transparent); animation: detectScan 2s linear infinite; box-shadow: 0 0 16px #6366F1; }
        .detect-live-pulse { animation: detectPulse 1s ease-in-out infinite; }
        .detect-sos-pulse { animation: detectSOSPulse 1.5s ease-in-out infinite; }
        @keyframes detectScan { 0% { top: 0; } 50% { top: calc(100% - 3px); } 100% { top: 0; } }
        @keyframes detectPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes detectSOSPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.5); } 50% { box-shadow: 0 0 0 10px rgba(220,38,38,0); } }
      `}</style>
    </div>
  );
}
