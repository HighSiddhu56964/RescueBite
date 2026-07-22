import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import '../services/supabase_service.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  LatLng? _currentLocation;
  final MapController _mapController = MapController();
  List<Map<String, dynamic>> _hospitals = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initMap();
  }

  Future<void> _initMap() async {
    try {
      Position pos = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
      setState(() {
        _currentLocation = LatLng(pos.latitude, pos.longitude);
      });
      _fetchHospitals();
    } catch (e) {
      // Default to somewhat central India if GPS fails
      setState(() {
        _currentLocation = const LatLng(20.5937, 78.9629);
      });
      _fetchHospitals();
    }
  }

  Future<void> _fetchHospitals() async {
    // In React this uses Overpass API. For Flutter conversion,
    // we assume a simple mock or call to Supabase if you store hospitals there.
    // For now, we simulate fetching nearby hospitals.
    await Future.delayed(const Duration(seconds: 1));
    setState(() {
      _hospitals = [
        {'id': '1', 'name': 'City General Hospital', 'lat': (_currentLocation?.latitude ?? 20.5) + 0.01, 'lng': (_currentLocation?.longitude ?? 78.9) + 0.01, 'hasVenom': true},
        {'id': '2', 'name': 'Rural Health Clinic', 'lat': (_currentLocation?.latitude ?? 20.5) - 0.01, 'lng': (_currentLocation?.longitude ?? 78.9) - 0.02, 'hasVenom': false},
      ];
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: Stack(
        children: [
          if (_currentLocation != null)
            FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: _currentLocation!,
                initialZoom: 14.0,
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                ),
                TileLayer(
                  urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
                ),
                MarkerLayer(
                  markers: [
                    Marker(
                      point: _currentLocation!,
                      width: 30, height: 30,
                      child: Container(
                        decoration: BoxDecoration(color: Colors.indigoAccent, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 3)),
                      ),
                    ),
                    ..._hospitals.map((h) => Marker(
                      point: LatLng(h['lat'], h['lng']),
                      width: 40, height: 40,
                      child: Container(
                        decoration: BoxDecoration(color: h['hasVenom'] ? Colors.green : Colors.red, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)),
                        child: const Center(child: Text('🏥', style: TextStyle(fontSize: 18))),
                      ),
                    )).toList()
                  ],
                )
              ],
            )
          else
            const Center(child: CircularProgressIndicator(color: Colors.indigo)),

          // Top overlaid UI
          Positioned(
            top: 40, left: 16, right: 16,
            child: Row(
              children: [
                InkWell(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(16)),
                    child: const Icon(Icons.arrow_back, color: Colors.white),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(16)),
                    child: Row(
                      children: [
                        if (_isLoading) const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.indigo, strokeWidth: 2))
                        else const Icon(Icons.local_hospital, color: Colors.indigo, size: 20),
                        const SizedBox(width: 12),
                        const Expanded(child: Text('Nearby Hospitals', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                      ],
                    ),
                  ),
                )
              ],
            ),
          )
        ],
      ),
    );
  }
}
