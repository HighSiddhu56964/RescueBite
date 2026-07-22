const { useState, useEffect, useRef, useCallback } = React;

/* ══════════════════════════════════════════════════════════════
   RESQUEBITE — AI-Powered Snakebite Detection
   Single-file React PWA. No external component libraries.
   All inference is LOCAL via Teachable Machine.

   ⚠️ INFERENCE CONTRACT:
   model.predict() receives RAW <img> or <video> element DIRECTLY.
   NEVER draw to canvas before predict(). NEVER preprocess pixels.
   tmImage internally handles cropTo() + capture() + normalize().
   ══════════════════════════════════════════════════════════════ */

/* ── Hardcoded Teachable Machine Model URL ── */
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/Ce7PF21EQ/";

/* ── Design Tokens ── */
const C = {
  bg: '#080d1a', surface: '#111827', card: '#111827', border: '#1e3a5f',
  teal: '#00d4aa', red: '#ef4444', amber: '#f59e0b',
  text: '#f1f5f9', muted: '#64748b', green: '#22c55e', blue: '#3b82f6',
};
const FONT_D = "'Syne', sans-serif";
const FONT_B = "'DM Sans', sans-serif";

const HEX_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zm0-6l22-13V19L28 6 6 19v28l22 13z' fill='none' stroke='%23ffffff06' stroke-width='1'/%3E%3C/svg%3E")`;

/* ── CSS Keyframes (injected once) ── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
@keyframes scanLine{0%{top:0}50%{top:calc(100% - 3px)}100%{top:0}}
@keyframes livePulse{0%,100%{opacity:1}50%{opacity:0.4}}
@keyframes slideUp{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pulseDanger{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.5)}50%{box-shadow:0 0 0 12px rgba(239,68,68,0)}}
*{box-sizing:border-box;margin:0;padding:0}
body{background:${C.bg};min-height:100dvh;overflow-x:hidden}
`;

/* ══════════════════════════════════════════════
   DETECTION LOGIC — ROBUST CLASS NAME MATCHING
   ══════════════════════════════════════════════ */
function buildResult(predictions) {
  console.log('=== buildResult START ===');

  const sorted = [...predictions].sort((a, b) => b.probability - a.probability);
  sorted.forEach(p => console.log(`  ${p.className}: ${(p.probability * 100).toFixed(1)}%`));

  // Step 1: Extract per-class probabilities using exact class name matching
  let venomous_prob = 0, non_venomous_prob = 0, not_snake_prob = 0;
  predictions.forEach(p => {
    const lc = p.className.toLowerCase();
    if (lc.includes('non') && lc.includes('venemous')) {
      non_venomous_prob = p.probability;
    } else if (lc.includes('venemous')) {
      venomous_prob = p.probability;
    } else if (lc.includes('not')) {
      not_snake_prob = p.probability;
    }
  });

  console.log(`Extracted: venomous=${(venomous_prob*100).toFixed(1)}%, non_venomous=${(non_venomous_prob*100).toFixed(1)}%, not_snake=${(not_snake_prob*100).toFixed(1)}%`);

  // Step 2: Priority-based decision — snake classes ALWAYS override Not_SnakeBite
  const snake_prob = Math.max(venomous_prob, non_venomous_prob);

  let is_snakebite, venomous, risk_level, confidence, raw_class;

  if (snake_prob >= 0.5) {
    // SNAKEBITE DETECTED — determine type by comparing venomous vs non-venomous
    is_snakebite = true;
    if (non_venomous_prob > venomous_prob) {
      venomous = false;
      risk_level = 'LOW';
      confidence = non_venomous_prob;
      raw_class = predictions.find(p => p.className.toLowerCase().includes('non'))?.className || 'NonVenemous_Bite';
    } else {
      venomous = true;
      confidence = venomous_prob;
      raw_class = predictions.find(p => p.className.toLowerCase().includes('venemous') && !p.className.toLowerCase().includes('non'))?.className || 'Venemous_Bite';
      risk_level = confidence >= 0.75 ? 'HIGH' : 'MEDIUM';
    }
  } else {
    // NOT a snakebite — only now do we use not_snake_prob
    is_snakebite = false;
    venomous = null;
    risk_level = 'NONE';
    confidence = not_snake_prob;
    raw_class = predictions.find(p => p.className.toLowerCase().includes('not'))?.className || 'Not_SnakeBite';
  }

  console.log(`DECISION: snakebite=${is_snakebite}, venomous=${venomous}, risk=${risk_level}, confidence=${(confidence*100).toFixed(1)}%`);
  console.log('=== buildResult END ===');

  return { is_snakebite, venomous, risk_level, confidence, raw_class, all: sorted };
}

