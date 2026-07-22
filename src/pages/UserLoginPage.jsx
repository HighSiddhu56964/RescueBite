import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'hi', label: 'Hindi (हिंदी)' },
  { code: 'en', label: 'English' },
  { code: 'mr', label: 'Marathi (मराठी)' }
];

export default function UserLoginPage() {
  const { t, i18n } = useTranslation();
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('snakesafe_language', code);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) { setError('Please fill in all fields'); return; }
    setLoading(true);
    const result = await loginUser(username.trim(), password);
    setLoading(false);
    if (result.success) { navigate('/home'); } else { setError(result.message); }
  };

  return (
    <div className="fixed inset-0 bg-zg-bg flex flex-col items-center justify-center px-6">
      {/* Decorative orb */}
      <div className="absolute top-[-80px] left-[-60px] w-[250px] h-[250px] rounded-full bg-zg-indigo/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm animate-fade-in-up relative z-10">
        {/* Back */}
        <Link to="/" className="text-zg-text-secondary text-sm font-medium mb-8 inline-flex items-center gap-1.5 hover:text-zg-text transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {t('app.back')}
        </Link>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-indigo flex items-center justify-center shadow-float-indigo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-zg-text">{t('login.welcome')}</h1>
          <p className="text-zg-text-secondary text-sm mt-1">{t('login.desc')}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4">
            <p className="text-zg-emergency text-sm font-semibold text-center">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-zg-text-secondary text-[11px] font-bold uppercase tracking-wider block mb-1.5">{t('login.userLabel')}</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-12 rounded-2xl border border-zg-border bg-zg-card text-zg-text text-sm px-4 outline-none focus:border-zg-indigo/50 focus:ring-2 focus:ring-zg-indigo/10 transition-all placeholder:text-zg-text-muted"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-zg-text-secondary text-[11px] font-bold uppercase tracking-wider block mb-1.5">{t('login.passLabel')}</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 rounded-2xl border border-zg-border bg-zg-card text-zg-text text-sm px-4 outline-none focus:border-zg-indigo/50 focus:ring-2 focus:ring-zg-indigo/10 transition-all placeholder:text-zg-text-muted"
              autoComplete="current-password"
            />
          </div>

          {/* Linguistic Glide Selector */}
          <div className="pt-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zg-text-secondary mb-2">{t('login.language')}</p>
            <div className="flex gap-2">
              {LANGUAGES.map((lang) => {
                const isSelected = i18n.language === lang.code || (i18n.language && i18n.language.startsWith(lang.code));
                return (
                  <button 
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border
                      ${isSelected 
                        ? 'bg-mint-glow text-brand-green border-brand-green/30 shadow-sm' 
                        : 'bg-zg-card text-zg-text-secondary border-zg-border hover:bg-zg-bg'}`}
                  >
                    {lang.label.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl gradient-indigo text-white font-bold text-base transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-float-indigo"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </span>
            ) : t('login.submit')}
          </button>
        </form>

        <p className="text-center mt-6 text-zg-text-secondary text-sm">
          {t('login.noAccount')} {' '}
          <Link to="/user-register" className="text-zg-indigo font-bold hover:underline">
            {t('login.register')}
          </Link>
        </p>
      </div>
    </div>
  );
}
