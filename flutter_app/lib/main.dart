import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'services/supabase_service.dart';
import 'providers/auth_provider.dart';
import 'providers/emergency_provider.dart';
import 'screens/entry_screen.dart';
import 'screens/home_screen.dart';
import 'screens/auth_screens.dart';
import 'screens/sos_screen.dart';
import 'screens/map_screen.dart';
import 'screens/detect_screen.dart';
import 'screens/secondary_screens.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  await SupabaseService.initialize();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => EmergencyProvider()),
      ],
      child: const SnakeSosApp(),
    ),
  );
}

class SnakeSosApp extends StatelessWidget {
  const SnakeSosApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Snake SOS',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.indigo,
          brightness: Brightness.dark,
          surface: const Color(0xFF0F172A), // Matches Tailwind bg-zg-bg
        ),
        useMaterial3: true,
      ),
      initialRoute: '/',
      onGenerateRoute: (settings) {
        // App Routes matching React setup
        switch (settings.name) {
          case '/': return MaterialPageRoute(builder: (_) => EntryScreen());
          case '/user-login': return MaterialPageRoute(builder: (_) => UserLoginScreen());
          case '/user-register': return MaterialPageRoute(builder: (_) => UserRegisterScreen());
          case '/authority-login': return MaterialPageRoute(builder: (_) => AuthorityLoginScreen());
          case '/authority-register': return MaterialPageRoute(builder: (_) => AuthorityRegisterScreen());
          case '/dashboard': return MaterialPageRoute(builder: (_) => AuthorityDashboardScreen());
          default:
            // Protected routes go to MainLayout if logged in (handled within MainLayout)
            return MaterialPageRoute(builder: (_) => MainLayoutScreen(initialRoute: settings.name));
        }
      },
    );
  }
}

class MainLayoutScreen extends StatefulWidget {
  final String? initialRoute;
  const MainLayoutScreen({super.key, this.initialRoute});

  @override
  State<MainLayoutScreen> createState() => _MainLayoutScreenState();
}

class _MainLayoutScreenState extends State<MainLayoutScreen> {
  int _currentIndex = 0;
  
  final List<Widget> _pages = [
    HomeScreen(),
    MapScreen(),
    SosScreen(),     // Middle button SOS
    DetectScreen(),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    // Map initial route to tab index
    if (widget.initialRoute == '/map') _currentIndex = 1;
    if (widget.initialRoute == '/sos') _currentIndex = 2;
    if (widget.initialRoute == '/detect') _currentIndex = 3;
    if (widget.initialRoute == '/profile') _currentIndex = 4;
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    
    if (auth.loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    
    if (auth.user == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Navigator.of(context).pushReplacementNamed('/');
      });
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (auth.user!.role == 'authority') {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Navigator.of(context).pushReplacementNamed('/dashboard');
      });
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      body: _pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.map), label: 'Map'),
          BottomNavigationBarItem(
            icon: CircleAvatar(
              backgroundColor: Colors.red,
              child: Icon(Icons.warning, color: Colors.white),
            ),
            label: 'SOS'
          ),
          BottomNavigationBarItem(icon: Icon(Icons.camera_alt), label: 'Detect'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