/* ══════════════════════════════════════════════
   SVG ICONS
   ══════════════════════════════════════════════ */
const Ico = ({ d, size = 20, sw = 1.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
);
const IconShield  = (p) => <Ico {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />;
const IconUpload  = (p) => <Ico {...p} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />;
const IconCamera  = (p) => <Ico {...p} d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 13a4 4 0 100-8 4 4 0 000 8z" />;
const IconRefresh = (p) => <Ico {...p} sw={2} d="M23 4v6h-6M20.49 15a9 9 0 11-2.12-9.36L23 10" />;
const IconX       = (p) => <Ico {...p} sw={2.5} d="M18 6L6 18M6 6l12 12" />;
const IconTarget  = (p) => <Ico {...p} d="M12 22a10 10 0 100-20 10 10 0 000 20zM22 12h-4M6 12H2M12 6V2M12 22v-4" />;

/* ── Shared style helpers ── */
const btnStyle = (bg, color, extra) => ({
  fontFamily: FONT_B, fontWeight: 600, fontSize: 14, border: 'none', borderRadius: 12,
  padding: '14px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', gap: 8, width: '100%', transition: 'all .2s ease',
  background: bg, color, ...extra,
});

/* ══════════════════════════════════════════════
   SOS HANDLER
   ══════════════════════════════════════════════ */
function handleSOS() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const msg = `EMERGENCY: Possible snakebite at coordinates ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}. Call 112 immediately.`;
        navigator.clipboard?.writeText(msg).catch(() => {});
      },
      () => {}
    );
  }
  window.location.href = 'tel:112';
}

/* ══════════════════════════════════════════════
   FIRST AID PANEL
   ══════════════════════════════════════════════ */
