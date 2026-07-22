import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../providers/auth_provider.dart';
import '../services/supabase_service.dart';
import '../services/supabase_service.dart';// ----- STUBS FOR LATER -----
class SymptomsScreen extends StatelessWidget {
  const SymptomsScreen({super.key});
  @override Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('Symptoms Checker')), body: const Center(child: Text('Symptoms Page'))); 
}
class GuidanceScreen extends StatelessWidget {
  const GuidanceScreen({super.key});
  @override Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('First Aid Guidance')), body: const Center(child: Text('Guidance Page')));
}
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text('User Profile'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: () async {
              await context.read<AuthProvider>().logout();
              Navigator.pushReplacementNamed(context, '/');
            }
          )
        ]
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const CircleAvatar(radius: 50, backgroundColor: Colors.indigo, child: Icon(Icons.person, size: 50, color: Colors.white)),
          const SizedBox(height: 24),
          _buildInfoTile(Icons.badge, 'Name', user?.name ?? 'N/A'),
          if (user?.role == 'authority') _buildInfoTile(Icons.medical_services, 'Role', 'Medical Authority'),
          if (user?.role == 'user') _buildInfoTile(Icons.person_outline, 'Role', 'Victim User'),
          _buildInfoTile(Icons.phone, 'Phone', user?.phone ?? 'N/A'),
          if (user?.username != null && user!.username!.isNotEmpty) _buildInfoTile(Icons.account_circle, 'Username', user.username!),
          if (user?.age != null && user!.age! > 0) _buildInfoTile(Icons.cake, 'Age', user.age.toString()),
          if (user?.gender != null && user!.gender!.isNotEmpty) _buildInfoTile(Icons.people, 'Gender', user.gender!.toUpperCase()),
          if (user?.grNumber != null && user!.grNumber!.isNotEmpty) _buildInfoTile(Icons.numbers, 'GR Number', user.grNumber!),
        ],
      ),
    );
  }

  Widget _buildInfoTile(IconData icon, String title, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(16)),
      child: ListTile(
        leading: Icon(icon, color: Colors.indigoAccent),
        title: Text(title, style: const TextStyle(fontSize: 12, color: Colors.white54)),
        subtitle: Text(value, style: const TextStyle(fontSize: 16, color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }
}

class AuthorityDashboardScreen extends StatefulWidget {
  const AuthorityDashboardScreen({super.key});
  @override State<AuthorityDashboardScreen> createState() => _AuthorityDashboardScreenState();
}

class _AuthorityDashboardScreenState extends State<AuthorityDashboardScreen> {
  String _filter = 'ALL';

  Future<void> _launchMaps(double lat, double lng) async {
    final uri = Uri.parse('https://www.google.com/maps/search/?api=1&query=$lat,$lng');
    if (await canLaunchUrl(uri)) { await launchUrl(uri); }
  }

  Future<void> _launchPhone(String phone) async {
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) { await launchUrl(uri); }
  }

  Future<void> _updateStatus(int id, String status) async {
    await SupabaseService.client.from('emergencies').update({'status': status}).eq('id', id);
  }

  String _formatDate(String isoString) {
    try {
      final dt = DateTime.parse(isoString).toLocal();
      final date = '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
      final time = '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
      return '$date, $time';
    } catch (_) { return isoString; }
  }

  @override Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: Colors.white,
        elevation: 0,
        titleSpacing: 16,
        toolbarHeight: 80,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('AUTHORITY PANEL', style: TextStyle(color: Colors.redAccent, fontSize: 10, letterSpacing: 2, fontWeight: FontWeight.bold)),
            Row(
              children: [
                const Text('🚨 Emergency Dashboard', style: TextStyle(color: Colors.black87, fontSize: 20, fontWeight: FontWeight.w900)),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.green.shade200)),
                  child: Row(children: [
                    Container(width: 8, height: 8, decoration: const BoxDecoration(color: Colors.green, shape: BoxShape.circle)),
                    const SizedBox(width: 4),
                    const Text('LIVE', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 10))
                  ])
                ),
                IconButton(
                  icon: const Icon(Icons.logout, color: Colors.black54),
                  onPressed: () async {
                    await context.read<AuthProvider>().logout();
                    if (context.mounted) Navigator.pushReplacementNamed(context, '/');
                  }
                )
              ]
            )
          ],
        ),
      ),
      body: StreamBuilder<List<Map<String, dynamic>>>(
        stream: SupabaseService.client.from('emergencies').stream(primaryKey: ['id']).order('created_at', ascending: false),
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final allAlerts = snapshot.data!;
          final pendingCount = allAlerts.where((a) => a['status'] == 'pending').length;
          final acceptedCount = allAlerts.where((a) => a['status'] == 'accepted').length;
          final completedCount = allAlerts.where((a) => a['status'] == 'resolved').length;
          final topAlert = allAlerts.isNotEmpty ? allAlerts.first : null;

          final displayedAlerts = allAlerts.where((a) {
            if (_filter == 'PENDING') return a['status'] == 'pending';
            if (_filter == 'ACCEPTED') return a['status'] == 'accepted';
            if (_filter == 'COMPLETED') return a['status'] == 'resolved';
            return true;
          }).toList();

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Stats Row
              Row(
                children: [
                  Expanded(child: _buildStatCard('$pendingCount', 'PENDING', Colors.red.shade50, Colors.redAccent)),
                  const SizedBox(width: 8),
                  Expanded(child: _buildStatCard('$acceptedCount', 'ACCEPTED', Colors.indigo.shade50, Colors.indigo)),
                  const SizedBox(width: 8),
                  Expanded(child: _buildStatCard('$completedCount', 'COMPLETED', Colors.green.shade50, Colors.green)),
                ],
              ),
              const SizedBox(height: 20),

              // Live Incidents Banner
              if (topAlert != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.red.shade100)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(width: 6, height: 6, decoration: const BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle)),
                          const SizedBox(width: 8),
                          const Text('LIVE INCIDENTS & SOS SIGNALS', style: TextStyle(color: Colors.redAccent, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text('🚨 SOS reported • ${_formatDate(topAlert['created_at'])} • ${topAlert['risk_level'] ?? 'LOW'} Risk', style: const TextStyle(color: Colors.black87, fontSize: 12, fontWeight: FontWeight.w600))
                    ],
                  ),
                ),
              const SizedBox(height: 24),

              // SOS Locations Text & Map
              const Row(
                children: [
                   Icon(Icons.location_on, color: Colors.redAccent, size: 16),
                   SizedBox(width: 8),
                   Text('SOS LOCATIONS', style: TextStyle(color: Colors.black87, fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 1)),
                ]
              ),
              const SizedBox(height: 12),
              Container(
                height: 250,
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(24), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 5))]),
                clipBehavior: Clip.antiAlias,
                child: FlutterMap(
                  options: MapOptions(
                    initialCenter: allAlerts.isNotEmpty && allAlerts.first['latitude'] != null ? LatLng(allAlerts.first['latitude'], allAlerts.first['longitude']) : const LatLng(18.5204, 73.8567),
                    initialZoom: 9,
                  ),
                  children: [
                    TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', userAgentPackageName: 'com.snake.sos'),
                    MarkerLayer(
                      markers: allAlerts.where((a) => a['latitude'] != null && a['longitude'] != null).map((e) {
                         bool isPending = e['status'] == 'pending';
                         bool isAccepted = e['status'] == 'accepted';
                         Color mColor = isPending ? Colors.red : (isAccepted ? Colors.blue : Colors.green);
                         return Marker(
                           point: LatLng(e['latitude'], e['longitude']),
                           width: 40, height: 40,
                           child: Icon(Icons.location_on, color: mColor, size: 40),
                         );
                      }).toList(),
                    )
                  ]
                ),
              ),
              const SizedBox(height: 24),

              // Filters Row
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildFilterChip('ALL', 'ALL', _filter == 'ALL'),
                    _buildFilterChip('PENDING ($pendingCount)', 'PENDING', _filter == 'PENDING'),
                    _buildFilterChip('ACCEPTED ($acceptedCount)', 'ACCEPTED', _filter == 'ACCEPTED'),
                    _buildFilterChip('COMPLETED ($completedCount)', 'COMPLETED', _filter == 'COMPLETED'),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Alerts Header
              const Row(
                children: [
                   Icon(Icons.warning, color: Colors.redAccent, size: 16),
                   SizedBox(width: 8),
                   Text('ALERTS', style: TextStyle(color: Colors.black87, fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 1)),
                ]
              ),
              const SizedBox(height: 16),

              // Alerts List
              ...displayedAlerts.map((alert) {
                 final status = alert['status'] ?? 'pending';
                 final isPending = status == 'pending';
                 final isAccepted = status == 'accepted';
                 final isResolved = status == 'resolved';
                 Color accent = isPending ? Colors.redAccent : (isAccepted ? Colors.indigo : Colors.green);
                 String tagStr = status.toUpperCase();

                 return Container(
                   margin: const EdgeInsets.only(bottom: 16),
                   padding: const EdgeInsets.all(16),
                   decoration: BoxDecoration(color: Colors.white, border: Border.all(color: accent.withOpacity(0.2)), borderRadius: BorderRadius.circular(24), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 5))]),
                   child: Column(
                     crossAxisAlignment: CrossAxisAlignment.start,
                     children: [
                       Row(
                         children: [
                           Container(width: 8, height: 8, decoration: BoxDecoration(color: accent, shape: BoxShape.circle)),
                           const SizedBox(width: 8),
                           Icon(Icons.warning, color: accent, size: 12),
                           const SizedBox(width: 4),
                           Text(tagStr, style: TextStyle(color: accent, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                           const Spacer(),
                           Container(
                             padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                             decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.green.shade200)),
                             child: Text(alert['risk_level'] ?? 'LOW', style: TextStyle(color: Colors.green.shade700, fontSize: 10, fontWeight: FontWeight.bold)),
                           ),
                           const SizedBox(width: 8),
                           Text('Recent', style: TextStyle(color: Colors.grey.shade500, fontSize: 10))
                         ],
                       ),
                       const SizedBox(height: 16),
                       if (alert['latitude'] != null)
                         Padding(
                           padding: const EdgeInsets.only(bottom: 12),
                           child: Row(
                             crossAxisAlignment: CrossAxisAlignment.start,
                             children: [
                               const Icon(Icons.location_on, color: Colors.redAccent, size: 20),
                               const SizedBox(width: 12),
                               Expanded(
                                 child: Column(
                                   crossAxisAlignment: CrossAxisAlignment.start,
                                   children: [
                                     Text('${alert['latitude']}, ${alert['longitude']}', style: const TextStyle(color: Colors.black87, fontSize: 14, fontWeight: FontWeight.w600)),
                                     InkWell(
                                       onTap: () => _launchMaps(alert['latitude'], alert['longitude']),
                                       child: const Text('Open in Google Maps ↗', style: TextStyle(color: Colors.green, fontSize: 12, fontWeight: FontWeight.bold)),
                                     )
                                   ],
                                 )
                               )
                             ],
                           )
                         ),
                       if (alert['user_phone'] != null)
                         Padding(
                           padding: const EdgeInsets.only(bottom: 12),
                           child: Row(
                             children: [
                               const Icon(Icons.phone, color: Colors.black54, size: 20),
                               const SizedBox(width: 12),
                               Column(
                                 crossAxisAlignment: CrossAxisAlignment.start,
                                 children: [
                                   Text('${alert['user_phone']}', style: const TextStyle(color: Colors.black87, fontSize: 14, fontWeight: FontWeight.w600)),
                                   InkWell(
                                     onTap: () => _launchPhone(alert['user_phone']),
                                     child: const Text('Call Victim ↗', style: TextStyle(color: Colors.green, fontSize: 12, fontWeight: FontWeight.bold)),
                                   )
                                 ],
                               )
                             ],
                           )
                         ),
                       Row(
                         children: [
                           const Icon(Icons.access_time, color: Colors.black26, size: 16),
                           const SizedBox(width: 12),
                           Text(_formatDate(alert['created_at']), style: const TextStyle(color: Colors.black54, fontSize: 12)),
                         ],
                       ),
                       const SizedBox(height: 16),
                       // Action Buttons
                       Row(
                         children: [
                           if (isPending)
                            Expanded(child: OutlinedButton(
                              onPressed: () => _updateStatus(alert['id'], 'accepted'),
                              style: OutlinedButton.styleFrom(foregroundColor: Colors.indigo, side: const BorderSide(color: Colors.indigo)),
                              child: const Text('ACCEPT')
                            )),
                           if (isPending || isAccepted) ...[
                            if (isPending) const SizedBox(width: 8),
                            Expanded(child: ElevatedButton(
                              onPressed: () => _updateStatus(alert['id'], 'resolved'),
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                              child: const Text('MARK COMPLETED', style: TextStyle(color: Colors.white)),
                            ))
                           ]
                         ],
                       )
                     ],
                   ),
                 );
              }).toList()
            ],
          );
        },
      )
    );
  }

  Widget _buildStatCard(String val, String label, Color bg, Color fg) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(16), border: Border.all(color: fg.withOpacity(0.2))),
      child: Column(
        children: [
          Text(val, style: TextStyle(color: fg, fontSize: 24, fontWeight: FontWeight.w900)),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(color: Colors.black54, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
        ],
      )
    );
  }

  Widget _buildFilterChip(String label, String value, bool isSelected) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label, style: TextStyle(color: isSelected ? Colors.white : Colors.black87, fontWeight: FontWeight.bold)),
        selected: isSelected,
        selectedColor: Colors.green.shade800,
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24), side: BorderSide(color: isSelected ? Colors.green.shade800 : Colors.black12)),
        onSelected: (val) {
          if (val) setState(() => _filter = value);
        },
      ),
    );
  }
}

