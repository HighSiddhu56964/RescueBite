import { useState, useEffect, useRef } from 'react';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

/**
 * Reusable GPS + reverse geocoding hook.
 * @returns {{ location, locationName, error, loading }}
 */
export function useLocation() {
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const geocodeCache = useRef({});

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setLocation(loc);
        setError(null);
        setLoading(false);
        reverseGeocode(loc.lat, loc.lng);
      },
      (err) => {
        setError(err.code === 1 ? 'Location access denied' : 'Unable to get location');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  async function reverseGeocode(lat, lng) {
    // Round to 3 decimal places (~111m precision) for caching
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    if (geocodeCache.current[cacheKey]) {
      setLocationName(geocodeCache.current[cacheKey]);
      return;
    }

    try {
      const res = await fetch(
        `${NOMINATIM_URL}?lat=${lat}&lon=${lng}&format=json&zoom=14&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (!res.ok) return;

      const data = await res.json();
      const addr = data.address || {};
      const name =
        addr.suburb || addr.village || addr.town || addr.city ||
        addr.county || addr.state || data.display_name?.split(',').slice(0, 2).join(',') || '';

      geocodeCache.current[cacheKey] = name;
      setLocationName(name);
    } catch {
      // Silently fail — location name is optional
    }
  }

  return { location, locationName, error, loading };
}
