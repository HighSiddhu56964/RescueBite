import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function EntryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-zg-bg flex flex-col items-center justify-center px-6">
      {/* Decorative orbs */}
      <div className="absolute top-[-120px] right-[-80px] w-[300px] h-[300px] rounded-full bg-zg-indigo/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-60px] w-[250px] h-[250px] rounded-full bg-zg-celestial/60 blur-3xl pointer-events-none" />

      {/* Logo & Branding */}
      <div className="text-center mb-12 animate-fade-in-up relative z-10">
        <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-zg-indigo to-purple-500 flex items-center justify-center shadow-float-indigo">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold text-zg-text tracking-tight">
          Rescue<span className="text-zg-indigo">Bite</span>
        </h1>
        <p className="text-zg-text-secondary text-sm mt-2 tracking-wide font-medium">
          Emergency Snakebite Response System
        </p>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-xs space-y-3.5 animate-fade-in-up relative z-10">
        <Link
          to="/user-login"
          id="entry-user-login"
          className="block w-full py-4 rounded-2xl gradient-indigo text-white text-center text-base font-bold transition-all active:scale-[0.97] shadow-float-indigo"
        >
          <span className="inline-flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            User Login
          </span>
        </Link>

        <Link
          to="/authority-login"
          id="entry-authority-login"
          className="block w-full py-4 rounded-2xl bg-zg-card border-2 border-zg-border text-zg-text text-center text-base font-bold transition-all active:scale-[0.97] shadow-float hover:shadow-float-lg hover:border-zg-indigo/30"
        >
          <span className="inline-flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Authority Login
          </span>
        </Link>
        
        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-zg-border"></div>
          <span className="flex-shrink-0 mx-4 text-zg-text-muted text-[10px] font-black uppercase tracking-widest">or</span>
          <div className="flex-grow border-t border-zg-border"></div>
        </div>

        <Link
          to="/sos"
          id="entry-quick-sos"
          className="block w-full py-4 rounded-2xl bg-brand-red text-white text-center text-base font-bold transition-all active:scale-[0.97] shadow-float-red border border-white/20"
        >
          <span className="inline-flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 21V19C10 17.3431 11.3431 16 13 16H15C16.6569 16 18 14.6569 18 13V11C18 9.34315 16.6569 8 15 8H9C7.34315 8 6 6.65685 6 5V3" />
              <path d="M10 21C10 22.1046 10.8954 23 12 23C13.1046 23 14 22.1046 14 21V19C14 17.3431 16.6569 16 18.3137 16" />
            </svg>
            Quick Emergency SOS
          </span>
        </Link>
      </div>

      {/* Quick access if already logged in */}
      {user && (
        <div className="mt-8 animate-fade-in-up relative z-10">
          <button
            onClick={() => navigate(user.role === 'authority' ? '/dashboard' : '/home')}
            className="text-zg-indigo text-sm font-semibold underline underline-offset-4 hover:text-zg-indigo-dark transition-colors"
          >
            Continue as {user.name || user.username || 'logged-in user'} →
          </button>
        </div>
      )}

      {/* Footer */}
      <p className="absolute bottom-8 text-zg-text-muted text-[11px] font-medium">
        RescueBite v2.0 • Emergency Response
      </p>
    </div>
  );
}
