import { haversineKm } from './haversine';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Manual verified hospitals
const MANUAL_HOSPITALS = [
  { id: 'm1', lat: 20.98912811798001, lon: 79.04587907808951, tags: { name: "INDUTAI GAIKWAD PATIL AYURVEDIC HOSPITAL AND REASEARCH CENTRE ✓ Verified" }, isManual: true },
  { id: 'm2', lat: 21.010720870899636, lon: 79.04125691241157, tags: { name: "Suretech Hospital and Research Centre, Jamtha. ✓ Verified" }, isManual: true },
  { id: 'm3', lat: 21.03324572862715, lon: 79.04605307146625, tags: { name: "MIDAS HOSPITAL ✓ Verified" }, isManual: true },
  { id: 'm4', lat: 21.052018439342632, lon: 79.05919550605097, tags: { name: "CARNA Hospital ✓ Verified" }, isManual: true },
  { id: 'm5', lat: 21.060502288505226, lon: 79.05656608653354, tags: { name: "Suretec Hospital ✓ Verified" }, isManual: true },
  { id: 'm6', lat: 21.038999579630023, lon: 79.0243069286509, tags: { name: "All India Institute Of Medical Sciences Nagpur ✓ Verified" }, isManual: true }
];

const hospitalCache = {};

export async function fetchHospitalsDynamic(lat, lng, severity = 'LOW') {
  const maxRadius = severity === 'HIGH' ? 50000 : severity === 'MEDIUM' ? 30000 : 20000;

  // Sequence of radii to try: 5km -> 20km -> Max
  const radiiSequence = [5000, 20000, maxRadius];
  // clean up duplicates and sort sequentially
  const radii = Array.from(new Set(radiiSequence)).sort((a, b) => a - b);

  const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}_${severity}`;
  if (hospitalCache[cacheKey]) {
    return hospitalCache[cacheKey];
  }

  for (const radius of radii) {
    let apiHospitals = [];
    try {
      const query = `[out:json];node["amenity"="hospital"](around:${radius},${lat},${lng});out 40;`;
      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (res.ok) {
        const data = await res.json();
        apiHospitals = data.elements || [];
      }
    } catch (err) {
      console.error("Overpass API failed, falling back to manual hospitals:", err);
    }

    // Filter manual hospitals within current radius
    const nearbyManual = MANUAL_HOSPITALS.filter(h => haversineKm(lat, lng, h.lat, h.lon) <= radius / 1000);

    // Merge API and Manual. Avoid duplicates.
    const merged = [...nearbyManual];
    for (const apiHosp of apiHospitals) {
      // Check if this API hospital is already in merged list (by name or very close proximity)
      const isDuplicate = merged.some(m =>
        (m.tags?.name && apiHosp.tags?.name && m.tags.name.toLowerCase().includes(apiHosp.tags.name.toLowerCase().replace(' hospital', ''))) ||
        haversineKm(m.lat, m.lon, apiHosp.lat, apiHosp.lon) < 0.2
      );
      if (!isDuplicate) {
        merged.push(apiHosp);
      }
    }

    if (merged.length > 0) {
      // Break early if we found hospitals in this radius
      const result = { hospitals: merged, searchRadius: radius };
      hospitalCache[cacheKey] = result;
      return result;
    }
  }

  // If even maxRadius yields nothing, fallback to the absolute closest manual hospitals regardless of radius
  // This ensures they are NEVER left stranded if Overpass is totally down in an empty zone.
  const emergencyFallback = MANUAL_HOSPITALS.filter(h => haversineKm(lat, lng, h.lat, h.lon) <= 150);
  const finalResult = { hospitals: emergencyFallback, searchRadius: maxRadius };
  hospitalCache[cacheKey] = finalResult;
  return finalResult;
}

export function getAntivenomStatus(name) {
  if (!name) return { label: 'Antivenom Availability Uncertain ⚠️', color: '#F59E0B' };
  const lower = name.toLowerCase();
  // Antivenom is now STRICTLY only available in AIIMS based on rules
  const isAIIMS = lower.includes('aiims') || lower.includes('all india institute');

  return isAIIMS
    ? { label: 'Antivenom Available ✅ ', color: '#22C55E' }
    : { label: 'Antivenom Availability Uncertain ⚠️', color: '#F59E0B' };
}
