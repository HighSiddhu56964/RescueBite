import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Offline fallback static dictionary
const resources = {
  en: {
    translation: {
      "app": {
        "title": "RescueBite",
        "subtitle": "Emergency Response",
        "back": "Back"
      },
      "home": {
        "greeting": "Namaste,",
        "statusOnline": "System Online",
        "statusOffline": "Offline Mode",
        "emergencyAction": "EMERGENCY ACTION",
        "emergencyRescueTitle": "Emergency\nRescue",
        "emergencyRescueDesc": "Instantly log GPS and alert medical authorities.",
        "quickActions": "Quick Actions",
        "identifySnake": "Identify\nSnake",
        "checkSeverity": "Check\nSeverity",
        "regionalRiskMap": "Regional Risk Map",
        "viewAll": "View All",
        "latestNews": "Latest Incident News"
      },
      "login": {
        "welcome": "Welcome Back",
        "desc": "Sign in to your account",
        "userLabel": "Username",
        "passLabel": "Password",
        "submit": "Sign In",
        "noAccount": "Don't have an account?",
        "register": "Register",
        "language": "Select Language:"
      },
      "profile": {
        "title": "Profile",
        "dashboard": "My Dashboard",
        "editProfile": "Edit Profile",
        "settings": "Settings",
        "language": "App Language",
        "personalInfo": "Personal Information",
        "fullName": "Full Name",
        "emailUser": "Email/User",
        "age": "Age",
        "gender": "Gender",
        "totalDetections": "Total Detections",
        "totalSOS": "Total SOS",
        "totalSymptoms": "Total Symptoms",
        "noData": "No records found",
        "notDetected": "Unidentified",
        "logout": "Logout",
        "signOut": "SIGN OUT SECURELY",
        "developedBy": "Developed exclusively for emergency routing"
      },
      "sos": {
        "confirmTitle": "Trigger SOS?",
        "confirmDesc": "An SMS with your GPS location will be sent immediately.",
        "confirmBtn": "SEND SOS?",
        "sending": "Broadcasting Location...",
        "cancel": "CANCEL",
        "btnText": "🚨 SEND SOS",
        "btnSub": "Tap to send emergency alert",
        "noInternet": "No internet — SMS-only mode",
        "riskLevel": "Risk Level",
        "symptoms": "Symptoms",
        "hospitalAssigned": "Assigned",
        "emergencyMode": "⚠ Emergency Mode",
        "gpsLocked": "📍 GPS Locked",
        "gpsUnavailable": "GPS Unavailable",
        "gpsAcquiring": "Acquiring GPS…",
        "gpsWaiting": "Waiting for satellite fix",
        "hospital": "Hospital",
        "yes": "YES",
        "sentSuccess": "🚨 SOS SENT SUCCESSFULLY",
        "helpOnWay": "Help is on the way",
        "offlineMode": "⚠ Offline mode: SMS sent only",
        "dataSync": "Data will sync when connection is restored",
        "stayCalm": "Stay calm. Keep the bitten area still and below heart level.",
        "close": "CLOSE"
      },
      "detect": {
        "header": "AI Detection",
        "title": "Snakebite Detection",
        "camera": "Camera",
        "upload": "Upload",
        "captureText": "Capture or upload a wound image to analyze",
        "biteDet": "Bite Detection",
        "venomDet": "Venom Assessment",
        "firstAid": "First Aid Guide"
      },
      "symptoms": {
        "greeting": "Hello! I am RescueBite AI. Please describe your symptoms or tap the mic to speak.",
        "placeholder": "Describe your symptoms…",
        "missingInput": "Please tell me your symptoms so I can help you.",
        "error": "⚠️ Something went wrong. Please try again.",
        "highRiskTitle": "Immediate SOS Recommended",
        "highRiskDesc": "Critical symptoms detected. Please trigger the emergency SOS immediately.",
        "triggerSOS": "TRIGGER SOS NOW",
        "continueChat": "Continue Chat",
        "proceedToSOS": "Proceed to SOS"
      }
    }
  },
  hi: {
    translation: {
      "app": {
        "title": "रेस्क्यू बाइट (RescueBite)",
        "subtitle": "आपातकालीन प्रतिक्रिया",
        "back": "वापस जाएँ"
      },
      "home": {
        "greeting": "नमस्ते,",
        "statusOnline": "सिस्टम ऑनलाइन",
        "statusOffline": "ऑफ़लाइन मोड",
        "emergencyAction": "आपातकालीन कार्रवाई",
        "emergencyRescueTitle": "आपातकालीन\nसहायता",
        "emergencyRescueDesc": "तुरंत अपना GPS और अधिकारियों को अलर्ट भेजें।",
        "quickActions": "त्वरित कार्रवाई",
        "identifySnake": "सांप\nपहचानें",
        "checkSeverity": "गंभीरता\nजांचें",
        "regionalRiskMap": "क्षेत्रीय जोखिम मानचित्र",
        "viewAll": "सभी देखें",
        "latestNews": "नवीनतम घटना समाचार"
      },
      "login": {
        "welcome": "वापसी पर स्वागत है",
        "desc": "अपने खाते में साइन इन करें",
        "userLabel": "उपयोगकर्ता नाम",
        "passLabel": "पासवर्ड",
        "submit": "साइन इन करें",
        "noAccount": "क्या आपके पास खाता नहीं है?",
        "register": "रजिस्टर करें",
        "language": "भाषा चुनें:"
      },
      "profile": {
        "title": "प्रोफ़ाइल",
        "dashboard": "मेरा डैशबोर्ड",
        "editProfile": "प्रोफ़ाइल संपादित करें",
        "settings": "सेटिंग्स",
        "language": "ऐप की भाषा",
        "personalInfo": "व्यक्तिगत जानकारी",
        "fullName": "पूरा नाम",
        "emailUser": "ईमेल/उपयोगकर्ता",
        "age": "आयु",
        "gender": "लिंग",
        "totalDetections": "कुल पहचान",
        "totalSOS": "कुल SOS",
        "totalSymptoms": "कुल लक्षण",
        "noData": "कोई रिकॉर्ड नहीं मिला",
        "notDetected": "अज्ञात",
        "logout": "लॉग आउट करें",
        "signOut": "सुरक्षित रूप से साइन आउट करें",
        "developedBy": "विशेष रूप से आपातकालीन राउटिंग के लिए विकसित"
      },
      "sos": {
        "confirmTitle": "SOS ट्रिगर करें?",
        "confirmDesc": "आपकी जीपीएस लोकेशन वाला एक SMS तुरंत भेजा जाएगा।",
        "confirmBtn": "क्या SOS भेजें?",
        "sending": "लोकेशन भेजी जा रही है...",
        "cancel": "रद्द करें",
        "btnText": "🚨 SOS भेजें",
        "btnSub": "आपातकालीन अलर्ट भेजने के लिए टैप करें",
        "noInternet": "कोई इंटरनेट नहीं — केवल SMS मोड",
        "riskLevel": "जोखिम स्तर",
        "symptoms": "लक्षण",
        "hospitalAssigned": "आवंटित अस्पताल",
        "emergencyMode": "⚠ आपातकालीन मोड",
        "gpsLocked": "📍 GPS लॉक",
        "gpsUnavailable": "GPS अनुपलब्ध",
        "gpsAcquiring": "GPS प्राप्त कर रहा है…",
        "gpsWaiting": "सैटेलाइट फिक्स की प्रतीक्षा कर रहा है",
        "hospital": "अस्पताल",
        "yes": "हाँ",
        "sentSuccess": "🚨 SOS सफलतापूर्वक भेजा गया",
        "helpOnWay": "मदद रास्ते में है",
        "offlineMode": "⚠ ऑफ़लाइन मोड: केवल SMS भेजा गया",
        "dataSync": "कनेक्शन बहाल होने पर डेटा सिंक हो जाएगा",
        "stayCalm": "शांत रहें। काटे गए स्थान को स्थिर और हृदय स्तर से नीचे रखें।",
        "close": "बंद करें"
      },
      "detect": {
        "header": "एआई (AI) पहचान",
        "title": "सर्पदंश पहचान",
        "camera": "कैमरा",
        "upload": "अपलोड",
        "captureText": "विश्लेषण के लिए घाव की तस्वीर लें या अपलोड करें",
        "biteDet": "काटने की पहचान",
        "venomDet": "ज़हर का आकलन",
        "firstAid": "प्राथमिक उपचार गाइड"
      },
      "symptoms": {
        "greeting": "नमस्ते! मैं RescueBite AI हूँ। कृपया अपने लक्षणों का वर्णन करें या बोलने के लिए माइक पर टैप करें।",
        "placeholder": "अपने लक्षणों का वर्णन करें…",
        "missingInput": "कृपया मुझे अपने लक्षण बताएं ताकि मैं आपकी मदद कर सकूं।",
        "error": "⚠️ कुछ गलत हो गया। कृपया पुन: प्रयास करें।",
        "highRiskTitle": "तुरंत SOS की सिफारिश की गई",
        "highRiskDesc": "गंभीर लक्षण पाए गए हैं। कृपया तुरंत आपातकालीन SOS ट्रिगर करें।",
        "triggerSOS": "अभी SOS ट्रिगर करें",
        "continueChat": "चैट जारी रखें",
        "proceedToSOS": "SOS पर आगे बढ़ें"
      }
    }
  },
  mr: {
    translation: {
      "app": {
        "title": "रेस्क्यू बाइट (RescueBite)",
        "subtitle": "आणीबाणी प्रतिसाद",
        "back": "मागे जा"
      },
      "home": {
        "greeting": "नमस्कार,",
        "statusOnline": "सिस्टम ऑनलाइन",
        "statusOffline": "ऑफलाइन मोड",
        "emergencyAction": "आणीबाणी कारवाई",
        "emergencyRescueTitle": "आणीबाणी\nमदत",
        "emergencyRescueDesc": "तात्काळ वैद्यकीय अधिकाऱ्यांना GPS द्वारे सतर्क करा.",
        "quickActions": "त्वरित क्रिया",
        "identifySnake": "साप\nओळखा",
        "checkSeverity": "गंभीरता\nतपासा",
        "regionalRiskMap": "प्रादेशिक धोका नकाशा",
        "viewAll": "सर्व पहा",
        "latestNews": "नवीनतम घटना बातम्या"
      },
      "login": {
        "welcome": "परत स्वागत आहे",
        "desc": "तुमच्या खात्यात साइन इन करा",
        "userLabel": "युजरनेम",
        "passLabel": "पासवर्ड",
        "submit": "साइन इन करा",
        "noAccount": "खाते नाही का?",
        "register": "नोंदणी करा",
        "language": "भाषा निवडा:"
      },
      "profile": {
        "title": "प्रोफाइल",
        "dashboard": "माझा डॅशबोर्ड",
        "editProfile": "प्रोफाइल संपादित करा",
        "settings": "सेटिंग्ज",
        "language": "अॅपची भाषा",
        "personalInfo": "वैयक्तिक माहिती",
        "fullName": "पूर्ण नाव",
        "emailUser": "ईमेल/वापरकर्ता",
        "age": "वय",
        "gender": "लिंग",
        "totalDetections": "एकूण ओळख",
        "totalSOS": "एकूण SOS",
        "totalSymptoms": "एकूण लक्षणे",
        "noData": "कोणतेही रेकॉर्ड आढळले नाही",
        "notDetected": "अज्ञात",
        "logout": "लॉग आउट करा",
        "signOut": "सुरक्षितपणे साइन आउट करा",
        "developedBy": "विशेषतः आपत्कालीन रूटिंगसाठी विकसित"
      },
      "sos": {
        "confirmTitle": "SOS ट्रिगर करायचा?",
        "confirmDesc": "तुमच्या GPS स्थानासह एक SMS त्वरित पाठविला जाईल.",
        "confirmBtn": "SOS पाठवायचा?",
        "sending": "स्थान प्रसारित करत आहे...",
        "cancel": "रद्द करा",
        "btnText": "🚨 SOS पाठवा",
        "btnSub": "आपत्कालीन अलर्ट पाठवण्यासाठी टॅप करा",
        "noInternet": "इंटरनेट नाही — फक्त SMS मोड",
        "riskLevel": "धोका पातळी",
        "symptoms": "लक्षणे",
        "hospitalAssigned": "नेमून दिलेले रुग्णालय",
        "emergencyMode": "⚠ आपत्कालीन मोड",
        "gpsLocked": "📍 GPS लॉक",
        "gpsUnavailable": "GPS अनुपलब्ध",
        "gpsAcquiring": "GPS प्राप्त करत आहे...",
        "gpsWaiting": "उपग्रह फिक्सची प्रतीक्षा करत आहे",
        "hospital": "रुग्णालय",
        "yes": "होय",
        "sentSuccess": "🚨 SOS यशस्वीरित्या पाठवला",
        "helpOnWay": "मदत येत आहे",
        "offlineMode": "⚠ ऑफलाइन मोड: फक्त SMS पाठवला",
        "dataSync": "कनेक्शन परत आल्यावर डेटा सिंक केला जाईल",
        "stayCalm": "शांत राहा. चावलेला भाग स्थिर आणि हृदयाच्या पातळीच्या खाली ठेवा.",
        "close": "बंद करा"
      },
      "detect": {
        "header": "एआय (AI) ओळख",
        "title": "सर्पदंश ओळख",
        "camera": "कॅमेरा",
        "upload": "अपलोड",
        "captureText": "विश्लेषणासाठी जखमेचा फोटो घ्या किंवा अपलोड करा",
        "biteDet": "चावल्याची ओळख",
        "venomDet": "विषाचे मूल्यांकन",
        "firstAid": "प्राथमिक उपचार मार्गदर्शक"
      },
      "symptoms": {
        "greeting": "नमस्कार! मी RescueBite AI आहे. कृपया तुमच्या लक्षणांचे वर्णन करा किंवा बोलण्यासाठी माईकवर टॅप करा.",
        "placeholder": "तुमच्या लक्षणांचे वर्णन करा…",
        "missingInput": "कृपया मला तुमची लक्षणे सांगा जेणेकरून मी तुम्हाला मदत करू शकेन.",
        "error": "⚠️ काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.",
        "highRiskTitle": "त्वरित SOS शिफारस केली आहे",
        "highRiskDesc": "गंभीर लक्षणे आढळली. कृपया त्वरित आपत्कालीन SOS ट्रिगर करा.",
        "triggerSOS": "आता SOS ट्रिगर करा",
        "continueChat": "चॅट सुरू ठेवा",
        "proceedToSOS": "SOS कडे जा"
      }
    }
  }
};

const savedLang = localStorage.getItem('snakesafe_language') || 'en';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
