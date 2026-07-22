import 'dart:math';

class LocationHelper {
  /// Calculate the great-circle distance between two points using the Haversine formula.
  /// Returns distance in kilometers.
  static double haversineKm(double lat1, double lng1, double lat2, double lng2) {
    const R = 6371.0;
    double toRad(double deg) => (deg * pi) / 180.0;
    
    final dLat = toRad(lat2 - lat1);
    final dLng = toRad(lng2 - lng1);
    
    final a = pow(sin(dLat / 2), 2) +
        cos(toRad(lat1)) * cos(toRad(lat2)) * pow(sin(dLng / 2), 2);
        
    return R * 2 * atan2(sqrt(a), sqrt(1 - a));
  }

  /// Find the nearest item from a list using Haversine distance.
  /// Items must be a map containing 'lat' and 'lng'/'lon'
  static Map<String, dynamic>? findNearest(double userLat, double userLng, List<dynamic> items) {
    if (items.isEmpty) return null;
    
    dynamic closest;
    double minDist = double.infinity;
    
    for (var item in items) {
      final double itemLat = item['lat'] is int ? (item['lat'] as int).toDouble() : item['lat'];
      final double itemLng = item['lon'] ?? item['lng'];
      
      final dist = haversineKm(userLat, userLng, itemLat, itemLng);
      if (dist < minDist) {
        minDist = dist;
        closest = item;
      }
    }
    
    if (closest == null) return null;
    return {'item': closest, 'distanceKm': minDist};
  }
}