// ----- IMPLEMENTED AUTH SCREENS -----

class UserRegisterScreen extends StatefulWidget {
  const UserRegisterScreen({super.key});
  @override State<UserRegisterScreen> createState() => _UserRegisterScreenState();
}

class _UserRegisterScreenState extends State<UserRegisterScreen> {
  final _nameCtrl = TextEditingController();
  final _ageCtrl = TextEditingController();
  final _genderCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _usernameCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _loading = false;
  String _error = '';

  Future<void> _register() async {
    setState(() => _error = '');
    if (_nameCtrl.text.isEmpty || _passwordCtrl.text.isEmpty || _usernameCtrl.text.isEmpty) {
      setState(() => _error = 'Please fill all required fields');
      return;
    }
    setState(() => _loading = true);
    final res = await context.read<AuthProvider>().registerUser(
      name: _nameCtrl.text, age: _ageCtrl.text.isEmpty ? '0' : _ageCtrl.text, gender: _genderCtrl.text,
      phone: _phoneCtrl.text, username: _usernameCtrl.text, password: _passwordCtrl.text,
    );
    setState(() => _loading = false);
    
    if (res['success'] == true) {
      Navigator.pop(context);
    } else {
      setState(() => _error = res['message']);
    }
  }

  @override Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: false,
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(title: const Text('Victim Registration'), backgroundColor: Colors.transparent),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          if (_error.isNotEmpty) Text(_error, style: const TextStyle(color: Colors.red)),
          TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Full Name', filled: true, fillColor: Colors.white10), style: const TextStyle(color: Colors.white)),
          const SizedBox(height: 12),
          TextField(controller: _usernameCtrl, decoration: const InputDecoration(labelText: 'Username', filled: true, fillColor: Colors.white10), style: const TextStyle(color: Colors.white)),
          const SizedBox(height: 12),
          TextField(controller: _passwordCtrl, obscureText: true, decoration: const InputDecoration(labelText: 'Password', filled: true, fillColor: Colors.white10), style: const TextStyle(color: Colors.white)),
          const SizedBox(height: 12),
          TextField(controller: _phoneCtrl, decoration: const InputDecoration(labelText: 'Phone', filled: true, fillColor: Colors.white10), style: const TextStyle(color: Colors.white)),
          const SizedBox(height: 12),
          TextField(controller: _ageCtrl, decoration: const InputDecoration(labelText: 'Age', filled: true, fillColor: Colors.white10), style: const TextStyle(color: Colors.white)),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _loading ? null : _register,
            style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo, padding: const EdgeInsets.symmetric(vertical: 16)),
            child: _loading ? const CircularProgressIndicator() : const Text('Register', style: TextStyle(color: Colors.white)),
          )
        ],
      )
    );
  }
}

