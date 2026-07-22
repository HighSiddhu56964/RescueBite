import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/supabase_service.dart';
import '../models/user_model.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AuthProvider with ChangeNotifier {
  UserModel? _user;
  bool _loading = true;

  UserModel? get user => _user;
  bool get loading => _loading;

  static const String _storageKey = 'snakesafe_user';

  AuthProvider() {
    _loadSession();
  }

  Future<void> _loadSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final stored = prefs.getString(_storageKey);
      if (stored != null) {
        _user = UserModel.fromJson(jsonDecode(stored));
      }
    } catch (e) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_storageKey);
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> _saveSession(UserModel userData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, jsonEncode(userData.toJson()));
    _user = userData;
    notifyListeners();
  }

  Future<Map<String, dynamic>> loginUser(String username, String password) async {
    try {
      final data = await SupabaseService.client
          .from('users')
          .select('*')
          .eq('username', username)
          .eq('password', password)
          .single();

      final session = UserModel.fromJson({...data, 'role': 'user'});
      await _saveSession(session);
      return {'success': true, 'user': session};
    } on PostgrestException catch (_) {
      return {'success': false, 'message': 'Invalid credentials'};
    } catch (e) {
      return {'success': false, 'message': 'Login Error: $e'};
    }
  }

  Future<Map<String, dynamic>> registerUser({
    required String name,
    required String age,
    required String gender,
    required String phone,
    required String username,
    required String password,
  }) async {
    try {
      // Check if username exists
      final existingUser = await SupabaseService.client.from('users').select('id').eq('username', username).maybeSingle();
      if (existingUser != null) {
        return {'success': false, 'message': 'Username already taken'};
      }

      // Check if phone exists
      final existingPhone = await SupabaseService.client.from('users').select('id').eq('phone', phone).maybeSingle();
      if (existingPhone != null) {
        return {'success': false, 'message': 'Phone number already registered'};
      }

      final data = await SupabaseService.client.from('users').insert([{
        'name': name,
        'age': int.parse(age),
        'gender': gender,
        'phone': phone,
        'username': username,
        'password': password,
        'role': 'user'
      }]).select().single();

      return {'success': true, 'user': data};
    } catch (e) {
      return {'success': false, 'message': 'Registration failed: $e'};
    }
  }

  Future<Map<String, dynamic>> loginAuthority(String grNumber, String password) async {
    try {
      final data = await SupabaseService.client
          .from('authorities')
          .select('*')
          .eq('gr_number', grNumber)
          .eq('password', password)
          .single();

      final session = UserModel(
        id: data['id'].toString(),
        name: data['name'],
        grNumber: data['gr_number'],
        role: 'authority',
      );
      await _saveSession(session);
      return {'success': true, 'user': session};
    } catch (_) {
      return {'success': false, 'message': 'Invalid GR Number or Password'};
    }
  }

  Future<Map<String, dynamic>> registerAuthority({
    required String organizationName,
    required String grNumber,
    required String password,
    required bool antivenomAvailable,
  }) async {
    try {
      final existing = await SupabaseService.client.from('authorities').select('id').eq('gr_number', grNumber).maybeSingle();
      if (existing != null) {
        return {'success': false, 'message': 'GR Number already registered'};
      }

      await SupabaseService.client.from('authorities').insert([{
        'name': organizationName,
        'gr_number': grNumber,
        'password': password,
        'antivenom_available': antivenomAvailable,
      }]);

      return {'success': true};
    } catch (e) {
      return {'success': false, 'message': 'Registration failed: $e'};
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_storageKey);
    await prefs.remove('snakesafe_symptom_cache');
    await prefs.remove('snakesafe_language');
    _user = null;
    notifyListeners();
  }
}
