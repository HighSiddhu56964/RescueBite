import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { supabase } from '../lib/supabase';
import { haversineKm, findNearest } from '../utils/haversine';
import { useAuth } from '../context/AuthContext';
import { fetchHospitalsDynamic, getAntivenomStatus } from '../utils/hospitalService';

// Fix default Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = [20.5, 78.9];

const userIcon = new L.DivIcon({
  className: '',
  html: `
    <div style="position:relative;width:26px;height:26px;">
      <div style="position:absolute;inset:0;background:rgba(99,102,241,0.15);border-radius:50%;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="position:absolute;top:5px;left:5px;width:16px;height:16px;background:#6366F1;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);"></div>
    </div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

function makeHospitalIcon(color, size, glow) {
  return new L.DivIcon({
    className: '',
    html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 0 0 ${glow ? '4px' : '0px'} ${glow || 'transparent'}, 0 3px 10px rgba(0,0,0,0.15);font-size:${Math.round(size * 0.5)}px;">🏥</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const sosMarkerIcon = new L.DivIcon({
  className: '',
  html: `<div style="background:#DC2626;width:20px;height:20px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 8px rgba(220,38,38,0.6);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const hospitalIcon = makeHospitalIcon('#DC2626', 34, null);
const nearestHospitalIcon = makeHospitalIcon('#22C55E', 40, 'rgba(34,197,94,0.3)');

function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 14, { duration: 1.2 });
  }, [position, map]);
  return null;
}

function HeatmapLayer({ points, show }) {
  const map = useMap();
  useEffect(() => {
    if (!show || points.length === 0) return;
    const heatData = points.map((p) => [p.lat, p.lng, p.intensity || 0.6]);
    const heat = L.heatLayer(heatData, {
      radius: 30, blur: 20, maxZoom: 17,
      gradient: { 0.2: '#22C55E', 0.5: '#F59E0B', 0.8: '#DC2626', 1.0: '#991B1B' },
    }).addTo(map);
    return () => { map.removeLayer(heat); };
  }, [map, points, show]);
  return null;
}

function computePredictionZones(emergencies) {
  if (!emergencies || emergencies.length < 3) return [];
  const valid = emergencies.filter((e) => e.latitude && e.longitude);
  if (valid.length < 3) return [];
  const GRID_SIZE = 0.02;
  const grid = {};
  valid.forEach((e) => {
    const key = `${Math.round(e.latitude / GRID_SIZE)}_${Math.round(e.longitude / GRID_SIZE)}`;
    if (!grid[key]) grid[key] = { points: [], lat: 0, lng: 0 };
    grid[key].points.push(e);
    grid[key].lat += e.latitude;
    grid[key].lng += e.longitude;
  });
  const zones = [];
  Object.values(grid).forEach((cell) => {
    if (cell.points.length >= 2) {
      const centerLat = cell.lat / cell.points.length;
      const centerLng = cell.lng / cell.points.length;
      const nightIncidents = cell.points.filter((p) => { const hour = new Date(p.created_at).getHours(); return hour < 6 || hour >= 18; }).length;
      const isNightHeavy = nightIncidents > cell.points.length * 0.5;
      zones.push({ lat: centerLat, lng: centerLng, count: cell.points.length, radius: Math.min(2000, 500 + cell.points.length * 200), risk: cell.points.length >= 4 ? 'HIGH' : 'MEDIUM', timePattern: isNightHeavy ? 'Night-heavy' : 'Mixed' });
    }
  });
  return zones;
}

function userPopupHtml() {
  return `<div style="font-family:Inter,system-ui,sans-serif;text-align:center;padding:4px 2px;"><div style="font-size:22px;margin-bottom:4px;">📍</div><p style="font-weight:700;font-size:14px;color:#0F172A;margin:0 0 4px;">You are here</p><p style="font-size:11px;color:#64748B;margin:0;">Stay calm and request help if needed</p></div>`;
}