class AuthorityLoginScreen extends StatefulWidget {
  const AuthorityLoginScreen({super.key});
  @override State<AuthorityLoginScreen> createState() => _AuthorityLoginScreenState();
}

class _AuthorityLoginScreenState extends State<AuthorityLoginScreen> {
  final _grCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  String _error = '';

  Future<void> _login() async {
    setState(() => _loading = true);
    final res = await context.read<AuthProvider>().loginAuthority(_grCtrl.text, _passCtrl.text);
    setState(() => _loading = false);
    if (res['success'] == true) Navigator.pushReplacementNamed(context, '/dashboard');
    else setState(() => _error = res['message'] ?? 'Login failed');
  }

  @override Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: false,
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(title: const Text('Authority Portal'), backgroundColor: Colors.transparent),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Icon(Icons.local_hospital, size: 64, color: Colors.redAccent),
          const SizedBox(height: 24),
          if (_error.isNotEmpty) Text(_error, style: const TextStyle(color: Colors.red)),
          TextField(controller: _grCtrl, decoration: const InputDecoration(labelText: 'GR Number', filled: true, fillColor: Colors.white10), style: const TextStyle(color: Colors.white)),
          const SizedBox(height: 12),
          TextField(controller: _passCtrl, obscureText: true, decoration: const InputDecoration(labelText: 'Password', filled: true, fillColor: Colors.white10), style: const TextStyle(color: Colors.white)),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _loading ? null : _login,
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, padding: const EdgeInsets.symmetric(vertical: 16)),
            child: _loading ? const CircularProgressIndicator() : const Text('Login as Authority', style: TextStyle(color: Colors.white)),
          ),
          TextButton(onPressed: () => Navigator.pushNamed(context, '/authority-register'), child: const Text('Register Medical Facility'))
        ],
      )
    );
  }
}

