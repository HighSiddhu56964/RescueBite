import { useState, useRef, useEffect, Component } from "react";
import { useNavigate } from "react-router-dom";
import { sarvamSpeechToText } from "../utils/sarvamSTT";
import { askSarvamLLM } from "../utils/sarvamLLM";
import { sarvamTextToSpeech } from "../utils/sarvamTTS";
import { useVoiceRecorder } from "../utils/useVoiceRecorder";
import { useEmergency } from "../context/EmergencyContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./Toast";
import { saveSymptomLog, fetchSymptomLogs } from "../utils/symptomLogService";
import { fetchReports } from "../utils/reportService";
import { useTranslation } from "react-i18next";

const riskColors = {
  HIGH: { bg: "#DC2626", glow: "rgba(220,38,38,0.25)", text: "#fff" },
  MEDIUM: { bg: "#F59E0B", glow: "rgba(245,158,11,0.25)", text: "#fff" },
  LOW: { bg: "#10B981", glow: "rgba(16,185,129,0.20)", text: "#fff" },
};

class SafeUIErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error("UI CAUGHT CRASH:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.wrapper}>
          <div style={{ padding: 20, textAlign: 'center', margin: 'auto' }}>
            <h2>⚠️ Something went wrong. Please try again.</h2>
            <button onClick={() => window.location.reload()} style={styles.sosPromptBtn}>RELOAD</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function SymptomCheckerCore() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updateEmergency } = useEmergency();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState([
    { role: "assistant", content: t('symptoms.greeting') },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSymptoms, setHasSymptoms] = useState(false);
  const [showHighRiskAlert, setShowHighRiskAlert] = useState(false);
  const [awaitingSosConfirm, setAwaitingSosConfirm] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function loadChatOrDetection() {
      if (!user?.id) return;
      try {
        // Attempt to fetch and parse previous chats directly from the Database so the user loses nothing
        const pastLogs = await fetchSymptomLogs(user.id);
        const latestLog = pastLogs?.length > 0 ? pastLogs[0] : null;
        
        let loadedHistory = false;
        if (latestLog && latestLog.messages) {
           const pastMessages = typeof latestLog.messages === 'string' ? JSON.parse(latestLog.messages) : latestLog.messages;
           
           // Restore past chat logic strictly if there are user responses saved
           if (Array.isArray(pastMessages) && pastMessages.length > 1) { // 1 is just the greeting
              setMessages(pastMessages);
              setHasSymptoms(true);
              const userSymptoms = pastMessages.filter(m => m.role === 'user').map(m => m.content).join('; ');
              updateEmergency({ symptoms: userSymptoms, riskLevel: latestLog.risk_level, severity: latestLog.severity });
              loadedHistory = true;
           }
        }
        
        // Only load cold-start detection context if they haven't explicitly chatted recently
        if (!loadedHistory) {
          const reports = await fetchReports(user.id);
          const recentDetection = reports.find(r => r.detected === true && new Date(r.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000);
          if (recentDetection) {
            const sysMsg = { role: "system", content: `CRITICAL CONTEXT: The user recently scanned a snake identified as: ${recentDetection.snake_type}. \nModel Confidence: ${(recentDetection.confidence * 100).toFixed(1)}%. \nRisk Level: ${recentDetection.risk_level}. \nLocation captured: Lat ${recentDetection.latitude}, Lng ${recentDetection.longitude}. \nTailor your medical advice considering they likely encountered a ${recentDetection.snake_type}.` };
            setMessages(prev => [sysMsg, ...prev.filter(m => m.role !== "system")]);
          }
        }
      } catch (err) { console.error("Failed to load chat setup", err); }
    }
    loadChatOrDetection();
  }, [user]);

  const { recording, startRecording, stopRecording } = useVoiceRecorder();
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const extractRiskLevel = (text) => {
    if (!text) return "LOW";
    const t = text.toUpperCase();
    if (t.includes("HIGH") || t.includes("BREATHING") || t.includes("UNCONSCIOUS")) return "HIGH";
    if (t.includes("MEDIUM") || t.includes("SWELLING")) return "MEDIUM";
    return "LOW";
  };

  const handleSend = async (userText, isVoice = false) => {
    if (!userText || !userText.trim() || loading) return;
    const cleanInput = userText.trim().toLowerCase();

    // 1. Voice-Activated SOS Confirmation Trap
    if (awaitingSosConfirm) {
      if (cleanInput.includes("yes") || cleanInput.includes("haan") || cleanInput.includes("ho") || cleanInput.includes("yeah") || cleanInput.includes("yup") || cleanInput.includes("ok")) {
        setAwaitingSosConfirm(false);
        handleProceedToSOS();
        return;
      } else {
        setAwaitingSosConfirm(false);
        const cancelMsg = t('symptoms.sosCancelled', "Emergency SOS cancelled. Please continue describing your symptoms.");
        setMessages(prev => [...prev, { role: "user", content: userText }, { role: "assistant", content: cancelMsg }]);
        setInputText("");
        if (isVoice) { try { await sarvamTextToSpeech(cancelMsg); } catch(e){} }
        return;
      }
    }

    // 2. Keyword Detection for Activation
    const triggerWords = ["sos", "help", "emergency", "bachao", "madat", "dying", "hospital", "ambulance", "save me", "bchao"];
    const isEmergencyTrigger = triggerWords.some(w => cleanInput.includes(w));
    
    if (isEmergencyTrigger) {
      setAwaitingSosConfirm(true);
      const confirmMsg = t('symptoms.sosConfirmPrompt', "I detected an emergency keyword. Do you want me to dispatch an SOS immediately? Please reply Yes or No.");
      setMessages(prev => [...prev, { role: "user", content: userText }, { role: "assistant", content: confirmMsg }]);
      setInputText("");
      if (isVoice) { try { await sarvamTextToSpeech(confirmMsg); } catch(e){} }
      return;
    }

    // 3. Normal Validation & LLM Inference
    if (cleanInput === "hi" || cleanInput === "hello" || cleanInput === "नमस्ते" || cleanInput === "नमस्कार" || cleanInput.length < 3) {
      setMessages(prev => [...prev, { role: "user", content: userText }, { role: "assistant", content: t('symptoms.missingInput') }]);
      setInputText(""); return;
    }
    setLoading(true); setHasSymptoms(true);
    try {
      const newMessages = [...messages, { role: "user", content: userText }];
      setMessages(newMessages); setInputText("");
      updateEmergency({ symptoms: (messages.filter(m => m.role === 'user').map(m => m.content).join('; ') + '; ' + userText).replace(/^;\s*/, '') });
      const replyStr = await askSarvamLLM(newMessages);
      if (!replyStr) { setMessages(prev => [...prev, { role: "assistant", content: t('symptoms.error') }]); setLoading(false); return; }
      const riskLevel = extractRiskLevel(replyStr);
      updateEmergency({ severity: riskLevel, riskLevel });
      if (riskLevel === "HIGH") setShowHighRiskAlert(true);
      setMessages(prev => [...prev, { role: "assistant", content: replyStr }]);
      const allMessages = [...newMessages, { role: "assistant", content: replyStr }];
      if (user?.id) {
        try {
          const logResult = await saveSymptomLog({ user_id: user.id, messages: allMessages, result: replyStr.substring(0, 200), severity: riskLevel, risk_level: riskLevel });
          if (logResult.success) showToast('✅ Symptom log saved');
          else { console.error('[SymptomChecker] Log save failed:', logResult.error); showToast('❌ Failed to save log: ' + logResult.error, 'error'); }
        } catch (logErr) { console.error('[SymptomChecker] Log save exception:', logErr); }
      }
      
      if (isVoice) { 
        try { 
          // Speak full contextual response, bounded only by 480 TTS limit
          const cleanTTS = replyStr.replace(/[*_#]/g, '').substring(0, 480);
          await sarvamTextToSpeech(cleanTTS); 
        } catch { console.warn("TTS failed"); } 
      }
    } catch (err) { console.error("HANDLE SEND CRASH:", err); setMessages(prev => [...prev, { role: "assistant", content: t('symptoms.error') }]); }
    finally { setLoading(false); }
  };

  const handleVoiceButton = async () => {
    try {
      if (!recording) { await startRecording(); return; }
      const audioBlob = await stopRecording();
      if (!audioBlob) { alert("No audio recorded"); return; }
      let transcript = "";
      try { transcript = await sarvamSpeechToText(audioBlob); } catch { alert("Speech recognition failed"); return; }
      if (!transcript || !transcript.trim()) { alert("No speech detected"); return; }
      handleSend(transcript, true);
    } catch (err) { console.error("VOICE BUTTON CRASH:", err); }
  };

  const handleProceedToSOS = () => {
    const allSymptoms = messages.filter((m) => m.role === "user").map((m) => m.content).join("; ");
    updateEmergency({ symptoms: allSymptoms });
    navigate("/sos?auto=true");
  };

  const latestRisk = (() => {
    const aiMessages = messages.filter(m => m.role === "assistant");
    if (aiMessages.length === 0) return "LOW";
    return extractRiskLevel(aiMessages[aiMessages.length - 1].content);
  })();
  const risk = riskColors[latestRisk] || riskColors.LOW;

  const renderFormattedMessage = (text) => {
    let formattedText = text;
    formattedText = formattedText.replace(/(Risk Level:?)/gi, "🧠 $1");
    formattedText = formattedText.replace(/(First Aid:?)/gi, "🏥 $1");
    return formattedText.split('\n').map((line, idx) => {
      const isHeader = line.includes("🧠") || line.includes("🏥");
      return (<p key={idx} style={{ marginBottom: line.trim() === '' ? 4 : 2, fontWeight: isHeader ? 700 : 400, marginTop: isHeader ? 8 : 0 }}>{line}</p>);
    });
  };

  return (
    <div style={styles.wrapper}>
      {/* Premium Dotted Background (Matching DetectPage) */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundColor: '#e4ebe6', backgroundImage: 'radial-gradient(#c5d1c8 1px, transparent 1px)', backgroundSize: '6px 6px' }}></div>
      
      {/* Background Graphic Asset (Matching Anaconda styling) */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] max-w-[500px] pointer-events-none z-0 mix-blend-multiply flex justify-center items-center opacity-[0.25]">
          <div className="relative w-full aspect-square flex justify-center items-center">
             <img src="/symptom-bg.png" alt="Symptom Asset" className="w-[85%] h-auto object-contain relative z-10" onError={(e) => { 
                e.target.onerror = null; 
                e.target.style.display='none'; 
              }}/>
          </div>
      </div>

      {/* Header */}
      <header style={styles.header} className="relative z-10">
        <div style={styles.headerLeft}>
          <span style={styles.logo}>🐍</span>
          <div>
            <h1 style={styles.title}>RescueBite</h1>
            <p style={styles.subtitle}>Emergency First‑Aid AI</p>
          </div>
        </div>
        <span style={{ ...styles.riskBadge, background: risk.bg, color: risk.text, boxShadow: `0 0 18px ${risk.glow}` }}>
          {latestRisk} RISK
        </span>
      </header>

      {/* High Risk Alert */}
      {showHighRiskAlert && (
        <div style={styles.highRiskOverlay}>
          <div style={styles.highRiskModal}>
            <div style={styles.alertIcon}>🚨</div>
            <h2 style={styles.alertTitle}>{t('symptoms.highRiskTitle')}</h2>
            <p style={styles.alertDesc}>{t('symptoms.highRiskDesc')}</p>
            <button style={styles.alertBtn} onClick={handleProceedToSOS}>{t('symptoms.triggerSOS')}</button>
            <button style={styles.alertCloseBtn} onClick={() => setShowHighRiskAlert(false)}>{t('symptoms.continueChat')}</button>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <main style={styles.chatArea}>
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          if (msg.role === "system") return null;
          const msgContent = typeof msg.content === 'string' ? msg.content : "⚠️ Missing response format";
          return (
            <div key={i} style={{ ...styles.bubbleRow, justifyContent: isUser ? "flex-end" : "flex-start" }}>
              {!isUser && <div style={styles.avatar}>🤖</div>}
              <div style={{ ...styles.bubble, ...(isUser ? styles.userBubble : styles.aiBubble) }}>
                <div style={styles.bubbleText}>{isUser ? msgContent : renderFormattedMessage(msgContent)}</div>
              </div>
              {isUser && <div style={styles.avatar}>🗣️</div>}
            </div>
          );
        })}
        {loading && (
          <div style={{ ...styles.bubbleRow, justifyContent: "flex-start" }}>
            <div style={styles.avatar}>🤖</div>
            <div style={{ ...styles.bubble, ...styles.aiBubble }}>
              <div style={styles.typingDots}>
                <span style={{ ...styles.dot, animationDelay: "0s" }} />
                <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
                <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Proceed to SOS */}
      {hasSymptoms && (
        <div style={styles.sosPrompt}>
          <button onClick={handleProceedToSOS} style={styles.sosPromptBtn}>
            <span>🚨</span><span>{t('symptoms.proceedToSOS')}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      )}

      {/* Input Bar */}
      <footer style={styles.inputBar} className="relative z-10">
        <button onClick={handleVoiceButton} style={{ ...styles.micBtn, background: recording ? "linear-gradient(135deg, #DC2626, #B91C1C)" : "linear-gradient(135deg, #295b36, #1b4332)", boxShadow: recording ? "0 0 24px rgba(220,38,38,0.4)" : "0 4px 14px rgba(41,91,54,0.3)", animation: recording ? "pulse 1s infinite" : "none" }} aria-label={recording ? "Stop recording" : "Start recording"}>
          {recording ? (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="6" y="6" width="12" height="12" rx="2" fill="#fff" /></svg>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" fill="#fff" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="#fff" strokeWidth="2" strokeLinecap="round" /><line x1="12" y1="19" x2="12" y2="23" stroke="#fff" strokeWidth="2" strokeLinecap="round" /><line x1="8" y1="23" x2="16" y2="23" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
          )}
        </button>
        <input type="text" style={styles.textInput} placeholder={t('symptoms.placeholder')} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSend(inputText); } }} disabled={loading} />
        <button onClick={() => handleSend(inputText)} style={{ ...styles.sendBtn, opacity: inputText.trim() && !loading ? 1 : 0.4 }} disabled={!inputText.trim() || loading} aria-label="Send message">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="#fff" strokeWidth="2" strokeLinecap="round" /><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.1)" /></svg>
        </button>
      </footer>

      <style>{`
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.12); } }
        @keyframes dotBounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        input::placeholder { color: #11311b80 !important; }
      `}</style>
    </div>
  );
}

