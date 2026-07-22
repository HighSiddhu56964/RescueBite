import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class EntryScreen extends StatelessWidget {
  const EntryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      body: Stack(
        children: [
          // Background Color
          Container(color: Theme.of(context).colorScheme.surface),
          
          // Decorative Orbs
          Positioned(
            top: -100, right: -50,
            child: Container(
              width: 300, height: 300,
              decoration: BoxDecoration(
                color: Colors.indigo.withOpacity(0.1),
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(blurRadius: 100, color: Colors.indigo.withOpacity(0.1))],
              ),
            ),
          ),

          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo
                  Container(
                    width: 80, height: 80,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [Colors.indigo, Colors.purple]),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [BoxShadow(color: Colors.indigo.withOpacity(0.5), blurRadius: 20, offset: const Offset(0, 5))],
                    ),
                    child: const Icon(Icons.security, size: 40, color: Colors.white),
                  ),
                  const SizedBox(height: 20),
                  const Text('RescueBite', style: TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: Colors.white)),
                  const SizedBox(height: 8),
                  Text('Emergency Snakebite Response System', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.grey.shade400)),
                  const SizedBox(height: 60),

                  // User Login Button
                  ElevatedButton(
                    onPressed: () => Navigator.pushNamed(context, '/user-login'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: Colors.indigo,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 8,
                      minimumSize: const Size(double.infinity, 50),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.person, size: 20),
                        SizedBox(width: 8),
                        Text('User Login', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Authority Login Button
                  OutlinedButton(
                    onPressed: () => Navigator.pushNamed(context, '/authority-login'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: BorderSide(color: Colors.grey.shade800, width: 2),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      minimumSize: const Size(double.infinity, 50),
                      foregroundColor: Colors.white,
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.admin_panel_settings, size: 20),
                        SizedBox(width: 8),
                        Text('Authority Login', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24.0),
                    child: Row(
                      children: [
                        Expanded(child: Divider(color: Colors.grey)),
                        Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16.0),
                          child: Text('OR', style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
                        ),
                        Expanded(child: Divider(color: Colors.grey)),
                      ],
                    ),
                  ),

                  // Quick SOS Button
                  ElevatedButton(
                    onPressed: () => Navigator.pushNamed(context, '/sos'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: Colors.redAccent,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 8,
                      minimumSize: const Size(double.infinity, 50),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.warning_amber_rounded, size: 20),
                        SizedBox(width: 8),
                        Text('Quick Emergency SOS', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),

                  if (auth.user != null) ...[
                    const SizedBox(height: 32),
                    TextButton(
                      onPressed: () {
                        if (auth.user!.role == 'authority') {
                          Navigator.pushReplacementNamed(context, '/dashboard');
                        } else {
                          Navigator.pushReplacementNamed(context, '/home');
                        }
                      },
                      child: Text('Continue as ${auth.user!.name.split(' ')[0]} →', style: const TextStyle(color: Colors.indigoAccent, fontWeight: FontWeight.bold)),
                    )
                  ]
                ],
              ),
            ),
          ),
          
          Positioned(
            bottom: 30, left: 0, right: 0,
            child: Center(child: Text('RescueBite v2.0 • Emergency Response', style: TextStyle(color: Colors.grey.shade600, fontSize: 11, fontWeight: FontWeight.w500))),
          )
        ],
      ),
    );
  }
}
