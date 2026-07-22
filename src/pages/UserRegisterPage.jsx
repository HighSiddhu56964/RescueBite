import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'hi', label: 'Hindi (हिंदी)' },
  { code: 'gu', label: 'Gujarati (ગુજરાતી)' },
  { code: 'en', label: 'English' },
  { code: 'mr', label: 'Marathi (मराठी)' },
  { code: 'bn', label: 'Bengali (বাংলা)' }
];

export default function UserRegisterPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { registerUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', username: '', password: '', 
    age: '', gender: '', phone: '',
    role: 'user', lang: 'en'
  });
  const scrollRef = useRef(null);

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  const updateField = (field, value) => setFormData((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim() || !formData.age || !formData.username.trim() || !formData.password.trim() || !formData.phone.trim()) { setError('Please fill in all fields'); return; }
    if (parseInt(formData.age, 10) < 1 || parseInt(formData.age, 10) > 120) { setError('Please enter a valid age'); return; }
    if (formData.password.length < 4) { setError('Password must be at least 4 characters'); return; }
    setLoading(true);
    const result = await registerUser(formData);
    setLoading(false);
    if (result.success) { navigate('/user-login'); } else { setError(result.message); }
  };

  return (
    <div className="fixed inset-0 bg-warm-cream flex flex-col items-center overflow-y-auto overflow-x-hidden pt-12 pb-32">
      
      {/* 3D Topographic Background Shift Animation layer */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 transition-transform duration-700 ease-out"
        style={{ 
          backgroundImage: 'radial-gradient(circle at center, transparent 30%, #F9F9F9 100%), repeating-radial-gradient(circle at center, transparent, transparent 20px, rgba(27, 94, 32, 0.1) 21px, rgba(27, 94, 32, 0.1) 21px)',
          backgroundSize: '100% 100%',
          transform: 'translateY(10%) scale(1.1)',
        }}
      />

      <div className="w-full max-w-sm relative z-10 px-6 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
        {/* Toggle Login -> Register UI */}
        <div className="flex bg-white rounded-full p-1 border border-zg-border shadow-8dp mb-8 w-max mx-auto relative overflow-hidden">
          <Link to="/user-login" className="px-6 py-2 text-sm font-semibold text-zg-text-secondary z-10">Login</Link>
          <div className="px-6 py-2 text-sm font-bold text-brand-green z-10 relative">
            Register
            <div className="absolute inset-0 bg-mint-glow rounded-full -z-10 shadow-[0_0_10px_rgba(209,250,229,0.8)]" />
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-6 shadow-12dp border border-white/50 relative overflow-hidden">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-zg-text">Create Account</h1>
            <p className="text-zg-text-secondary text-sm">Join the RescueBite network</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4">
              <p className="text-zg-emergency text-sm font-semibold text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input id="register-name" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name"
                className="w-full h-14 rounded-2xl border border-zg-border bg-zg-bg text-zg-text text-sm px-4 outline-none focus:border-brand-green/50 focus:bg-white transition-all placeholder:text-zg-text-muted" />
            </div>

            <div>
              <input id="register-phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number"
                className="w-full h-14 rounded-2xl border border-zg-border bg-zg-bg text-zg-text text-sm px-4 outline-none focus:border-brand-green/50 focus:bg-white transition-all placeholder:text-zg-text-muted" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input id="register-age" type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Age" min="1" max="120"
                className="w-full h-14 rounded-2xl border border-zg-border bg-zg-bg text-zg-text text-sm px-4 outline-none focus:border-brand-green/50 focus:bg-white transition-all placeholder:text-zg-text-muted" />
              <div className="flex bg-zg-bg rounded-2xl p-1 border border-zg-border">
                {['M', 'F', 'O'].map((g) => (
                  <button key={g} type="button" onClick={() => updateField('gender', g)}
                    className={`flex-1 rounded-xl text-xs font-bold transition-colors ${formData.gender === g ? 'bg-mint-glow text-brand-green shadow-sm' : 'text-zg-text-secondary hover:text-zg-text'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <input id="register-username" type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Username"
                className="w-full h-14 rounded-2xl border border-zg-border bg-zg-bg text-zg-text text-sm px-4 outline-none focus:border-brand-green/50 focus:bg-white transition-all placeholder:text-zg-text-muted" autoComplete="username" />
            </div>

            <div>
              <input id="register-password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password"
                className="w-full h-14 rounded-2xl border border-zg-border bg-zg-bg text-zg-text text-sm px-4 outline-none focus:border-brand-green/50 focus:bg-white transition-all placeholder:text-zg-text-muted" autoComplete="new-password" />
            </div>

            {/* Linguistic Glide Selector */}
            <div className="pt-2 pb-2">
              <p className="text-[11px] italic font-medium text-zg-text-secondary text-center mb-3">
                "We’ll speak your language during emergencies."
              </p>
              
              <div className="relative w-full h-12 overflow-hidden flex items-center">
                {/* Horizontal scroll container with hidden scrollbar */}
                <div 
                  ref={scrollRef}
                  className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 py-2 w-full no-scrollbar items-center justify-center mask-edges"
                  style={{ maskImage: 'linear-gradient(90deg, transparent, black 15%, black 85%, transparent)' }}
                >
                  {LANGUAGES.map((lang) => {
                    const isSelected = formData.lang === lang.code;
                    return (
                      <button 
                        key={lang.code}
                        type="button"
                        onClick={() => updateField('lang', lang.code)}
                        className={`flex-shrink-0 snap-center transition-all duration-300 ease-out flex items-center justify-center gap-1.5 whitespace-nowrap
                          ${isSelected 
                            ? 'bg-mint-glow border-2 border-brand-green/20 text-brand-green-dark shadow-8dp scale-[1.1] z-10' 
                            : 'bg-transparent border border-zg-border text-zg-text-secondary scale-95 opacity-80 hover:opacity-100'}
                        `}
                        style={{ padding: '8px 16px', borderRadius: '20px' }}
                      >
                        {isSelected && (
                          <svg className="w-3.5 h-3.5 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        <span className={`text-[11px] ${isSelected ? 'font-bold' : 'font-medium'}`}>{lang.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
              `}</style>
            </div>

            <button id="register-submit" type="submit" disabled={loading}
              className="w-full h-14 rounded-[20px] gradient-register-pulse text-white font-black text-[15px] transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-[0_8px_20px_-4px_rgba(124,58,237,0.4)] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              {loading ? (
                <span className="inline-flex items-center gap-2 relative z-10">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Launching...
                </span>
              ) : (
                <span className="relative z-10 tracking-wide">Register Account</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Emergency Bypass Persistence Bottom Blocks */}
      <div className="fixed bottom-6 left-6 right-6 z-[100] flex gap-4 pointer-events-auto h-16">
        <Link to="/detect" className="flex-1 bg-brand-green rounded-2xl shadow-float-green flex flex-col items-center justify-center text-white active:scale-95 transition-transform border border-white/20">
          <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Detect</span>
        </Link>
        <Link to="/sos" className="flex-1 gradient-emergency rounded-2xl shadow-float-red flex flex-col items-center justify-center text-white active:scale-95 transition-transform border border-white/20">
          <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">Emergency</span>
        </Link>
      </div>

    </div>
  );
}