class AuthorityRegisterScreen extends StatefulWidget {
  const AuthorityRegisterScreen({super.key});
  @override State<AuthorityRegisterScreen> createState() => _AuthorityRegisterScreenState();
}

class _AuthorityRegisterScreenState extends State<AuthorityRegisterScreen> {
  final _orgCtrl = TextEditingController();
  final _grCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _hasVenom = false;
  bool _loading = false;
  String _error = '';

  Future<void> _register() async {
    setState(() => _loading = true);
    final res = await context.read<AuthProvider>().registerAuthority(
      organizationName: _orgCtrl.text, grNumber: _grCtrl.text, password: _passCtrl.text, antivenomAvailable: _hasVenom
    );
    setState(() => _loading = false);
    if (res['success'] == true) Navigator.pop(context);
    else setState(() => _error = res['message'] ?? 'Registration failed');
  }

  @override Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: false,
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(title: const Text('Facility Registration'), backgroundColor: Colors.transparent),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          if (_error.isNotEmpty) Text(_error, style: const TextStyle(color: Colors.red)),
          TextField(controller: _orgCtrl, decoration: const InputDecoration(labelText: 'Organization Name', filled: true, fillColor: Colors.white10), style: const TextStyle(color: Colors.white)),
          const SizedBox(height: 12),
          TextField(controller: _grCtrl, decoration: const InputDecoration(labelText: 'GR Number', filled: true, fillColor: Colors.white10), style: const TextStyle(color: Colors.white)),
          const SizedBox(height: 12),
          TextField(controller: _passCtrl, obscureText: true, decoration: const InputDecoration(labelText: 'Password', filled: true, fillColor: Colors.white10), style: const TextStyle(color: Colors.white)),
          const SizedBox(height: 12),
          SwitchListTile(
            title: const Text('Anti-venom Stocked', style: TextStyle(color: Colors.white)),
            value: _hasVenom,
            activeColor: Colors.green,
            onChanged: (v) => setState(() => _hasVenom = v),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _loading ? null : _register,
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, padding: const EdgeInsets.symmetric(vertical: 16)),
            child: _loading ? const CircularProgressIndicator() : const Text('Register Facility', style: TextStyle(color: Colors.white)),
          )
        ],
      )
    );
  }
}