function FirstAidPanel({ risk }) {
  const panels = {
    HIGH: {
      bg: '#450a0a', border: '#ef4444',
      title: '🚨 EMERGENCY — Venomous Bite Protocol',
      steps: [
        'Keep the person CALM and STILL — movement spreads venom faster',
        'Immobilize the bitten limb at or BELOW heart level',
        'Remove watches, rings, tight clothing near bite',
        'Mark the edge of swelling with a pen and note the time',
        'Do NOT cut, suck, apply tourniquet, or use ice',
        'Call 112 immediately and transport to nearest hospital with antivenom'
      ]
    },
    MEDIUM: {
      bg: '#451a03', border: '#f59e0b',
      title: '⚠️ Caution — Possible Venomous Bite',
      steps: [
        'Treat as venomous until confirmed otherwise',
        'Keep the person calm and the limb immobilized',
        'Do NOT wait for symptoms — seek hospital care now',
        'Bring a photo of the snake if possible (do not catch it)'
      ]
    },
    LOW: {
      bg: '#052e16', border: '#22c55e',
      title: '🟡 Non-Venomous Bite',
      steps: [
        'Wash wound thoroughly with soap and water for 5 minutes',
        'Apply antiseptic and cover with clean bandage',
        'Monitor for signs of infection over 24–48 hours',
        'Visit a doctor for tetanus shot if not updated in 5 years'
      ]
    },
    NONE: null,
    UNKNOWN: {
      bg: '#1e1b4b', border: '#3b82f6',
      title: '❓ Unclear Result',
      steps: [
        'Image quality may be too low for reliable detection',
        'Retake with better lighting and show the wound clearly',
        'If in doubt about a bite, treat as venomous and seek care'
      ]
    }
  };

  const panel = panels[risk];
  if (!panel) return null;

  return (
    <div style={{ background: panel.bg, border: `1px solid ${panel.border}40`, borderLeft: `3px solid ${panel.border}`, borderRadius: 12, padding: 16 }}>
      <div style={{ fontWeight: 700, fontFamily: FONT_D, color: panel.border, marginBottom: 10, fontSize: 14 }}>
        {panel.title}
      </div>
      {panel.steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#cbd5e1', fontFamily: FONT_B, lineHeight: 1.5 }}>
          <span style={{ color: panel.border, flexShrink: 0 }}>{i + 1}.</span>
          <span>{step}</span>
        </div>
      ))}
      {(risk === 'HIGH' || risk === 'MEDIUM') && (
        <button onClick={handleSOS}
          style={{ width: '100%', marginTop: 12, padding: 14, borderRadius: 10,
            background: '#ef4444', border: 'none', color: '#fff', fontSize: 16,
            fontWeight: 800, fontFamily: FONT_D, cursor: 'pointer',
            animation: 'pulseDanger 1.5s ease-in-out infinite',
            boxShadow: '0 0 24px rgba(239,68,68,0.5)' }}>
          🆘 SOS — Call 112
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */
function ResqueBite() {
  const [appState, setAppState]       = useState('LOADING');
  const [loadingMsg, setLoadingMsg]   = useState('Initializing...');
  const [error, setError]             = useState('');
  const [result, setResult]           = useState(null);
  const [previewSrc, setPreviewSrc]   = useState(null);
  const [inputKey, setInputKey]       = useState(0);
  const [classLabels, setClassLabels] = useState([]);

  const modelRef   = useRef(null);
  const videoRef   = useRef(null);
  const streamRef  = useRef(null);
  const fileRef    = useRef(null);

  /* ── Inject CSS once ── */
  useEffect(() => {
    if (!document.getElementById('rb-css')) {
      const s = document.createElement('style');
      s.id = 'rb-css';
      s.textContent = CSS;
      document.head.appendChild(s);
    }
    // PWA service worker
    try {
      const sw = `self.addEventListener('install',e=>e.waitUntil(caches.open('resquebite-v2').then(c=>c.addAll(['/']))));self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));`;
      navigator.serviceWorker?.register(URL.createObjectURL(new Blob([sw], { type: 'application/javascript' }))).catch(() => {});
    } catch (_) {}

    bootModel();
    return () => stopCamera();
  }, []);

  /* ── Script injector ── */
  function injectScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const el = document.createElement('script');
      el.src = src;
      el.async = false;
      el.onload = resolve;
      el.onerror = () => reject(new Error(`Failed to load: ${src}`));
      document.head.appendChild(el);
    });
  }

  /* ── RULE 4: Sequential script loading + model init ── */
  async function bootModel() {
    try {
      setAppState('LOADING');
      setLoadingMsg('Loading TensorFlow.js...');
      await injectScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');

      setLoadingMsg('Loading Teachable Machine...');
      await injectScript('https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8.5/dist/teachablemachine-image.min.js');

      setLoadingMsg('Loading detection model...');
      const base = MODEL_URL.endsWith('/') ? MODEL_URL : MODEL_URL + '/';
      modelRef.current = await window.tmImage.load(base + 'model.json', base + 'metadata.json');

      const labels = modelRef.current.getClassLabels();
      setClassLabels(labels);
      console.log('=== MODEL CLASSES ===', labels);

      setAppState('READY');
    } catch (err) {
      console.error('Boot failed:', err);
      setError('Failed to initialize: ' + (err.message || 'Check your connection and refresh.'));
      setAppState('ERROR');
    }
  }

  /* ══════════════════════════════════════════════
     RULE 2 — FILE UPLOAD: Raw HTMLImageElement
     NEVER draw to canvas. NEVER resize.
     ══════════════════════════════════════════════ */
  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, WebP).');
      setAppState('ERROR');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Max 10MB.');
      setAppState('ERROR');
      return;
    }

    const objectURL = URL.createObjectURL(file);
    setPreviewSrc(objectURL);
    setAppState('ANALYZING');
    setLoadingMsg('Analyzing image...');

    try {
      const predictions = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = async () => {
          try {
            console.log('=== Predicting on HTMLImageElement:', img.naturalWidth, 'x', img.naturalHeight, '===');
            const preds = await modelRef.current.predict(img);
            console.log('=== RAW PREDICTIONS (file) ===', JSON.stringify(preds, null, 2));
            resolve(preds);
          } catch (err) { reject(err); }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = objectURL;
      });

      const res = buildResult(predictions);
      setResult(res);
      setAppState('RESULTS');
    } catch (err) {
      console.error('Analysis failed:', err);
      setError('Analysis failed: ' + (err.message || 'Unknown error'));
      setAppState('ERROR');
    }

    setInputKey(k => k + 1);
  }

  /* ══════════════════════════════════════════════
     CAMERA — Start / Stop / Cleanup
     ══════════════════════════════════════════════ */
  async function startCamera() {
    setAppState('CAMERA');
    try {
      const constraints = {
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      });
    } catch (err) {
      setError(`Camera error: ${err.message}`);
      setAppState('ERROR');
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  /* ══════════════════════════════════════════════
     RULE 3 — CAMERA CAPTURE: Raw HTMLVideoElement
     NEVER draw to canvas. Check readyState >= 2.
     ══════════════════════════════════════════════ */
  async function captureFromCamera() {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      setError('Camera not ready. Wait for the feed to appear then try again.');
      return;
    }
    setAppState('ANALYZING');
    setLoadingMsg('Analyzing capture...');

    // Capture preview frame for display
    try {
      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = video.videoWidth;
      previewCanvas.height = video.videoHeight;
      previewCanvas.getContext('2d').drawImage(video, 0, 0);
      setPreviewSrc(previewCanvas.toDataURL('image/jpeg', 0.8));
    } catch (_) {}

    try {
      console.log('=== Predicting on HTMLVideoElement:', video.videoWidth, 'x', video.videoHeight, '===');
      const predictions = await modelRef.current.predict(video);
      console.log('=== RAW PREDICTIONS (camera) ===', JSON.stringify(predictions, null, 2));
      stopCamera();
      const res = buildResult(predictions);
      setResult(res);
      setAppState('RESULTS');
    } catch (err) {
      console.error('Capture failed:', err);
      setError('Capture failed: ' + err.message);
      setAppState('ERROR');
    }
  }

  /* ── Reset ── */
  function resetAll() {
    setResult(null);
    setPreviewSrc(null);
    setError('');
    stopCamera();
    setAppState('READY');
  }

  /* ══════════════════════════════════════════════
     RENDER: LOADING
     ══════════════════════════════════════════════ */
  function renderLoading() {
    return (
      <div style={{ animation: 'fadeIn .3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingTop: 100 }}>
        <div style={{ width: 56, height: 56, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, border: `2px solid ${C.teal}30`, borderRadius: '50%' }} />
          <div style={{ position: 'absolute', inset: 0, border: '2px solid transparent', borderTopColor: C.teal, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        </div>
        <p style={{ fontSize: 14, color: C.text, fontWeight: 500, fontFamily: FONT_B }}>{loadingMsg}</p>
        <p style={{ fontSize: 11, color: C.muted, fontFamily: FONT_B }}>This may take a moment</p>
      </div>
    );
  }

  /* ══════════════════════════════════════════════
     RENDER: READY
     ══════════════════════════════════════════════ */
  function renderReady() {
    return (
      <div style={{ animation: 'fadeIn .4s ease', display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 24 }}>
        {/* Dropzone area */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button onClick={startCamera}
            style={{ ...btnStyle(`linear-gradient(135deg, ${C.teal}, #0891b2)`, '#fff'),
              borderRadius: 16, flexDirection: 'column', padding: '28px 12px', gap: 10, fontFamily: FONT_D, fontWeight: 700 }}>
            <IconCamera size={28} />
            <span style={{ fontSize: 13 }}>Camera</span>
          </button>
          <label style={{ ...btnStyle(C.surface, C.text, { border: `1px solid ${C.border}` }),
            borderRadius: 16, flexDirection: 'column', padding: '28px 12px', gap: 10, position: 'relative', overflow: 'hidden', fontFamily: FONT_D, fontWeight: 700 }}>
            <IconUpload size={28} />
            <span style={{ fontSize: 13 }}>Upload</span>
            <input key={inputKey} ref={fileRef} type="file" accept="image/*" onChange={handleFileChange}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
          </label>
        </div>
        <p style={{ fontSize: 12, color: C.muted, textAlign: 'center', fontFamily: FONT_B }}>
          Capture or upload an image to analyze
        </p>
      </div>
    );
  }

  /* ══════════════════════════════════════════════
     RENDER: CAMERA — Video MUST be visible
     ══════════════════════════════════════════════ */
  function renderCamera() {
    return (
      <div style={{ animation: 'fadeIn .3s ease', display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16 }}>
        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: `2px solid ${C.teal}`, background: '#000' }}>
          {/* Video element — VISIBLE, real dimensions, NOT hidden */}
          <video ref={videoRef} autoPlay playsInline muted
            style={{ width: '100%', height: 300, objectFit: 'cover', display: 'block', backgroundColor: '#000' }} />
          {/* Scan line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, transparent, ${C.teal}, transparent)`,
            animation: 'scanLine 2s linear infinite', boxShadow: `0 0 16px ${C.teal}` }} />
          {/* Corner brackets */}
          {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v,h]) => (
            <div key={v+h} style={{ position: 'absolute', [v]: 12, [h]: 12, width: 28, height: 28,
              [`border${v.charAt(0).toUpperCase()+v.slice(1)}`]: `3px solid ${C.teal}`,
              [`border${h.charAt(0).toUpperCase()+h.slice(1)}`]: `3px solid ${C.teal}` }} />
          ))}
          {/* LIVE badge */}
          <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', color: C.red,
            padding: '3px 12px', borderRadius: 99, fontSize: 11, fontFamily: 'monospace',
            display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.red, animation: 'livePulse 1s infinite' }} />
            LIVE FEED
          </div>
        </div>

        <button onClick={captureFromCamera}
          style={{ ...btnStyle(`linear-gradient(135deg, ${C.teal}, #0891b2)`, '#fff'), borderRadius: 12, fontFamily: FONT_D, fontWeight: 700, fontSize: 16 }}>
          <IconTarget size={18} /> Capture & Analyze
        </button>
        <button onClick={() => { stopCamera(); setAppState('READY'); }}
          style={{ ...btnStyle('transparent', C.muted, { border: `1px solid ${C.border}` }), borderRadius: 12 }}>
          Cancel
        </button>
      </div>
    );
  }

  /* ══════════════════════════════════════════════
     RENDER: ANALYZING
     ══════════════════════════════════════════════ */
  function renderAnalyzing() {
    const spinner = (
      <div style={{ width: 44, height: 44, position: 'relative', margin: '0 auto 12px' }}>
        <div style={{ position: 'absolute', inset: 0, border: `2px solid ${C.teal}30`, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', inset: 0, border: '2px solid transparent', borderTopColor: C.teal, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      </div>
    );
    return (
      <div style={{ animation: 'fadeIn .3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingTop: 24 }}>
        {previewSrc ? (
          <div style={{ position: 'relative', width: '100%', maxWidth: 340, borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}` }}>
            <img src={previewSrc} alt="Preview" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block', opacity: 0.5 }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,13,26,.6)', backdropFilter: 'blur(6px)' }}>
              {spinner}
              <p style={{ fontSize: 13, color: C.text, fontWeight: 500, fontFamily: FONT_B }}>{loadingMsg}</p>
            </div>
          </div>
        ) : (
          <div style={{ paddingTop: 60 }}>{spinner}<p style={{ fontSize: 13, color: C.text, fontWeight: 500, textAlign: 'center', fontFamily: FONT_B }}>{loadingMsg}</p></div>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════
     RENDER: RESULTS
     ══════════════════════════════════════════════ */
  function renderResults() {
    if (!result) return null;
    const { is_snakebite, venomous, risk_level, confidence, raw_class, all } = result;
    const pct = (confidence * 100).toFixed(1);

    const riskColors = { HIGH: C.red, MEDIUM: C.amber, LOW: C.green, NONE: C.muted, UNKNOWN: C.blue };
    const riskColor = riskColors[risk_level] || C.muted;

    return (
      <div style={{ animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)', display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 16, paddingBottom: 32 }}>
        {/* Preview */}
        {previewSrc && (
          <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}` }}>
            <img src={previewSrc} alt="Analyzed" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        {/* Main Result Card */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 40 }}>
              {risk_level === 'HIGH' ? '🚨' : risk_level === 'MEDIUM' ? '⚠️' :
               risk_level === 'LOW' ? '🟡' : is_snakebite === false ? '✅' : '❓'}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: FONT_D, color: C.text, marginTop: 8 }}>
              {risk_level === 'HIGH' ? 'VENOMOUS BITE DETECTED' :
               risk_level === 'MEDIUM' ? 'POSSIBLE VENOMOUS BITE' :
               risk_level === 'LOW' ? 'Non-Venomous Bite' :
               is_snakebite === false ? 'Not a Snakebite' : 'Unable to Determine'}
            </div>
          </div>

          {/* 4-field grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Snakebite', value: is_snakebite === true ? 'YES' : is_snakebite === false ? 'NO' : 'UNCLEAR',
                color: is_snakebite === true ? C.red : is_snakebite === false ? C.green : C.amber },
              { label: 'Venomous', value: venomous === true ? 'YES' : venomous === false ? 'NO' : 'N/A',
                color: venomous === true ? C.red : venomous === false ? C.green : C.muted },
              { label: 'Risk Level', value: risk_level, color: riskColor },
              { label: 'Confidence', value: `${pct}%`,
                color: confidence >= 0.75 ? C.teal : confidence >= 0.5 ? C.amber : C.red }
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: '#1a2235', borderRadius: 12, padding: '12px 14px', border: `1px solid ${color}30` }}>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: FONT_B, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: FONT_D, marginTop: 4 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Confidence bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ height: 8, background: '#1a2235', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${confidence * 100}%`,
                background: `linear-gradient(90deg, ${riskColor}88, ${riskColor})`,
                borderRadius: 99, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
            </div>
          </div>

          {/* All classes breakdown */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace', marginBottom: 8 }}>ALL CLASSES:</div>
            {all.map((p) => (
              <div key={p.className} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12,
                  color: p.className === raw_class ? C.text : C.muted,
                  fontFamily: FONT_B, marginBottom: 3 }}>
                  <span style={{ fontWeight: p.className === raw_class ? 700 : 400 }}>{p.className}</span>
                  <span>{(p.probability * 100).toFixed(1)}%</span>
                </div>
                <div style={{ height: 4, background: '#1a2235', borderRadius: 99 }}>
                  <div style={{ height: '100%', width: `${p.probability * 100}%`,
                    background: p.className === raw_class ? C.teal : '#374151',
                    borderRadius: 99, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Raw debug line */}
          <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#374151', marginBottom: 16 }}>
            raw: "{raw_class}" · confidence: {confidence.toFixed(4)}
          </div>

          {/* First Aid */}
          <FirstAidPanel risk={risk_level} />

          {/* Reset */}
          <button onClick={resetAll}
            style={{ ...btnStyle('#1a2235', C.muted, { border: `1px solid ${C.border}`, marginTop: 16 }), borderRadius: 12, fontFamily: FONT_B }}>
            <IconRefresh size={18} /> Analyze Another Image
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════
     RENDER: ERROR
     ══════════════════════════════════════════════ */
  function renderError() {
    return (
      <div style={{ animation: 'fadeIn .4s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 80 }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, background: `${C.red}15`, border: `1px solid ${C.red}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.red }}>
          <IconX size={24} />
        </div>
        <div style={{ textAlign: 'center', maxWidth: 300 }}>
          <h3 style={{ fontFamily: FONT_D, fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: C.text }}>Something went wrong</h3>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, fontFamily: FONT_B }}>{error}</p>
        </div>
        <button onClick={() => { setError(''); modelRef.current ? resetAll() : bootModel(); }}
          style={{ ...btnStyle(C.surface, C.text, { border: `1px solid ${C.border}`, width: 'auto' }), borderRadius: 12 }}>
          <IconRefresh size={18} /> Try Again
        </button>
      </div>
    );
  }

  /* ══════════════════════════════════════════════
     SHELL
     ══════════════════════════════════════════════ */
  const views = { LOADING: renderLoading, READY: renderReady, CAMERA: renderCamera, ANALYZING: renderAnalyzing, RESULTS: renderResults, ERROR: renderError };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto',
      position: 'relative', zIndex: 1, backgroundColor: C.bg, backgroundImage: HEX_BG, color: C.text, fontFamily: FONT_B }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,13,26,.85)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}44`, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.teal}15`, border: `1px solid ${C.teal}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.teal }}>
            <IconShield size={16} />
          </div>
          <h1 style={{ fontFamily: FONT_D, fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-.02em' }}>ResqueBite</h1>
        </div>
        <span style={{ fontSize: 9, fontFamily: FONT_B, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em',
          color: C.teal, background: `${C.teal}15`, border: `1px solid ${C.teal}25`, padding: '3px 8px', borderRadius: 4 }}>AI-Powered</span>
      </header>

      {/* Main */}
      <main style={{ flex: 1, padding: '0 16px 16px' }}>
        {(views[appState] || renderLoading)()}
      </main>

      {/* Footer */}
      <footer style={{ fontSize: 10, color: `${C.muted}80`, textAlign: 'center', padding: '8px 16px 20px', fontFamily: FONT_B, lineHeight: 1.5 }}>
        This tool is AI-assisted and not a medical diagnosis. In case of emergency, seek immediate medical help.
      </footer>
    </div>
  );
}

/* ── Default export + auto-mount ── */
if (typeof module !== 'undefined') module.exports = ResqueBite;
if (typeof document !== 'undefined' && document.getElementById('root')) {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(ResqueBite));
}