export default function SymptomChecker() {
  return (<SafeUIErrorBoundary><SymptomCheckerCore /></SafeUIErrorBoundary>);
}

/* ── Zero-G Light Theme Styles ── */
const styles = {
  wrapper: {
    fontFamily: "'Inter', -apple-system, sans-serif",
    display: "flex", flexDirection: "column", height: "100vh",
    maxWidth: 480, margin: "0 auto",
    color: "#11311b",
    position: "relative", overflow: "hidden",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 20px 12px",
    background: "rgba(255,255,255,0.4)", backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.6)", zIndex: 10,
    boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  logo: { fontSize: 30, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" },
  title: { fontSize: 18, fontWeight: 800, color: "#11311b", letterSpacing: "-0.3px", margin: 0 },
  subtitle: { fontSize: 11, color: "#3a5a40", fontWeight: 700, margin: 0, letterSpacing: "0.6px", textTransform: "uppercase" },
  riskBadge: { fontSize: 11, fontWeight: 800, padding: "5px 14px", borderRadius: 20, letterSpacing: "1px", textTransform: "uppercase", transition: "all 0.4s ease" },

  chatArea: { flex: 1, overflowY: "auto", padding: "20px 16px 220px", display: "flex", flexDirection: "column", gap: 14, zIndex: 10, position: "relative" },
  bubbleRow: { display: "flex", alignItems: "flex-end", gap: 8, animation: "fadeSlideUp 0.3s ease" },
  avatar: { fontSize: 22, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(10px)", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
  bubble: { maxWidth: "78%", padding: "12px 16px", borderRadius: 18, lineHeight: 1.55, backdropFilter: "blur(12px)" },
  userBubble: { background: "linear-gradient(135deg, #295b36, #1b4332)", borderBottomRightRadius: 4, color: "#fff", boxShadow: "0 8px 16px rgba(27,67,50,0.2), inset 0 2px 4px rgba(255,255,255,0.1)" },
  aiBubble: { background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.8)", borderBottomLeftRadius: 4, color: "#11311b", boxShadow: "inset 0 2px 5px rgba(255,255,255,0.8), 0 4px 12px rgba(0,0,0,0.04)" },
  bubbleText: { fontSize: 14, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontWeight: 500 },

  typingDots: { display: "flex", gap: 5, padding: "4px 0" },
  dot: { width: 8, height: 8, borderRadius: "50%", background: "#295b36", animation: "dotBounce 1s infinite", display: "inline-block" },

  highRiskOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)", padding: 20, animation: "fadeSlideUp 0.3s ease" },
  highRiskModal: { background: "#FFFFFF", borderRadius: 24, padding: "30px 20px", maxWidth: 320, width: "100%", textAlign: "center", border: "2px solid rgba(220,38,38,0.3)", boxShadow: "0 20px 60px rgba(220,38,38,0.15)", animation: "scaleIn 0.3s ease" },
  alertIcon: { fontSize: 48, marginBottom: 12, animation: "pulse 1s infinite" },
  alertTitle: { color: "#DC2626", fontSize: 20, fontWeight: 800, margin: "0 0 8px" },
  alertDesc: { color: "#64748B", fontSize: 14, lineHeight: 1.5, margin: "0 0 24px", fontWeight: 500 },
  alertBtn: { width: "100%", padding: "14px", borderRadius: 16, background: "linear-gradient(135deg, #DC2626, #F97316)", color: "#fff", fontWeight: 800, fontSize: 16, border: "none", cursor: "pointer", boxShadow: "0 4px 15px rgba(220,38,38,0.3)" },
  alertCloseBtn: { width: "100%", padding: "12px", marginTop: 12, borderRadius: 16, background: "transparent", color: "#64748B", fontWeight: 700, fontSize: 14, border: "1px solid #E2E8F0", cursor: "pointer" },

  sosPrompt: { position: "fixed", bottom: 130, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "0 16px", zIndex: 20 },
  sosPromptBtn: { width: "100%", padding: "14px 20px", borderRadius: 16, border: "2px solid rgba(220,38,38,0.3)", background: "linear-gradient(135deg, rgba(220,38,38,0.08), rgba(220,38,38,0.15))", color: "#DC2626", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, backdropFilter: "blur(16px)", transition: "all 0.2s ease", boxShadow: "0 4px 20px rgba(220,38,38,0.1)" },

  inputBar: { position: "fixed", bottom: 62, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px 20px", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 -4px 30px rgba(0,0,0,0.03)" },
  micBtn: { width: 52, height: 52, borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s ease" },
  textInput: { flex: 1, height: 48, borderRadius: 24, border: "1px solid rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.6)", color: "#11311b", fontSize: 14, fontFamily: "'Inter', sans-serif", padding: "0 20px", outline: "none", transition: "all 0.2s ease", fontWeight: 500, backdropFilter: "blur(10px)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" },
  sendBtn: { width: 48, height: 48, borderRadius: "50%", border: "none", background: "linear-gradient(135deg, #295b36, #1b4332)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s ease", boxShadow: "0 4px 14px rgba(41,91,54,0.3)" },
};
