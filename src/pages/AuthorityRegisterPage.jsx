import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthorityRegisterPage() {
  const { registerAuthority } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ organization_name: '', gr_number: '', password: '', antivenom_available: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.organization_name.trim() || !form.gr_number.trim() || !form.password.trim()) { setError('Please fill in all required fields'); return; }
    if (form.password.length < 4) { setError('Password must be at least 4 characters'); return; }
    setLoading(true);
    const result = await registerAuthority({ organization_name: form.organization_name.trim(), gr_number: form.gr_number.trim(), password: form.password, antivenom_available: form.antivenom_available });
    setLoading(false);
    if (result.success) { navigate('/authority-login'); } else { setError(result.message); }
  };

  return (
    <div className="fixed inset-0 bg-zg-bg flex flex-col items-center justify-center px-6 overflow-y-auto">
      <div className="absolute top-[-100px] left-[-60px] w-[250px] h-[250px] rounded-full bg-red-50 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm py-12 animate-fade-in-up relative z-10">
        <Link to="/authority-login" className="text-zg-text-secondary text-sm font-medium mb-8 inline-flex items-center gap-1.5 hover:text-zg-text transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Back to Login
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-emergency flex items-center justify-center shadow-float-red">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-zg-text">Authority Registration</h1>
          <p className="text-zg-text-secondary text-sm mt-1">Register as an emergency responder</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4">
            <p className="text-zg-emergency text-sm font-semibold text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-zg-text-secondary text-xs font-semibold uppercase tracking-wider block mb-1.5">Organization Name</label>
            <input id="auth-register-org" type="text" value={form.organization_name} onChange={(e) => updateField('organization_name', e.target.value)} placeholder="e.g. District Hospital, Pune"
              className="w-full h-12 rounded-2xl border border-zg-border bg-zg-card text-zg-text text-sm px-4 outline-none focus:border-zg-emergency/40 focus:ring-2 focus:ring-red-100 transition-all placeholder:text-zg-text-muted" />
          </div>
          <div>
            <label className="text-zg-text-secondary text-xs font-semibold uppercase tracking-wider block mb-1.5">GR Number</label>
            <input id="auth-register-gr" type="text" value={form.gr_number} onChange={(e) => updateField('gr_number', e.target.value)} placeholder="Unique GR Number"
              className="w-full h-12 rounded-2xl border border-zg-border bg-zg-card text-zg-text text-sm px-4 outline-none focus:border-zg-emergency/40 focus:ring-2 focus:ring-red-100 transition-all placeholder:text-zg-text-muted" />
          </div>
          <div>
            <label className="text-zg-text-secondary text-xs font-semibold uppercase tracking-wider block mb-1.5">Password</label>
            <input id="auth-register-password" type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} placeholder="Choose a password"
              className="w-full h-12 rounded-2xl border border-zg-border bg-zg-card text-zg-text text-sm px-4 outline-none focus:border-zg-emergency/40 focus:ring-2 focus:ring-red-100 transition-all placeholder:text-zg-text-muted" autoComplete="new-password" />
          </div>

          <div className="flex items-center justify-between bg-zg-card border border-zg-border rounded-2xl px-4 py-3.5 shadow-float">
            <div>
              <p className="text-zg-text text-sm font-semibold">Antivenom Available</p>
              <p className="text-zg-text-secondary text-xs mt-0.5">Does your facility stock antivenom?</p>
            </div>
            <button type="button" onClick={() => updateField('antivenom_available', !form.antivenom_available)}
              className={`relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${form.antivenom_available ? 'bg-zg-success' : 'bg-zg-border'}`} aria-label="Toggle antivenom availability">
              <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-200 ${form.antivenom_available ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <button id="auth-register-submit" type="submit" disabled={loading}
            className="w-full h-12 rounded-2xl gradient-emergency text-white font-bold text-base transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-float-red"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Registering...</span>
            ) : 'Register Authority'}
          </button>
        </form>

        <p className="text-center mt-6 text-zg-text-secondary text-sm">
          Already registered?{' '}
          <Link to="/authority-login" className="text-zg-emergency font-semibold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
