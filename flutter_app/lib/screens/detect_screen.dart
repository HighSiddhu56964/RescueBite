import 'dart:async';
import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:image_picker/image_picker.dart';

enum AppState { ready, camera, analyzing, results, error }

class DetectScreen extends StatefulWidget {
  const DetectScreen({super.key});

  @override
  State<DetectScreen> createState() => _DetectScreenState();
}

class _DetectScreenState extends State<DetectScreen> with TickerProviderStateMixin {
  CameraController? _cameraController;
  final ImagePicker _picker = ImagePicker();
  bool _isCameraInitialized = false;

  AppState _appState = AppState.ready;
  String _analyzeMsg = 'Analyzing image...';
  String _errorMsg = '';
  
  // Mock Results Data
  Map<String, dynamic>? _result;

  late AnimationController _pulseController;
  late AnimationController _scanController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _scanController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _pulseController.dispose();
    _scanController.dispose();
    super.dispose();
  }

  Future<void> _startCamera() async {
    setState(() => _appState = AppState.camera);
    try {
      final cameras = await availableCameras();
      if (cameras.isNotEmpty) {
        // Try getting a back camera
        final backCamera = cameras.firstWhere(
            (c) => c.lensDirection == CameraLensDirection.back,
            orElse: () => cameras.first);

        _cameraController = CameraController(backCamera, ResolutionPreset.high, enableAudio: false);
        await _cameraController!.initialize();
        if (mounted) setState(() => _isCameraInitialized = true);
      }
    } catch (e) {
      setState(() {
        _errorMsg = "Camera error: ${e.toString()}";
        _appState = AppState.error;
      });
    }
  }

  void _stopCamera() {
    _cameraController?.dispose();
    _cameraController = null;
    _isCameraInitialized = false;
  }

  Future<void> _handleFileChange() async {
    try {
      final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
      if (image != null) {
        setState(() {
          _appState = AppState.analyzing;
          _analyzeMsg = 'Analyzing image...';
        });
        await _runMockInference();
      }
    } catch (e) {
      setState(() {
        _errorMsg = "Failed to load image";
        _appState = AppState.error;
      });
    }
  }

  Future<void> _captureFromCamera() async {
    if (_cameraController != null && _cameraController!.value.isInitialized) {
      setState(() {
        _appState = AppState.analyzing;
        _analyzeMsg = 'Analyzing capture...';
      });
      try {
        final XFile _ = await _cameraController!.takePicture();
        _stopCamera();
        await _runMockInference();
      } catch (e) {
        setState(() {
          _errorMsg = "Capture failed: $e";
          _appState = AppState.error;
        });
      }
    }
  }

  Future<void> _runMockInference() async {
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;
    setState(() {
      _result = {
        'is_snakebite': true,
        'venomous': true,
        'risk_level': 'HIGH',
        'confidence': 0.94,
        'raw_class': 'Venemous_Bite_Cobra',
        'all': [
          {'className': 'Venemous_Bite_Cobra', 'probability': 0.94},
          {'className': 'NonVenemous_Bite', 'probability': 0.04},
          {'className': 'Not_SnakeBite', 'probability': 0.02},
        ]
      };
      _appState = AppState.results;
    });
  }

  void _resetAll() {
    _stopCamera();
    setState(() {
      _result = null;
      _errorMsg = '';
      _appState = AppState.ready;
    });
  }

  Widget _buildTopBar() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GestureDetector(
          onTap: () => Navigator.pop(context),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.3),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFF1B4332).withOpacity(0.4)),
              boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0,4))],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: const [
                Icon(Icons.arrow_back_ios_new, size: 14, color: Color(0xFF1B4332)),
                SizedBox(width: 4),
                Text('Back to Home', style: TextStyle(color: Color(0xFF1B4332), fontSize: 13, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text('DETECT SNAKEBITE', style: TextStyle(color: Color(0xCC11311B), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                  Text('Identify & Act', style: TextStyle(color: Color(0xFF11311B), fontSize: 28, fontWeight: FontWeight.w900, height: 1.1)),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.6)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  FadeTransition(
                    opacity: _pulseController,
                    child: Container(width: 10, height: 10, decoration: const BoxDecoration(color: Color(0xFF4ADE80), shape: BoxShape.circle, boxShadow: [BoxShadow(color: Color(0xFF4ADE80), blurRadius: 4)])),
                  ),
                  const SizedBox(width: 4),
                  const Text('AI READY', style: TextStyle(color: Color(0xFF11311B), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
                ],
              ),
            )
          ],
        )
      ],
    );
  }

  Widget _buildReadyState() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: _startCamera,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  decoration: BoxDecoration(
                    color: const Color(0xFF295B36),
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: const [
                      BoxShadow(color: Color(0x66295B36), offset: Offset(0, 15), blurRadius: 30),
                      BoxShadow(color: Colors.white30, offset: Offset(0, 2), blurRadius: 4, inset: true)
                    ],
                  ),
                  child: Column(
                    children: [
                      Container(
                        width: 52, height: 40,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border(top: BorderSide(color: Colors.white.withOpacity(0.4), width: 2), left: BorderSide(color: Colors.white.withOpacity(0.4), width: 2)),
                        ),
                        child: const Icon(Icons.camera_alt_outlined, color: Colors.white, size: 24),
                      ),
                      const SizedBox(height: 8),
                      const Text('Use Camera', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: GestureDetector(
                onTap: _handleFileChange,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF4F7F5),
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(color: Colors.white, width: 1.5),
                    boxShadow: const [BoxShadow(color: Color(0x0D000000), offset: Offset(0, 15), blurRadius: 30)],
                  ),
                  child: Column(
                    children: [
                      Container(
                        width: 52, height: 40,
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(12),
                          border: Border(top: BorderSide(color: Colors.white, width: 2), left: BorderSide(color: Colors.white, width: 2)),
                        ),
                        child: const Icon(Icons.upload_file_outlined, color: Color(0xFF9D8665), size: 24),
                      ),
                      const SizedBox(height: 8),
                      const Text('Upload Photo', style: TextStyle(color: Color(0xCC11311B), fontSize: 14, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        const Text('Capture or upload a wound image to analyze', style: TextStyle(color: Color(0xB311311B), fontSize: 13, fontWeight: FontWeight.w500)),
        const SizedBox(height: 16),

        // Features Card
        ClipRRect(
          borderRadius: BorderRadius.circular(32),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.3),
                borderRadius: BorderRadius.circular(32),
                border: Border(top: BorderSide(color: Colors.white.withOpacity(0.6), width: 2), left: BorderSide(color: Colors.white.withOpacity(0.6), width: 2)),
              ),
              child: Column(
                children: [
                  _buildFeatureRow('🐍', 'Identify if it\'s a snakebite', 'Bite Detection'),
                  const SizedBox(height: 10),
                  _buildFeatureRow('⚠️', 'Venomous vs non-venomous', 'Venom Classification'),
                  const SizedBox(height: 10),
                  _buildFeatureRow('💊', 'Risk-specific treatment steps', 'First Aid Guidance'),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 100), // Space for absolute image
      ],
    );
  }

  Widget _buildFeatureRow(String emoji, String description, String title) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.5),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.7)),
      ),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 24)),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Color(0xFF11311B), fontWeight: FontWeight.w900, fontSize: 15)),
                Text(description, style: TextStyle(color: const Color(0xFF11311B).withOpacity(0.7), fontSize: 12, fontWeight: FontWeight.w500)),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildCameraState() {
    return Column(
      children: [
        Container(
          height: 300,
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFF6366F1), width: 2),
            boxShadow: const [BoxShadow(color: Color(0x666366F1), blurRadius: 20)],
          ),
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (_isCameraInitialized)
                 ClipRRect(borderRadius: BorderRadius.circular(22), child: CameraPreview(_cameraController!)),
              // Scan Line
              AnimatedBuilder(
                animation: _scanController,
                builder: (context, child) {
                  return Positioned(
                    top: _scanController.value * 300,
                    left: 0,
                    right: 0,
                    child: Container(
                      height: 3,
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(colors: [Colors.transparent, Color(0xFF6366F1), Colors.transparent]),
                        boxShadow: [BoxShadow(color: Color(0xFF6366F1), blurRadius: 10)],
                      ),
                    ),
                  );
                },
              ),
              // Corner brackets
              ..._buildCameraBrackets(),
              // Live badge
              Positioned(
                top: 12, left: 0, right: 0,
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(12)),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        FadeTransition(opacity: _pulseController, child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFF6366F1), shape: BoxShape.circle))),
                        const SizedBox(width: 6),
                        const Text('LIVE FEED', style: TextStyle(color: Color(0xFF6366F1), fontSize: 11, fontWeight: FontWeight.bold, fontFamily: 'monospace')),
                      ],
                    ),
                  ),
                ),
              )
            ],
          ),
        ),
        const SizedBox(height: 16),
        InkWell(
          onTap: _captureFromCamera,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF4338CA)]),
              borderRadius: BorderRadius.circular(16),
              boxShadow: const [BoxShadow(color: Color(0x666366F1), offset: Offset(0, 10), blurRadius: 20)],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(Icons.camera, color: Colors.white, size: 20),
                SizedBox(width: 8),
                Text('Capture & Analyze', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        InkWell(
          onTap: () {
            _stopCamera();
            setState(() => _appState = AppState.ready);
          },
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.black12),
            ),
            child: const Center(child: Text('Cancel', style: TextStyle(color: Colors.black45, fontSize: 14, fontWeight: FontWeight.bold))),
          ),
        ),
      ],
    );
  }
  
  List<Widget> _buildCameraBrackets() {
    return [
      Positioned(top: 12, left: 12, child: _bracket(Border(top: BorderSide(color: Color(0xFF6366F1), width: 3), left: BorderSide(color: Color(0xFF6366F1), width: 3)))),
      Positioned(top: 12, right: 12, child: _bracket(Border(top: BorderSide(color: Color(0xFF6366F1), width: 3), right: BorderSide(color: Color(0xFF6366F1), width: 3)))),
      Positioned(bottom: 12, left: 12, child: _bracket(Border(bottom: BorderSide(color: Color(0xFF6366F1), width: 3), left: BorderSide(color: Color(0xFF6366F1), width: 3)))),
      Positioned(bottom: 12, right: 12, child: _bracket(Border(bottom: BorderSide(color: Color(0xFF6366F1), width: 3), right: BorderSide(color: Color(0xFF6366F1), width: 3)))),
    ];
  }
  Widget _bracket(Border b) => Container(width: 28, height: 28, decoration: BoxDecoration(border: b));

  Widget _buildAnalyzingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 48),
          const SizedBox(
            width: 44, height: 44,
            child: CircularProgressIndicator(color: Color(0xFF6366F1), strokeWidth: 3),
          ),
          const SizedBox(height: 16),
          Text(_analyzeMsg, style: const TextStyle(color: Color(0xFF11311B), fontSize: 14, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildResultsState() {
    if (_result == null) return const SizedBox.shrink();

    final bool isSnakebite = _result!['is_snakebite'];
    final bool? venomous = _result!['venomous'];
    final String riskLevel = _result!['risk_level'];
    final double confidence = _result!['confidence'];
    final String rawClass = _result!['raw_class'];
    final List<dynamic> allProbs = _result!['all'];

    Color cardColor, textColor, borderColor;
    String headerEmoji, headerTitle;

    if (riskLevel == 'HIGH') {
      textColor = const Color(0xFFDC2626); cardColor = const Color(0xFFFEF2F2); borderColor = const Color(0xFFFECACA);
      headerEmoji = '🚨'; headerTitle = 'VENOMOUS BITE DETECTED';
    } else if (riskLevel == 'MEDIUM') {
      textColor = const Color(0xFFF59E0B); cardColor = const Color(0xFFFFFBEB); borderColor = const Color(0xFFFDE68A);
      headerEmoji = '⚠️'; headerTitle = 'POSSIBLE VENOMOUS BITE';
    } else if (riskLevel == 'LOW') {
      textColor = const Color(0xFF059669); cardColor = const Color(0xFFECFDF5); borderColor = const Color(0xFFA7F3D0);
      headerEmoji = '🟢'; headerTitle = 'Non-Venomous Bite';
    } else {
      textColor = const Color(0xFF6366F1); cardColor = const Color(0xFFEEF2FF); borderColor = const Color(0xFFC7D2FE);
      headerEmoji = isSnakebite == false ? '✅' : '❓'; headerTitle = isSnakebite == false ? 'Not a Snakebite' : 'Unable to Determine';
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.black12),
        boxShadow: const [BoxShadow(color: Colors.black12, offset: Offset(0, 10), blurRadius: 20)],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Text(headerEmoji, style: const TextStyle(fontSize: 40)),
          const SizedBox(height: 8),
          Text(headerTitle, style: const TextStyle(color: Color(0xFF11311B), fontSize: 20, fontWeight: FontWeight.w900), textAlign: TextAlign.center),
          const SizedBox(height: 20),

          // 2x2 Grid Info
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10, crossAxisSpacing: 10, childAspectRatio: 2.2,
            children: [
              _infoTile('SNAKEBITE', isSnakebite ? 'YES' : 'NO', isSnakebite ? const Color(0xFFDC2626) : const Color(0xFF059669), isSnakebite ? const Color(0xFFFECACA) : const Color(0xFFA7F3D0)),
              _infoTile('VENOMOUS', venomous == true ? 'YES' : venomous == false ? 'NO' : 'N/A', venomous == true ? const Color(0xFFDC2626) : const Color(0xFF059669), venomous == true ? const Color(0xFFFECACA) : const Color(0xFFA7F3D0)),
              _infoTile('RISK LEVEL', riskLevel, textColor, borderColor),
              _infoTile('CONFIDENCE', '${(confidence * 100).toStringAsFixed(1)}%', confidence >= 0.75 ? const Color(0xFF059669) : const Color(0xFFF59E0B), confidence >= 0.75 ? const Color(0xFFA7F3D0) : const Color(0xFFFDE68A)),
            ],
          ),
          const SizedBox(height: 20),

          // Confidence Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: confidence,
              minHeight: 8,
              backgroundColor: const Color(0xFFE4EBE6),
              valueColor: AlwaysStoppedAnimation(textColor),
            ),
          ),
          const SizedBox(height: 20),

          // Probabilities
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('CLASS PROBABILITIES', style: TextStyle(color: Colors.black45, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
              const SizedBox(height: 8),
              ...allProbs.map((p) => Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(p['className'], style: TextStyle(color: p['className'] == rawClass ? const Color(0xFF11311B) : Colors.black45, fontSize: 12, fontWeight: p['className'] == rawClass ? FontWeight.bold : FontWeight.normal)),
                        Text('${(p['probability'] * 100).toStringAsFixed(1)}%', style: const TextStyle(color: Colors.black45, fontSize: 12)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    LinearProgressIndicator(value: p['probability'], minHeight: 4, backgroundColor: const Color(0xFFE4EBE6), valueColor: AlwaysStoppedAnimation(p['className'] == rawClass ? const Color(0xFF6366F1) : const Color(0xFFCBD5E1))),
                  ],
                ),
              )),
            ],
          ),
          const SizedBox(height: 20),

          // Actions
          if (isSnakebite) ...[
            _actionButton('🩺 Check Symptoms', const Color(0xFF6366F1), Colors.white, () {}),
            const SizedBox(height: 10),
            _actionButton('🚨 Call 112 / Send SOS', const Color(0xFFDC2626), Colors.white, () => Navigator.pushReplacementNamed(context, '/sos')),
            const SizedBox(height: 10),
            _actionButton('📖 Get Medical Guidance', const Color(0xFF059669), Colors.white, () {}),
            const SizedBox(height: 10),
          ],
          _actionButton('Analyze Another Image', Colors.white, Colors.black54, _resetAll, isOutlined: true),
        ],
      ),
    );
  }

  Widget _infoTile(String label, String value, Color color, Color border) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(color: const Color(0xFFE4EBE6), borderRadius: BorderRadius.circular(16), border: Border.all(color: border)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label, style: const TextStyle(color: Colors.black45, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1)),
          const SizedBox(height: 2),
          Text(value, style: TextStyle(color: color, fontSize: 16, fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }

  Widget _actionButton(String text, Color bg, Color textC, VoidCallback onTap, {bool isOutlined = false}) {
    return InkWell(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(16),
          border: isOutlined ? Border.all(color: Colors.black12) : null,
          boxShadow: isOutlined ? null : [BoxShadow(color: bg.withOpacity(0.4), offset: const Offset(0, 6), blurRadius: 12)],
        ),
        child: Center(child: Text(text, style: TextStyle(color: textC, fontSize: 14, fontWeight: FontWeight.bold))),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        children: [
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: const Color(0xFFFEF2F2), borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFFECACA))),
            child: const Icon(Icons.close, color: Color(0xFFDC2626), size: 32),
          ),
          const SizedBox(height: 16),
          const Text('Something went wrong', style: TextStyle(color: Color(0xFF11311B), fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(_errorMsg, style: const TextStyle(color: Colors.black45, fontSize: 14), textAlign: TextAlign.center),
          const SizedBox(height: 24),
          _actionButton('Try Again', Colors.white, Colors.black87, _resetAll, isOutlined: true),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          // Radial Dots Pattern
          Positioned.fill(
            child: CustomPaint(
              painter: _DotPatternPainter(color: const Color(0xFFC5D1C8), spacing: 6, dotRadius: 0.5),
              child: Container(color: const Color(0xFFE4EBE6).withOpacity(0.9)), // Tint over dots
            ),
          ),
          // Anaconda placeholder (Safe Box if image doesn't exist)
          Positioned(
            bottom: 30, left: 0, right: 0,
            child: Opacity(
               opacity: 0.2, // very subtle
               child: Icon(Icons.blur_on, size: 200, color: const Color(0xFF11311B)), // Placeholder
            ),
          ),
          // Content
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildTopBar(),
                  const SizedBox(height: 32),
                 if (_appState == AppState.ready) _buildReadyState()
                 else if (_appState == AppState.camera) _buildCameraState()
                 else if (_appState == AppState.analyzing) _buildAnalyzingState()
                 else if (_appState == AppState.results) _buildResultsState()
                 else if (_appState == AppState.error) _buildErrorState()
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DotPatternPainter extends CustomPainter {
  final Color color;
  final double spacing;
  final double dotRadius;

  _DotPatternPainter({required this.color, required this.spacing, required this.dotRadius});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color..style = PaintingStyle.fill;
    for (double x = 0; x < size.width; x += spacing) {
      for (double y = 0; y < size.height; y += spacing) {
        canvas.drawCircle(Offset(x, y), dotRadius, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
