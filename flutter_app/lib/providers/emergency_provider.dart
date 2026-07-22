import 'package:flutter/foundation.dart';

class EmergencyProvider with ChangeNotifier {
  String symptoms = '';
  String severity = 'LOW';
  String riskLevel = 'LOW';
  String? snakeType;
  double? confidence;
  List<String> selectedSymptoms = [];
  bool detectionDone = false;
  bool? isSnakebite;
  bool? venomous;
  String? rawClass;

  void updateEmergency({
    String? symptoms,
    String? severity,
    String? riskLevel,
    String? snakeType,
    double? confidence,
    List<String>? selectedSymptoms,
    bool? detectionDone,
    bool? isSnakebite,
    bool? venomous,
    String? rawClass,
  }) {
    if (symptoms != null) this.symptoms = symptoms;
    if (severity != null) this.severity = severity;
    if (riskLevel != null) this.riskLevel = riskLevel;
    if (snakeType != null) this.snakeType = snakeType;
    if (confidence != null) this.confidence = confidence;
    if (selectedSymptoms != null) this.selectedSymptoms = selectedSymptoms;
    if (detectionDone != null) this.detectionDone = detectionDone;
    if (isSnakebite != null) this.isSnakebite = isSnakebite;
    if (venomous != null) this.venomous = venomous;
    if (rawClass != null) this.rawClass = rawClass;
    
    notifyListeners();
  }

  void resetEmergency() {
    symptoms = '';
    severity = 'LOW';
    riskLevel = 'LOW';
    snakeType = null;
    confidence = null;
    selectedSymptoms = [];
    detectionDone = false;
    isSnakebite = null;
    venomous = null;
    rawClass = null;
    
    notifyListeners();
  }
}
