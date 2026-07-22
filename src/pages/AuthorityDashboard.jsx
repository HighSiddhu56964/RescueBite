import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const sosIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function getStatusIcon(status) {
  if (!status || status === 'pending') return sosIcon;
  if (status === 'accepted') return blueIcon;
  return greenIcon;
}

export default function AuthorityDashboard() {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAlert, setNewAlert] = useState(null);
  const [filter, setFilter] = useState('all');
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchEmergencies = async () => {
      const { data, error } = await supabase.from('emergencies').select('*').order('created_at', { ascending: false });
      if (!error && data) setEmergencies(data);
      setLoading(false);
    };
    fetchEmergencies();
  }, []);

  useEffect(() => {
    const channel = supabase.channel('emergencies-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'emergencies' }, (payload) => { setEmergencies((prev) => [payload.new, ...prev]); setNewAlert(payload.new); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'emergencies' }, (payload) => { setEmergencies((prev) => prev.map((e) => (e.id === payload.new.id ? payload.new : e))); })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase.from('emergencies').update({ status: newStatus }).eq('id', id);
    if (!error) setEmergencies((prev) => prev.map((em) => (em.id === id ? { ...em, status: newStatus } : em)));
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'Unknown';
    return new Date(isoString).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getTimeDiff = (isoString) => {
    if (!isoString) return '';
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const filteredEmergencies = emergencies.filter((e) => {
    if (filter === 'pending') return !e.status || e.status === 'pending';
    if (filter === 'accepted') return e.status === 'accepted';
    if (filter === 'completed') return e.status === 'completed';
    return true;
  });

  const pendingCount = emergencies.filter((e) => !e.status || e.status === 'pending').length;
  const acceptedCount = emergencies.filter((e) => e.status === 'accepted').length;
  const completedCount = emergencies.filter((e) => e.status === 'completed').length;
  const markers = emergencies.filter((e) => e.latitude != null && e.longitude != null);
  const defaultCenter = [20.5937, 78.9629];
  const mapCenter = markers.length > 0 ? [markers[0].latitude, markers[0].longitude] : defaultCenter;

  const getSeverityBadge = (severity) => {
    const map = {
      HIGH: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-zg-emergency', label: 'HIGH' },
      MEDIUM: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', label: 'MEDIUM' },
      LOW: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-zg-success', label: 'LOW' },
    };
    return map[severity] || map.LOW;
  };

  const getStatusConfig = (status) => {
    if (!status || status === 'pending') return { label: '🚨 Pending', color: 'text-zg-emergency', dot: 'bg-zg-emergency animate-pulse', cardBg: 'bg-red-50/50 border-red-200' };
    if (status === 'accepted') return { label: '🔄 Accepted', color: 'text-zg-indigo', dot: 'bg-zg-indigo', cardBg: 'bg-indigo-50/50 border-indigo-200' };
    return { label: '✅ Completed', color: 'text-zg-success', dot: 'bg-zg-success', cardBg: 'bg-emerald-50/50 border-emerald-200' };
  };

  return (
    <div id="dashboard-page" className="fixed inset-0 bg-zg-bg overflow-y-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 glass-strong border-b border-zg-border">
        <div className="px-5 pt-10 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zg-emergency text-[10px] font-bold tracking-[0.2em] uppercase">Authority Panel</p>
              <h1 className="text-xl font-extrabold text-zg-text leading-tight mt-0.5">🚨 Emergency Dashboard</h1>
            </div>
            <div className="flex items-center gap-2 bg-zg-card border border-zg-border rounded-full px-3 py-1.5 shadow-float">
              <span className="relative flex w-2 h-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-zg-success" />
              </span>
              <span className="text-zg-success text-[10px] font-bold tracking-wider uppercase">Live</span>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex gap-2 mt-3">
            <div className="flex-1 bg-red-50 border border-red-200 rounded-2xl px-3 py-2 text-center">
              <p className="text-zg-emergency text-lg font-black">{pendingCount}</p>
              <p className="text-zg-text-secondary text-[9px] font-semibold uppercase tracking-wider">Pending</p>
            </div>
            <div className="flex-1 bg-indigo-50 border border-indigo-200 rounded-2xl px-3 py-2 text-center">
              <p className="text-zg-indigo text-lg font-black">{acceptedCount}</p>
              <p className="text-zg-text-secondary text-[9px] font-semibold uppercase tracking-wider">Accepted</p>
            </div>
            <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-2xl px-3 py-2 text-center">
              <p className="text-zg-success text-lg font-black">{completedCount}</p>
              <p className="text-zg-text-secondary text-[9px] font-semibold uppercase tracking-wider">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* 1.5 Live Incidents Ticker */}
      {emergencies.length > 0 && (
        <div className="px-5 mt-4">
           <div className="bg-red-50/50 border-l-4 border-l-zg-emergency shadow-float p-3 flex flex-col gap-1 overflow-hidden relative border border-y-zg-border border-r-zg-border rounded-r-2xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-zg-emergency animate-pulse" />
                <span className="text-[10px] font-black text-zg-emergency uppercase tracking-widest">LIVE INCIDENTS & SOS SIGNALS</span>
              </div>
              <div className="h-4 overflow-hidden relative w-full">
                 <div className="absolute whitespace-nowrap text-xs text-zg-text-secondary font-semibold animate-marquee flex gap-8">
                    {emergencies.slice(0, 5).map((c, i) => (
                       <span key={i}>
                         <span className="font-bold text-zg-text">🚨 {c.symptoms ? 'Snakebite' : 'SOS'}</span> reported • {formatTime(c.created_at)} • {c.risk_level || 'UNKNOWN'} Risk
                       </span>
                    ))}
                    {/* Duplicate for seamless marquee */}
                    {emergencies.slice(0, 5).map((c, i) => (
                       <span key={`dup-${i}`}>
                         <span className="font-bold text-zg-text">🚨 {c.symptoms ? 'Snakebite' : 'SOS'}</span> reported • {formatTime(c.created_at)} • {c.risk_level || 'UNKNOWN'} Risk
                       </span>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Map Section */}
      <div className={`px-5 mt-4 ${isMapFullscreen ? 'fixed inset-0 z-[100] px-0 mt-0 bg-zg-bg' : ''}`}>
        {!isMapFullscreen && <h2 className="text-zg-text text-sm font-bold uppercase tracking-wider mb-2">📍 SOS Locations</h2>}
        <div className={`${isMapFullscreen ? 'h-screen w-screen rounded-none' : 'rounded-3xl h-[220px]'} overflow-hidden border border-zg-border relative shadow-float transition-all`}>
          
          <button 
            onClick={() => {
              setIsMapFullscreen(!isMapFullscreen);
              setTimeout(() => mapRef.current?.invalidateSize(), 300);
            }} 
            className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur rounded-xl p-2.5 shadow-float active:scale-95 transition-transform border border-zg-border"
          >
            {isMapFullscreen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3M16 3v3a2 2 0 0 0 2 2h3M8 21v-3a2 2 0 0 0-2-2H3M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            )}
          </button>

          {markers.length > 0 ? (
            <MapContainer ref={mapRef} center={mapCenter} zoom={6} scrollWheelZoom={true} className="h-full w-full" style={{ height: '100%', width: '100%' }}>
              <TileLayer 
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
                attribution="&copy; Esri"
              />
              <TileLayer 
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              />
              {markers.map((e) => (
                <Marker key={e.id} position={[e.latitude, e.longitude]} icon={getStatusIcon(e.status)}>
                  <Popup>
                    <div style={{ fontSize: 12, lineHeight: 1.5, color: '#0F172A' }}>
                      <strong>🚨 Emergency #{e.id}</strong><br />
                      📍 {Number(e.latitude).toFixed(5)}, {Number(e.longitude).toFixed(5)}<br />
                      🕒 {formatTime(e.created_at)}<br />
                      Status: <strong>{e.status || 'pending'}</strong>
                      {e.severity && <><br />Severity: <strong>{e.severity}</strong></>}
                      {e.risk_level && <><br />Risk: <strong>{e.risk_level}</strong></>}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div className="h-full flex items-center justify-center bg-zg-card">
              <p className="text-zg-text-secondary text-sm">No location data to display</p>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 mt-4 flex gap-2 flex-wrap">
        {['all', 'pending', 'accepted', 'completed'].map((f) => {
          const countMap = { pending: pendingCount, accepted: acceptedCount, completed: completedCount };
          const activeColors = { all: 'gradient-indigo text-white', pending: 'gradient-emergency text-white', accepted: 'gradient-indigo text-white', completed: 'bg-zg-success text-white' };
          return (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${filter === f ? activeColors[f] : 'bg-zg-card border border-zg-border text-zg-text-secondary'}`}>
              {f} {countMap[f] !== undefined ? `(${countMap[f]})` : ''}
            </button>
          );
        })}
      </div>

      {/* Emergency Cards */}
      <div className="px-5 mt-4 space-y-3">
        <h2 className="text-zg-text text-sm font-bold uppercase tracking-wider">🚨 Alerts</h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="w-6 h-6 border-2 border-zg-indigo/30 border-t-zg-indigo rounded-full animate-spin" />
          </div>
        ) : filteredEmergencies.length === 0 ? (
          <div className="bg-zg-card border border-zg-border rounded-3xl p-8 text-center animate-fade-in-up shadow-float">
            <span className="text-4xl block mb-3">✅</span>
            <p className="text-zg-text font-semibold">No emergencies reported</p>
            <p className="text-zg-text-secondary text-sm mt-1">New SOS alerts will appear here in real-time</p>
          </div>
        ) : (
          filteredEmergencies.map((e, i) => {
            const statusConfig = getStatusConfig(e.status);
            const sevBadge = getSeverityBadge(e.severity);
            return (
              <div key={e.id || i}
                className={`relative rounded-3xl p-4 overflow-hidden animate-fade-in-up border shadow-float ${statusConfig.cardBg}`}
                style={{ animationDelay: `${i * 0.05}s` }}>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${statusConfig.dot}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${statusConfig.color}`}>{statusConfig.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {e.severity && <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-lg ${sevBadge.bg} border ${sevBadge.border} ${sevBadge.text}`}>{e.severity}</span>}
                    <span className="text-zg-text-muted text-[10px] font-medium">{getTimeDiff(e.created_at)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">📍</span>
                    <div>
                      <p className="text-zg-text text-sm font-semibold font-mono">{e.latitude != null ? `${Number(e.latitude).toFixed(5)}, ${Number(e.longitude).toFixed(5)}` : 'Location unavailable'}</p>
                      {e.latitude != null && <a href={`https://www.google.com/maps?q=${e.latitude},${e.longitude}`} target="_blank" rel="noopener noreferrer" className="text-zg-indigo text-[10px] font-medium hover:underline">Open in Google Maps ↗</a>}
                    </div>
                  </div>
                  {e.user_phone && (
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm">📞</span>
                      <div>
                        <p className="text-zg-text text-sm font-semibold font-mono">{e.user_phone}</p>
                        <a href={`tel:${e.user_phone}`} className="text-zg-indigo text-[10px] font-medium hover:underline">Call Victim ↗</a>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5"><span className="text-sm">🕒</span><p className="text-zg-text-secondary text-xs">{formatTime(e.created_at)}</p></div>
                  {e.symptoms && <div className="flex items-start gap-2.5"><span className="text-sm">🩺</span><p className="text-zg-text-secondary text-xs leading-snug">{e.symptoms.length > 100 ? e.symptoms.slice(0, 100) + '…' : e.symptoms}</p></div>}
                  {e.risk_level && <div className="flex items-center gap-2.5"><span className="text-sm">⚠️</span><p className={`text-xs font-bold ${getSeverityBadge(e.risk_level).text}`}>Risk: {e.risk_level}</p></div>}
                  <div className="flex items-center gap-2.5"><span className="text-sm">🏥</span><p className="text-zg-text-secondary text-xs">{e.assigned_facility || 'Not assigned'}</p></div>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-zg-border/50">
                  {(!e.status || e.status === 'pending') && (
                    <>
                      <button onClick={() => updateStatus(e.id, 'accepted')}
                        className="flex-1 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-zg-success text-xs font-bold transition-all active:scale-[0.97]">
                        ✅ Accept Emergency
                      </button>
                      <a href={e.latitude != null ? `https://www.google.com/maps/dir/?api=1&destination=${e.latitude},${e.longitude}` : '#'} target="_blank" rel="noopener noreferrer"
                        className="flex-1 py-2 rounded-2xl bg-indigo-50 border border-indigo-200 text-zg-indigo text-xs font-bold text-center transition-all active:scale-[0.97]">
                        🗺️ Navigate
                      </a>
                    </>
                  )}
                  {e.status === 'accepted' && (
                    <>
                      <button onClick={() => updateStatus(e.id, 'completed')}
                        className="flex-1 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-zg-success text-xs font-bold transition-all active:scale-[0.97]">
                        ✅ Mark Completed
                      </button>
                      <a href={e.latitude != null ? `https://www.google.com/maps/dir/?api=1&destination=${e.latitude},${e.longitude}` : '#'} target="_blank" rel="noopener noreferrer"
                        className="flex-1 py-2 rounded-2xl bg-indigo-50 border border-indigo-200 text-zg-indigo text-xs font-bold text-center transition-all active:scale-[0.97]">
                        🗺️ Navigate
                      </a>
                    </>
                  )}
                  {e.status === 'completed' && (
                    <div className="flex-1 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-zg-success text-xs font-bold text-center">
                      ✅ Emergency Resolved
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="h-6" />

      {/* New Alert Modal */}
      {newAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6 animate-scale-in">
          <div className="w-full max-w-sm bg-zg-card rounded-3xl border-2 border-red-200 p-6 shadow-float-red text-center animate-slide-up">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-red-100 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-red-50 border-2 border-zg-emergency flex items-center justify-center">
                <span className="text-3xl">🚨</span>
              </div>
            </div>
            <h2 className="text-lg font-black text-zg-emergency mb-1">New Emergency Alert!</h2>
            <p className="text-zg-text text-sm font-semibold mb-1">SOS Signal Received</p>
            {newAlert.latitude != null && <p className="text-zg-text-secondary text-xs font-mono mt-2">📍 {Number(newAlert.latitude).toFixed(5)}, {Number(newAlert.longitude).toFixed(5)}</p>}
            <p className="text-zg-text-secondary text-xs mt-1">🕒 {formatTime(newAlert.created_at)}</p>

            {(newAlert.symptoms || newAlert.severity || newAlert.user_phone) && (
              <div className="bg-zg-bg rounded-2xl p-3 mt-3 text-left space-y-1 border border-zg-border">
                {newAlert.user_phone && <p className="text-zg-text-secondary text-[11px]"><span className="text-zg-text font-semibold">Victim Phone:</span> {newAlert.user_phone}</p>}
                {newAlert.symptoms && <p className="text-zg-text-secondary text-[11px]"><span className="text-zg-text font-semibold">Symptoms:</span> {newAlert.symptoms.slice(0, 80)}</p>}
                {newAlert.severity && <p className="text-zg-text-secondary text-[11px]"><span className="text-zg-text font-semibold">Severity:</span> <span className={getSeverityBadge(newAlert.severity).text}>{newAlert.severity}</span></p>}
                {newAlert.risk_level && <p className="text-zg-text-secondary text-[11px]"><span className="text-zg-text font-semibold">Risk:</span> <span className={getSeverityBadge(newAlert.risk_level).text}>{newAlert.risk_level}</span></p>}
                {newAlert.assigned_facility && <p className="text-zg-text-secondary text-[11px]"><span className="text-zg-text font-semibold">Facility:</span> {newAlert.assigned_facility}</p>}
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button onClick={() => setNewAlert(null)}
                className="flex-1 py-3 rounded-2xl bg-zg-bg border border-zg-border text-zg-text-secondary font-semibold text-sm transition-all active:scale-[0.97]">
                Dismiss
              </button>
              <button onClick={async () => { await updateStatus(newAlert.id, 'accepted'); setNewAlert(null); }}
                className="flex-1 py-3 rounded-2xl bg-zg-success text-white font-bold text-sm transition-all active:scale-[0.97]">
                ✅ Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
