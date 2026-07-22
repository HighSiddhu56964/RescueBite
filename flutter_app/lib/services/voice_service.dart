import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:audioplayers/audioplayers.dart';
import 'system_prompt.dart';
import 'dart:io';

class VoiceService {
  static String get _sarvamKey => dotenv.env['SARVAM_API_KEY']!;

  static Future<String?> askSarvamLLM(List<Map<String, String>> messages) async {
    try {
      final dynamicSystemContext = messages
          .where((m) => m['role'] == 'system')
          .map((m) => m['content'])
          .join('\n\n');
      
      final combinedSystemPrompt = [systemPrompt, dynamicSystemContext]
          .where((s) => s.isNotEmpty)
          .join('\n\n');

      var sanitizedMessages = messages
          .where((m) => m['role'] != 'system')
          .map((m) {
            String content = m['content'] ?? '';
            content = content.replaceAll(RegExp(r'<think>[\s\S]*?<\/think>', caseSensitive: false), '');
            return {'role': m['role']!, 'content': content.trim()};
          })
          .where((m) => m['content']!.isNotEmpty)
          .toList();

      int firstUserIndex = sanitizedMessages.indexWhere((m) => m['role'] == 'user');
      if (firstUserIndex >= 0) {
        sanitizedMessages = sanitizedMessages.sublist(firstUserIndex);
      }

      if (sanitizedMessages.isNotEmpty && sanitizedMessages.last['role'] == 'user') {
        sanitizedMessages.last['content'] = '${sanitizedMessages.last['content']}\n\n[System Note: Provide your answer with "Risk Level:" and "First Aid:". Respond in the exact same language as this user\'s input.]';
      }

      final body = {
        "model": "sarvam-m",
        "messages": [
          {"role": "system", "content": combinedSystemPrompt},
          ...sanitizedMessages
        ],
        "max_tokens": 512,
        "temperature": 0.3
      };

      final response = await http.post(
        Uri.parse("https://api.sarvam.ai/v1/chat/completions"),
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": _sarvamKey,
        },
        body: jsonEncode(body),
      );

      if (response.statusCode != 200) {
        print("LLM API error: ${response.body}");
        return null;
      }

      final data = jsonDecode(response.body);
      if (data['choices'] != null && data['choices'].isNotEmpty) {
        String replyStr = data['choices'][0]['message']['content'] ?? "";
        replyStr = replyStr.replaceAll(RegExp(r'<think>[\s\S]*?<\/think>', caseSensitive: false), '').trim();
        return replyStr.isNotEmpty ? replyStr : null;
      }
      return null;
    } catch (e) {
      print("LLM ERROR: $e");
      return null;
    }
  }

  static Future<String> sarvamSpeechToText(File audioFile) async {
    try {
      var request = http.MultipartRequest(
        'POST', 
        Uri.parse("https://api.sarvam.ai/speech-to-text")
      );
      
      request.headers['api-subscription-key'] = _sarvamKey;
      request.fields['model'] = "saaras:v3";
      request.fields['mode'] = "transcribe";
      
      request.files.add(await http.MultipartFile.fromPath('file', audioFile.path));
      
      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode != 200) {
         throw Exception("Sarvam STT failed: ${response.statusCode}: ${response.body}");
      }

      final data = jsonDecode(response.body);
      return data['transcript'] ?? "";
    } catch (e) {
      print("STT Error: $e");
      return "";
    }
  }

  static Future<void> sarvamTextToSpeech(String text, AudioPlayer player) async {
    final safeText = text.length > 400 ? text.substring(0, 400) : text;

    try {
      final response = await http.post(
        Uri.parse("https://api.sarvam.ai/text-to-speech"),
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": _sarvamKey,
        },
        body: jsonEncode({
          "inputs": [safeText],
          "target_language_code": "en-IN",
          "speaker": "shubh",
          "model": "bulbul:v3",
          "pace": 1.0
        }),
      );

      if (response.statusCode != 200) {
        throw Exception("Sarvam TTS failed: ${response.statusCode} ${response.body}");
      }

      final data = jsonDecode(response.body);
      if (data['audios'] == null || data['audios'].isEmpty) {
        throw Exception("No audio returned from Sarvam TTS");
      }

      final String audioBase64 = data['audios'][0];
      final audioBytes = base64Decode(audioBase64);

      await player.play(BytesSource(audioBytes));
    } catch (e) {
      print("TTS Error: $e");
    }
  }
}
