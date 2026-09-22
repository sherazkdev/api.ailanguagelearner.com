import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:lingua_ai/core/services/adservices/ad_remote_config.dart';

/// Gemini generateContent API wrapper for role-play chat.
class GeminiService {
  GeminiService._();

  static const Duration _requestTimeout = Duration(seconds: 30);

  static String get _apiKey => AdRemoteConfig.geminiApiKey();

  static String get _model => AdRemoteConfig.geminiModel();

  static String get _endpoint =>
      'https://generativelanguage.googleapis.com/v1beta/models/$_model:generateContent';

  static bool get isConfigured => _apiKey.isNotEmpty;

  /// Sends [userMessage] with optional [history] and [systemInstruction].
  /// Returns assistant text or `null` on failure / missing API key.
  static Future<String?> generateReply({
    required String systemInstruction,
    required String userMessage,
    List<GeminiChatTurn> history = const [],
  }) async {
    if (!isConfigured) {
      debugPrint('GeminiService: Remote Config api_key is empty.');
      return null;
    }

    try {
      final uri = Uri.parse('$_endpoint?key=$_apiKey');
      final contents = <Map<String, dynamic>>[
        for (final turn in history)
          {
            'role': turn.isUser ? 'user' : 'model',
            'parts': [
              {'text': turn.text},
            ],
          },
        {
          'role': 'user',
          'parts': [
            {'text': userMessage},
          ],
        },
      ];

      final body = jsonEncode({
        'systemInstruction': {
          'parts': [
            {'text': systemInstruction},
          ],
        },
        'contents': contents,
        'generationConfig': {
          'temperature': 0.7,
          'maxOutputTokens': 512,
        },
        'safetySettings': [
          {'category': 'HARM_CATEGORY_HARASSMENT', 'threshold': 'BLOCK_MEDIUM_AND_ABOVE'},
          {'category': 'HARM_CATEGORY_HATE_SPEECH', 'threshold': 'BLOCK_MEDIUM_AND_ABOVE'},
          {'category': 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'threshold': 'BLOCK_MEDIUM_AND_ABOVE'},
          {'category': 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold': 'BLOCK_MEDIUM_AND_ABOVE'},
        ],
      });

      final response = await http
          .post(
            uri,
            headers: {'Content-Type': 'application/json'},
            body: body,
          )
          .timeout(_requestTimeout);

      if (response.statusCode != 200) {
        debugPrint(
          'GeminiService error ${response.statusCode} (model=$_model): ${response.body}',
        );
        return null;
      }

      final json = jsonDecode(response.body) as Map<String, dynamic>;
      final candidates = json['candidates'] as List<dynamic>?;
      if (candidates == null || candidates.isEmpty) return null;

      final content = candidates.first['content'] as Map<String, dynamic>?;
      final parts = content?['parts'] as List<dynamic>?;
      if (parts == null || parts.isEmpty) return null;

      final text = parts.first['text'] as String?;
      return text?.trim();
    } catch (e, st) {
      debugPrint('GeminiService exception: $e\n$st');
      return null;
    }
  }
}

class GeminiChatTurn {
  const GeminiChatTurn({required this.text, required this.isUser});

  final String text;
  final bool isUser;
}
