import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthorityLoginPage() {
  const { loginAuthority } = useAuth();
  const navigate = useNavigate();
  const [grNumber, setGrNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!grNumber.trim() || !password.trim()) { setError('Please fill in all fields'); return; }
    setLoading(true);
    const result = await loginAuthority(grNumber.trim(), password);
    setLoading(false);
    if (result.success) { navigate('/dashboard'); } else { setError(result.message); }
  };

  return (
    <div className="fixed inset-0 bg-zg-bg flex flex-col items-center justify-center px-6">
      <div className="absolute bottom-[-100px] right-[-80px] w-[300px] h-[300px] rounded-full bg-red-50 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm animate-fade-in-up relative z-10">
        <Link to="/" className="text-zg-text-secondary text-sm font-medium mb-8 inline-flex items-center gap-1.5 hover:text-zg-text transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Back
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-emergency flex items-center justify-center shadow-float-red">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-zg-text">Authority Portal</h1>
          <p className="text-zg-text-secondary text-sm mt-1">Emergency responder access</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4">
            <p className="text-zg-emergency text-sm font-semibold text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-zg-text-secondary text-xs font-semibold uppercase tracking-wider block mb-1.5">GR Number</label>
            <input id="authority-gr" type="text" value={grNumber} onChange={(e) => setGrNumber(e.target.value)} placeholder="Enter GR Number"
              className="w-full h-12 rounded-2xl border border-zg-border bg-zg-card text-zg-text text-sm px-4 outline-none focus:border-zg-emergency/40 focus:ring-2 focus:ring-red-100 transition-all placeholder:text-zg-text-muted" />
          </div>
          <div>
            <label className="text-zg-text-secondary text-xs font-semibold uppercase tracking-wider block mb-1.5">Password</label>
            <input id="authority-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password"
              className="w-full h-12 rounded-2xl border border-zg-border bg-zg-card text-zg-text text-sm px-4 outline-none focus:border-zg-emergency/40 focus:ring-2 focus:ring-red-100 transition-all placeholder:text-zg-text-muted" autoComplete="current-password" />
          </div>
          <button id="authority-submit" type="submit" disabled={loading}
            className="w-full h-12 rounded-2xl gradient-emergency text-white font-bold text-base transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-float-red"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</span>
            ) : 'Login as Authority'}
          </button>
        </form>

        <p className="text-center mt-6 text-zg-text-secondary text-sm">
          Don't have an account?{' '}
          <Link to="/authority-register" className="text-zg-emergency font-semibold hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
