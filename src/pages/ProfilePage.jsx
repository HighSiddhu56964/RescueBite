import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';
import { fetchSymptomLogs } from '../utils/symptomLogService';

const TABS = ['detections', 'sos', 'symptoms'];

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('detections');
  const [stats, setStats] = useState({ detections: 0, sos: 0, symptoms: 0 });
  const [detections, setDetections] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [symptomLogs, setSymptomLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentLang = i18n.language;
  const changeLanguage = (lang) => { i18n.changeLanguage(lang); localStorage.setItem('snakesafe_language', lang); };

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    const fetchAll = async () => {
      const { data: reports } = await supabase.from('reports').select('*').eq('user_id', user.id).eq('source', 'detection').order('created_at', { ascending: false }).limit(30);
      const { data: sos } = await supabase.from('reports').select('*').eq('user_id', user.id).eq('source', 'sos').order('created_at', { ascending: false }).limit(30);
      const symptoms = await fetchSymptomLogs(user.id);
      setDetections(reports || []); setSosAlerts(sos || []); setSymptomLogs(symptoms || []);
      setStats({ detections: reports?.length || 0, sos: sos?.length || 0, symptoms: symptoms?.length || 0 });
      setLoading(false);
    };
    fetchAll();
  }, [user?.id]);

  const formatDate = (d) => {
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return d; }
  };

  const riskBadge = (level) => {
    const colors = {
      HIGH: 'bg-brand-red/10 text-brand-red border-brand-red/20',
      MEDIUM: 'bg-amber-50 text-amber-600 border-amber-200',
      LOW: 'bg-emerald-50 text-zg-success border-emerald-200',
      NONE: 'bg-brand-green/10 text-brand-green border-brand-green/20',
    };
    return `px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${colors[level] || colors.NONE}`;
  };

  const userName = user?.name || user?.username || 'User';
  const age = user?.age || 'N/A';
  const gender = user?.gender || 'N/A';
  const userRole = user?.role || 'user';

  return (
    <div id="profile-page" className="fixed inset-0 bg-warm-cream bg-organic-texture overflow-y-auto pb-24">
      
      {/* 1. Header & Avatar Block */}
      <div className="px-5 pt-12 pb-6 animate-fade-in-up flex justify-between items-start">
        <div>
          <button onClick={() => window.history.back()} className="mb-4 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-8dp text-brand-green-dark border border-zg-border hover:bg-mint-glow transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <p className="text-zg-text-secondary text-[10px] font-black tracking-[0.2em] uppercase mb-0.5 ml-1">{t('profile.dashboard')}</p>
          <h1 className="text-3xl font-black text-brand-green-dark leading-tight">{userName.split(' ')[0]}</h1>
        </div>
        
        {/* Avatar with Red/Green ring */}
        <div className="relative mt-2">
          <div className="w-16 h-16 rounded-full bg-mint-glow flex items-center justify-center shadow-12dp z-10 relative">
            <span className="text-brand-green-dark font-black text-2xl">{userName.charAt(0).toUpperCase()}</span>
          </div>
          {/* Decorative Ring */}
          <svg className="absolute -inset-1.5 w-[76px] h-[76px] -rotate-90" viewBox="0 0 100 100">
             <circle cx="50" cy="50" r="46" fill="none" stroke="#D32F2F" strokeWidth="4" strokeDasharray="144 144" strokeLinecap="round"/>
             <circle cx="50" cy="50" r="46" fill="none" stroke="#1B5E20" strokeWidth="4" strokeDasharray="144 144" strokeDashoffset="-144" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      <div className="px-5 space-y-4 animate-fade-in-up delay-75">
        
        {/* 2. Structured Identifications Block (Pre-filled Mint Containers) */}
        <div className="bg-white border text-zg-text border-zg-border rounded-[24px] p-4 shadow-12dp">
          <h3 className="text-zg-text text-sm font-extrabold mb-3 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            {t('profile.personalInfo')}
          </h3>
          
          <div className="space-y-2.5">
            {userRole === 'authority' ? (
              <>
                <div className="bg-mint-glow/40 border border-brand-green/10 rounded-2xl px-4 py-2 flex justify-between items-center">
                  <span className="text-brand-green-dark text-[10px] font-bold uppercase tracking-wider">Organization</span>
                  <span className="text-zg-text text-sm font-semibold">{userName}</span>
                </div>
                <div className="bg-mint-glow/40 border border-brand-green/10 rounded-2xl px-4 py-2 flex justify-between items-center">
                  <span className="text-brand-green-dark text-[10px] font-bold uppercase tracking-wider">GR Number</span>
                  <span className="text-zg-text text-sm font-semibold">{user?.grNumber || 'N/A'}</span>
                </div>
                <div className="bg-mint-glow/40 border border-brand-green/10 rounded-2xl px-4 py-2 flex justify-between items-center">
                  <span className="text-brand-green-dark text-[10px] font-bold uppercase tracking-wider">Account Type</span>
                  <span className="text-zg-text text-sm font-semibold uppercase text-brand-green font-black">Authority</span>
                </div>
              </>
            ) : (
              <>
                <div className="bg-mint-glow/40 border border-brand-green/10 rounded-2xl px-4 py-2 flex justify-between items-center">
                  <span className="text-brand-green-dark text-[10px] font-bold uppercase tracking-wider">{t('profile.fullName')}</span>
                  <span className="text-zg-text text-sm font-semibold">{userName}</span>
                </div>
                
                <div className="bg-mint-glow/40 border border-brand-green/10 rounded-2xl px-4 py-2 flex justify-between items-center">
                  <span className="text-brand-green-dark text-[10px] font-bold uppercase tracking-wider">{t('profile.emailUser')}</span>
                  <span className="text-zg-text text-sm font-semibold">{user?.email || user?.username || 'N/A'}</span>
                </div>

                <div className="bg-mint-glow/40 border border-brand-green/10 rounded-2xl px-4 py-2 flex justify-between items-center">
                  <span className="text-brand-green-dark text-[10px] font-bold uppercase tracking-wider">{t('auth.phone', 'Phone')}</span>
                  <span className="text-zg-text text-sm font-semibold">{user?.phone || 'N/A'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-mint-glow/40 border border-brand-green/10 rounded-2xl px-4 py-2 flex flex-col items-start justify-center">
                    <span className="text-brand-green-dark text-[10px] font-bold uppercase tracking-wider">{t('profile.age')}</span>
                    <span className="text-zg-text text-sm font-semibold">{age}</span>
                  </div>
                  <div className="bg-mint-glow/40 border border-brand-green/10 rounded-2xl px-4 py-2 flex flex-col items-start justify-center">
                    <span className="text-brand-green-dark text-[10px] font-bold uppercase tracking-wider">{t('profile.gender')}</span>
                    <span className="text-zg-text text-sm font-semibold capitalize">{t(`profile.${gender.toLowerCase()}`) || gender}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 3. Stats cards - Citizen Only */}
        {userRole !== 'authority' && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'detections', icon: '🔍', label: t('profile.totalDetections'), value: stats.detections },
              { key: 'sos', icon: '🚨', label: t('profile.totalSOS'), value: stats.sos },
              { key: 'symptoms', icon: '🩺', label: t('profile.totalSymptoms'), value: stats.symptoms },
            ].map(({ key, icon, label, value }) => (
              <div key={key} className="bg-white border border-zg-border rounded-2xl p-3 text-center shadow-8dp flex flex-col items-center justify-center h-24">
                <div className="text-[22px] mb-0.5 grayscale hover:grayscale-0 transition-all">{icon}</div>
                <p className="text-zg-text text-[22px] font-black leading-none">{loading ? '—' : value}</p>
                <p className="text-zg-text-secondary text-[8px] font-black uppercase tracking-widest mt-1 opacity-70">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Language selector Component (Functional Retain, UI Match) */}
        <div className="bg-white border border-zg-border rounded-[20px] p-3 shadow-8dp flex items-center justify-between">
          <p className="text-brand-green-dark text-[10px] font-black uppercase tracking-wider px-2">{t('profile.language')}</p>
          <div className="flex bg-warm-cream rounded-[16px] p-1 border border-zg-border w-[200px] overflow-hidden">
            {[{ code: 'en', label: 'ENG' }, { code: 'hi', label: 'HIN' }, { code: 'mr', label: 'MAR' }].map((lang) => {
              const isActive = currentLang === lang.code || (currentLang && currentLang.startsWith(lang.code));
              return (
              <button key={lang.code} onClick={() => changeLanguage(lang.code)}
                className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-colors ${isActive ? 'bg-mint-glow text-brand-green shadow-sm border border-brand-green/20' : 'text-zg-text-secondary hover:text-zg-text'}`}>
                {lang.label}
              </button>
            )})}
          </div>
        </div>


        {/* History tabs - Citizen Only */}
        {userRole !== 'authority' && (
          <div className="bg-white border border-zg-border rounded-[24px] overflow-hidden shadow-12dp mt-4">
            <div className="flex border-b border-zg-border bg-warm-cream/50">
              {TABS.map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === tab ? 'text-brand-green bg-white shadow-[-4px_0_10px_rgba(0,0,0,0.02)] border-b-2 border-brand-green -mb-px relative z-10' : 'text-zg-text-secondary hover:text-zg-text hover:bg-white/50'}`}>
                  {tab === 'detections' ? t('profile.totalDetections') : tab === 'sos' ? t('profile.totalSOS') : t('profile.totalSymptoms')}
                </button>
              ))}
            </div>

            <div className="p-3 max-h-[300px] overflow-y-auto bg-white min-h-[150px]">
              {loading ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-brand-green/30 border-t-brand-green rounded-full animate-spin" /></div>
              ) : activeTab === 'detections' ? (
                detections.length === 0 ? (
                  <p className="text-zg-text-secondary text-xs italic font-semibold text-center py-6">{t('profile.noData')}</p>
                ) : (
                  <div className="space-y-2">
                    {detections.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 bg-warm-cream rounded-2xl px-3 py-2.5 border border-zg-border">
                        <div className="flex-1 min-w-0">
                          <p className="text-zg-text text-sm font-black truncate">{r.detected ? (r.snake_type || 'Snake Detected') : t('profile.notDetected')}</p>
                          <p className="text-zg-text-secondary text-[10px] font-medium">{formatDate(r.created_at)}</p>
                        </div>
                        <span className={riskBadge(r.risk_level)}>{r.risk_level}</span>
                      </div>
                    ))}
                  </div>
                )
              ) : activeTab === 'sos' ? (
                sosAlerts.length === 0 ? (
                  <p className="text-zg-text-secondary text-xs italic font-semibold text-center py-6">{t('profile.noData')}</p>
                ) : (
                  <div className="space-y-2">
                    {sosAlerts.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 bg-brand-red/5 rounded-2xl px-3 py-2.5 border border-brand-red/10">
                        <div className="flex-1 min-w-0">
                          <p className="text-brand-red text-sm font-black flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-brand-red rounded-full animate-pulse" />
                            SOS ALERT
                          </p>
                          <p className="text-zg-text-secondary text-[10px] font-medium my-0.5 truncate">{r.location_name || `${r.latitude?.toFixed(4)}, ${r.longitude?.toFixed(4)}`}</p>
                          <p className="text-zg-text-muted text-[9px] font-bold uppercase">{formatDate(r.created_at)}</p>
                        </div>
                        <span className={riskBadge(r.risk_level)}>{r.severity || r.risk_level}</span>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                symptomLogs.length === 0 ? (
                  <p className="text-zg-text-secondary text-xs italic font-semibold text-center py-6">{t('profile.noData')}</p>
                ) : (
                  <div className="space-y-2">
                    {symptomLogs.map((l) => (
                      <div key={l.id} className="bg-warm-cream rounded-2xl px-3 py-2.5 border border-zg-border">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-brand-green-dark text-sm font-black">Symptom Check</p>
                          <span className={riskBadge(l.risk_level)}>{l.severity}</span>
                        </div>
                        {l.result && <p className="text-zg-text-secondary text-xs truncate mb-1">{l.result}</p>}
                        <p className="text-zg-text-muted text-[10px] font-bold uppercase">{formatDate(l.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* 4. Action Button (Sign Out) */}
        <div className="pt-2">
          <Link to="/" onClick={logout}
            className="flex items-center justify-center gap-2 w-full h-[52px] rounded-[20px] bg-brand-red text-wrap text-white shadow-float-red font-black text-sm tracking-wide transition-all active:scale-[0.97] group">
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            {t('profile.signOut')}
          </Link>
        </div>

      </div>
    </div>
  );
}
