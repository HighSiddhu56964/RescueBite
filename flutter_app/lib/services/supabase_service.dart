import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class SupabaseService {
  static Future<void> initialize() async {
    await Supabase.initialize(
      url: dotenv.env['https://isvezasnpjgtzlpxqoii.supabase.co']!,
      anonKey: dotenv.env['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzdmV6YXNucGpndHpscHhxb2lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjE5NDQsImV4cCI6MjA5MDA5Nzk0NH0.9ptd06YO-ZU8HoYYlmAb2d_eQyQDOQJAiQ8J5CnbPtk']!,
    );
  }

  static SupabaseClient get client => Supabase.instance.client;
}
