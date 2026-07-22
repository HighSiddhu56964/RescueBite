/**
 * Calculate the great-circle distance between two points using the Haversine formula.
 * @returns {number} Distance in kilometers
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Find the nearest item from a list using Haversine distance.
 * Each item must have { lat, lon } or { lat, lng }.
 * @returns {{ item, distanceKm } | null}
 */
export function findNearest(userLat, userLng, items) {
  if (!items || items.length === 0) return null;
  let closest = null;
  let minDist = Infinity;
  for (const item of items) {
    const itemLng = item.lon ?? item.lng;
    const dist = haversineKm(userLat, userLng, item.lat, itemLng);
    if (dist < minDist) {
      minDist = dist;
      closest = item;
    }
  }
  return { item: closest, distanceKm: minDist };
}
