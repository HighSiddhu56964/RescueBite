import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/emergency_provider.dart';
import '../providers/auth_provider.dart';
import '../services/supabase_service.dart';

class SosScreen extends StatefulWidget {
  const SosScreen({super.key});

  @override
  State<SosScreen> createState() => _SosScreenState();
}

class _SosScreenState extends State<SosScreen> with SingleTickerProviderStateMixin {
  Position? _currentPosition;
  String? _gpsError;
  bool _loading = false;
  bool _showConfirm = false;
  bool _showSuccess = false;

  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(vsync: this, duration: const Duration(seconds: 1))..repeat(reverse: true);
    _acquireLocation();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _acquireLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() => _gpsError = 'Location services are disabled.');
        return;
      }
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() => _gpsError = 'Location permissions are denied');
          return;
        }
      }
      if (permission == LocationPermission.deniedForever) {
        setState(() => _gpsError = 'Location permissions are permanently denied, we cannot request permissions.');
        return;
      }
      Position position = await Geolocator.getCurrentPosition();
      setState(() => _currentPosition = position);
    } catch (e) {
      setState(() => _gpsError = 'Unable to get location');
    }
  }

  Future<void> _sendSos() async {
    setState(() {
      _loading = true;
    });

    final auth = context.read<AuthProvider>();
    final emergency = context.read<EmergencyProvider>();

    try {
      await SupabaseService.client.from('emergencies').insert([
        {
          'user_id': auth.user?.id,
          'user_phone': auth.user?.phone,
          'latitude': _currentPosition?.latitude,
          'longitude': _currentPosition?.longitude,
          'message': 'Snakebite Emergency (Type: ${emergency.snakeType ?? 'Unknown'})',
          'symptoms': emergency.symptoms,
          'severity': emergency.severity,
          'risk_level': emergency.riskLevel,
          'status': 'pending',
          'created_at': DateTime.now().toIso8601String()
        }
      ]);
      
      setState(() {
        _loading = false;
        _showConfirm = false;
        _showSuccess = true;
      });

      // Send SMS fallback
      final phone = auth.user?.phone ?? '';
      final msg = '🚨 Snakebite Emergency!\nLocation: https://www.google.com/maps?q=${_currentPosition?.latitude},${_currentPosition?.longitude}\nNeed immediate help!';
      final uri = Uri.parse('sms:?body=${Uri.encodeComponent(msg)}');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    } catch (e) {
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to send SOS: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_showConfirm) return _buildConfirmModal();
    if (_showSuccess) return _buildSuccessModal();

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: Stack(
        alignment: Alignment.center,
        children: [
          Positioned(
            top: 40, left: 16,
            child: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
          ),
          
          ScaleTransition(
            scale: Tween(begin: 0.95, end: 1.05).animate(_pulseController),
            child: Container(
              width: 300, height: 300,
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
            ),
          ),

          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('EMERGENCY MODE', style: TextStyle(color: Colors.redAccent, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 3)),
              const SizedBox(height: 60),

              GestureDetector(
                onTap: () => setState(() => _showConfirm = true),
                child: Container(
                  width: 200, height: 200,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Colors.red, Colors.redAccent]),
                    shape: BoxShape.circle,
                    boxShadow: [BoxShadow(color: Colors.red.withOpacity(0.6), blurRadius: 40, offset: const Offset(0, 10))],
                    border: Border.all(color: Colors.white24, width: 6),
                  ),
                  child: const Center(
                    child: Text('SOS', style: TextStyle(color: Colors.white, fontSize: 48, fontWeight: FontWeight.w900, letterSpacing: 4)),
                  ),
                ),
              ),
              const SizedBox(height: 30),
              const Text('Tap to send immediate alert', style: TextStyle(color: Colors.grey, fontSize: 14)),
            ],
          ),

          Positioned(
            bottom: 40, left: 24, right: 24,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white10),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 6,
                    backgroundColor: _currentPosition != null ? Colors.green : (_gpsError != null ? Colors.red : Colors.orange),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_currentPosition != null ? 'GPS Locked' : (_gpsError != null ? 'GPS Unavailable' : 'Acquiring GPS...'), style: TextStyle(color: _currentPosition != null ? Colors.white : Colors.orange, fontWeight: FontWeight.bold)),
                        if (_currentPosition != null) Text('${_currentPosition!.latitude.toStringAsFixed(6)}, ${_currentPosition!.longitude.toStringAsFixed(6)}', style: const TextStyle(color: Colors.white54, fontSize: 12)),
                        if (_gpsError != null) Text(_gpsError!, style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
                      ],
                    ),
                  )
                ],
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildConfirmModal() {
    return Scaffold(
      backgroundColor: Colors.black87,
      body: Center(
        child: Container(
          margin: const EdgeInsets.all(24),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.redAccent.withOpacity(0.3))),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircleAvatar(radius: 30, backgroundColor: Colors.redAccent, child: Icon(Icons.warning, color: Colors.white)),
              const SizedBox(height: 16),
              const Text('CONFIRM SOS', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text('This will alert emergency services with your location.', textAlign: TextAlign.center, style: TextStyle(color: Colors.white70, fontSize: 14)),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () => setState(() => _showConfirm = false),
                      child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
                    ),
                  ),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _loading ? null : _sendSos,
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
                      child: _loading ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white)) : const Text('Send Alert', style: TextStyle(color: Colors.white)),
                    ),
                  )
                ],
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSuccessModal() {
    return Scaffold(
      backgroundColor: Colors.black87,
      body: Center(
        child: Container(
          margin: const EdgeInsets.all(24),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircleAvatar(radius: 40, backgroundColor: Colors.green, child: Icon(Icons.check, color: Colors.white, size: 40)),
              const SizedBox(height: 16),
              const Text('SOS Sent Successfully!', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text('Help is on the way. Focus on staying calm. Don\'t restrict blood flow strongly.', textAlign: TextAlign.center, style: TextStyle(color: Colors.greenAccent, fontSize: 14)),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () {
                  context.read<EmergencyProvider>().resetEmergency();
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(backgroundColor: Colors.white24, minimumSize: const Size(double.infinity, 50), padding: const EdgeInsets.symmetric(vertical: 16)),
                child: const Text('Close', style: TextStyle(color: Colors.white)),
              )
            ],
          ),
        ),
      ),
    );
  }
}