function hospitalPopupHtml(name, antivenom, isNearest, distKm) {
  return `<div style="font-family:Inter,system-ui,sans-serif;padding:4px 2px;min-width:190px;">${isNearest ? `<div style="background:#ECFDF5;border:1px solid #BBF7D0;border-radius:8px;padding:5px 8px;margin-bottom:8px;text-align:center;"><span style="font-size:12px;font-weight:700;color:#16A34A;">🚑 Recommended Facility</span></div>` : ''}<p style="font-weight:800;font-size:14px;color:#0F172A;margin:0 0 6px;">🏥 ${name || 'Hospital'}</p>${distKm !== null ? `<p style="font-size:11px;color:#64748B;margin:0 0 5px;">📍 ~${distKm.toFixed(1)} km away</p>` : ''}<p style="font-size:12px;font-weight:600;color:${antivenom.color};margin:0 0 5px;">💉 ${antivenom.label}</p><div style="border-top:1px solid #E2E8F0;padding-top:6px;margin-top:4px;"><p style="font-size:10px;color:#DC2626;font-weight:600;margin:0;">🚨 Go immediately in case of snakebite</p></div></div>`;
}

export default function MapPage() {
  const [location, setLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(0);
  const [hospitals, setHospitals] = useState([]);
  const [searchStatus, setSearchStatus] = useState('idle');
  const [gpsError, setGpsError] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [sosEmergencies, setSosEmergencies] = useState([]);
  const [predictionZones, setPredictionZones] = useState([]);
  const { user } = useAuth();
  const [reportPoints, setReportPoints] = useState([]);
  const [heatmapFilter, setHeatmapFilter] = useState('all');

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation([pos.coords.latitude, pos.coords.longitude]),
      () => { setGpsError(true); setLocation(DEFAULT_CENTER); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (!location) return;
    setSearchStatus('searching');
    const activeRisk = sosEmergencies.some(e => e.risk_level === 'HIGH' && (!e.status || e.status === 'pending'))
      ? 'HIGH' : sosEmergencies.some(e => e.risk_level === 'MEDIUM' && (!e.status || e.status === 'pending')) ? 'MEDIUM' : 'LOW';
    fetchHospitalsDynamic(location[0], location[1], activeRisk)
      .then(({ hospitals: results, searchRadius: radius }) => { setHospitals(results); setSearchRadius(radius); setSearchStatus(results.length > 0 ? 'found' : 'empty'); })
      .catch(() => { setHospitals([]); setSearchStatus('error'); });
  }, [location, sosEmergencies.length]);

  useEffect(() => {
    const fetchSOS = async () => {
      const { data } = await supabase.from('emergencies').select('*').order('created_at', { ascending: false });
      if (data) { setSosEmergencies(data); setPredictionZones(computePredictionZones(data)); }
    };
    fetchSOS();
    const channel = supabase.channel('map-emergencies').on('postgres_changes', { event: '*', schema: 'public', table: 'emergencies' }, () => fetchSOS()).subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      let query = supabase.from('reports').select('latitude, longitude, detected, risk_level, user_id').not('latitude', 'is', null);
      if (heatmapFilter === 'mine' && user?.id) query = query.eq('user_id', user.id);
      const { data } = await query;
      if (data) {
        setReportPoints(data.filter(r => r.latitude && r.longitude).map(r => ({
          lat: r.latitude, lng: r.longitude,
          intensity: r.detected ? (r.risk_level === 'HIGH' ? 1.0 : r.risk_level === 'MEDIUM' ? 0.7 : 0.5) : 0.15,
        })));
      }
    };
    fetchReports();
    const channel = supabase.channel('map-reports').on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => fetchReports()).subscribe();
    return () => supabase.removeChannel(channel);
  }, [heatmapFilter, user?.id]);

  const heatmapPoints = useMemo(() => {
    const emergencyPoints = sosEmergencies.filter((e) => e.latitude && e.longitude).map((e) => ({ lat: e.latitude, lng: e.longitude, intensity: e.risk_level === 'HIGH' ? 1 : e.risk_level === 'MEDIUM' ? 0.6 : 0.3 }));
    return [...emergencyPoints, ...reportPoints];
  }, [sosEmergencies, reportPoints]);

  const activeEmergencies = useMemo(() => sosEmergencies.filter((e) => e.latitude && e.longitude && (!e.status || e.status === 'pending')), [sosEmergencies]);

  const nearest = useMemo(() => {
    if (!location || hospitals.length === 0) return null;
    const result = findNearest(location[0], location[1], hospitals);
    return result?.item || null;
  }, [location, hospitals]);

  const nearestDistKm = useMemo(() => {
    if (!location || !nearest) return null;
    return haversineKm(location[0], location[1], nearest.lat, nearest.lon);
  }, [location, nearest]);

  const handleNavigate = useCallback(() => {
    if (!nearest) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${nearest.lat},${nearest.lon}`, '_system');
  }, [nearest]);

  if (!location) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-zg-bg gap-3">
        <div className="w-10 h-10 border-4 border-zg-indigo/20 border-t-zg-indigo rounded-full animate-spin" />
        <p className="text-zg-text-secondary text-sm font-medium">Getting your location…</p>
      </div>
    );
  }

  const statusText = {
    idle: 'Initializing…', searching: 'Searching nearby hospitals…',
    found: `${hospitals.length} hospitals found`, empty: 'No hospitals found nearby', error: 'Error fetching hospitals',
  };

  return (
    <div id="map-page" className="absolute inset-0 w-full h-full bg-zg-bg overflow-hidden">
      {gpsError && (
        <div className="absolute top-20 left-4 right-4 z-[1001] bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center animate-fade-in-up">
          <p className="text-amber-700 text-xs font-semibold">⚠ Location access denied — showing default position</p>
        </div>
      )}

      {/* Floating status card */}
      <div className="absolute top-4 left-4 right-4 z-[1001] flex gap-2 animate-scale-in items-start">
        {/* Back Button */}
        <Link to="/home" className="glass-strong rounded-2xl border border-zg-border w-14 h-[74px] flex flex-col items-center justify-center flex-shrink-0 shadow-float active:scale-95 transition-transform text-zg-text-secondary hover:text-zg-text">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </Link>
        
        <div className="glass-strong rounded-2xl border border-zg-border p-4 shadow-float flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zg-indigo/10 flex items-center justify-center flex-shrink-0">
              {searchStatus === 'searching' ? (
                <div className="w-5 h-5 border-2 border-zg-indigo/30 border-t-zg-indigo rounded-full animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zg-text-secondary font-medium uppercase tracking-wider">Nearby Hospitals</p>
              <p className={`text-sm font-bold truncate ${searchStatus === 'error' ? 'text-zg-emergency' : searchStatus === 'empty' ? 'text-zg-warning' : 'text-zg-text'}`}>
                {statusText[searchStatus]}
              </p>
            </div>
            {nearest && <div className="w-3 h-3 rounded-full bg-zg-success animate-pulse flex-shrink-0" />}
          </div>

          <div className="flex gap-2 mt-3 flex-wrap">
            <button onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${showHeatmap ? 'gradient-emergency text-white' : 'bg-zg-bg border border-zg-border text-zg-text-secondary'}`}>
              {showHeatmap ? '🔥 Hide Heatmap' : '🔥 Show Heatmap'}
            </button>
            {showHeatmap && (
              <>
                <button onClick={() => setHeatmapFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${heatmapFilter === 'all' ? 'bg-zg-success text-white' : 'bg-zg-bg border border-zg-border text-zg-text-secondary'}`}>
                  🌍 All Reports
                </button>
                <button onClick={() => setHeatmapFilter('mine')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${heatmapFilter === 'mine' ? 'bg-zg-success text-white' : 'bg-zg-bg border border-zg-border text-zg-text-secondary'}`}>
                  👤 My Reports
                </button>
              </>
            )}
            {activeEmergencies.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-zg-emergency animate-pulse" />
                <span className="text-zg-emergency text-[10px] font-bold">{activeEmergencies.length} Active SOS</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nearest hospital floating card */}
      {nearest && (
        <div className="absolute bottom-[136px] left-4 right-4 z-[1001] animate-fade-in-up">
          <div className="glass-strong rounded-2xl border border-zg-border p-4 shadow-float">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 text-lg">🚑</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zg-text-secondary font-medium uppercase tracking-wider">Nearest Hospital</p>
                <p className="text-sm font-bold text-zg-text truncate">{nearest.tags?.name || 'Hospital'}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-black text-zg-success">~{nearestDistKm !== null ? nearestDistKm.toFixed(1) : '?'} km</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prediction zone legend */}
      {predictionZones.length > 0 && (
        <div className="absolute top-[140px] right-4 z-[1001] animate-fade-in-up">
          <div className="glass-strong rounded-xl border border-zg-border px-3 py-2 shadow-float">
            <p className="text-zg-text-secondary text-[9px] font-bold uppercase tracking-wider mb-1">Risk Zones</p>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-zg-emergency/40" /><span className="text-zg-text-secondary text-[10px]">High Risk</span></div>
            <div className="flex items-center gap-1.5 mt-0.5"><span className="w-2.5 h-2.5 rounded-full bg-zg-warning/40" /><span className="text-zg-text-secondary text-[10px]">Medium Risk</span></div>
          </div>
        </div>
      )}

      {/* Leaflet Map */}
      <MapContainer center={location} zoom={14} zoomControl={false} attributionControl={false} className="w-full h-full" style={{ height: '100%', width: '100%' }}>
        <TileLayer 
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
          attribution="&copy; Esri"
        />
        <TileLayer 
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
        />
        <FlyTo position={location} />

        {searchRadius > 0 && (
          <Circle center={location} radius={searchRadius} pathOptions={{ color: '#6366F1', fillColor: '#6366F1', fillOpacity: 0.05, weight: 1, dashArray: '5, 10' }} />
        )}
        <HeatmapLayer points={heatmapPoints} show={showHeatmap} />

        {predictionZones.map((zone, i) => (
          <Circle key={`zone-${i}`} center={[zone.lat, zone.lng]} radius={zone.radius}
            pathOptions={{ color: zone.risk === 'HIGH' ? '#DC2626' : '#F59E0B', fillColor: zone.risk === 'HIGH' ? '#DC2626' : '#F59E0B', fillOpacity: 0.12, weight: 2, dashArray: '5, 8' }}>
            <Popup>
              <div style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: '4px' }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: zone.risk === 'HIGH' ? '#DC2626' : '#F59E0B', margin: '0 0 4px' }}>⚠️ {zone.risk} Risk Zone</p>
                <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 2px' }}>{zone.count} past incidents</p>
                <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>Pattern: {zone.timePattern}</p>
              </div>
            </Popup>
          </Circle>
        ))}

        <Marker position={location} icon={userIcon}>
          <Popup><div dangerouslySetInnerHTML={{ __html: userPopupHtml() }} /></Popup>
        </Marker>

        {activeEmergencies.map((e) => (
          <Marker key={`sos-${e.id}`} position={[e.latitude, e.longitude]} icon={sosMarkerIcon}>
            <Popup>
              <div style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: '4px', fontSize: 12 }}>
                <p style={{ fontWeight: 700, color: '#DC2626', margin: '0 0 4px' }}>🚨 Active Emergency</p>
                {e.symptoms && <p style={{ margin: '0 0 2px', color: '#64748B' }}>Symptoms: {e.symptoms.slice(0, 60)}</p>}
                {e.severity && <p style={{ margin: '0 0 2px', color: '#64748B' }}>Severity: {e.severity}</p>}
                <p style={{ margin: 0, color: '#94A3B8', fontSize: 10 }}>{new Date(e.created_at).toLocaleString('en-IN')}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {hospitals.map((h) => {
          const isNearest = nearest && nearest.id === h.id;
          const name = h.tags?.name || 'Hospital';
          const antivenom = getAntivenomStatus(name);
          const distKm = haversineKm(location[0], location[1], h.lat, h.lon);
          return (
            <Marker key={h.id} position={[h.lat, h.lon]} icon={isNearest ? nearestHospitalIcon : hospitalIcon}>
              <Popup><div dangerouslySetInnerHTML={{ __html: hospitalPopupHtml(name, antivenom, isNearest, distKm) }} /></Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Navigate button */}
      {nearest && (
        <div className="absolute bottom-20 left-4 right-4 z-[1001] animate-fade-in-up">
          <button id="btn-navigate" onClick={handleNavigate}
            className="w-full py-4 rounded-2xl bg-zg-success text-white font-bold text-base flex items-center justify-center gap-3 transition-all active:scale-[0.97] shadow-lg shadow-emerald-500/25">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
            Navigate to {(nearest.tags?.name?.length > 22) ? nearest.tags.name.slice(0, 22) + '…' : (nearest.tags?.name || 'Hospital')}
          </button>
        </div>
      )}
    </div>
  );
}
